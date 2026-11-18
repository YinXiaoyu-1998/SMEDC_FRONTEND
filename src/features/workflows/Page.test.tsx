import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  WorkflowsPrepareEnterpriseWorkflowChangeBody,
  WorkflowsSaveEnterpriseWorkflowBody,
} from "@/api/generated/contract";
import {
  createWorkflowApi,
  dailyConfiguration,
  dailyView,
  previewResponse,
  sampleAuthorizations,
  viewsWithSources,
  type ApiCall,
} from "@/features/workflows/testFixtures";
import { adminSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

const ENTERPRISE_PATH = "/admin/org-1/workflows/enterprise-1";

function renderDeepLink(
  api: ReturnType<typeof createWorkflowApi>,
  path = ENTERPRISE_PATH,
) {
  api.install();
  return renderApp({
    session: adminSession,
    initialEntries: [path],
  });
}

function bodyOf<T>(call: ApiCall): T {
  return call.body as T;
}

// 配置区块与持续授权区块都有“处理门店”复选框，测试按区块定位
function sectionByHeading(name: string): HTMLElement {
  const heading = screen.getByRole("heading", { name });
  const section = heading.closest("section");
  if (section === null) throw new Error(`找不到${name}区块`);
  return section;
}

function configurationSection(): HTMLElement {
  return sectionByHeading("任务业务设置");
}

function configCheckbox(name: string): HTMLElement {
  return within(configurationSection()).getByRole("checkbox", { name });
}

function configSaveButton(): HTMLElement {
  return within(configurationSection()).getByRole("button", {
    name: "保存任务设置",
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("自动任务页", () => {
  it("深链首次加载时读取指定企业并渲染业务设置", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);

    expect(
      await screen.findByRole("heading", { name: "任务业务设置" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "每日数据采集入库" }),
    ).toHaveAttribute("aria-current", "page");
    expect(configCheckbox("门店A")).toBeChecked();
    expect(
      screen.getByRole("heading", { name: "指定电脑与最近状态" }),
    ).toBeInTheDocument();
    expect(configSaveButton()).toBeDisabled();

    const listCall = api.calls.find((call) =>
      call.url.endsWith("/workflows/list_enterprise_workflows"),
    );
    expect(listCall).toBeDefined();
    if (listCall === undefined) return;
    expect(bodyOf<{ enterpriseKey: string }>(listCall)).toMatchObject({
      enterpriseKey: "enterprise-1",
    });
  });

  it("没有业务企业时显示创建引导并禁用入口", async () => {
    const api = createWorkflowApi({ enterprises: [] });
    api.install();
    renderApp({
      session: adminSession,
      initialEntries: ["/admin/org-1/workflows"],
    });

    expect(
      await screen.findByText("请先在权限设置登记业务企业，再设置自动任务。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "自动任务" })).toBeDisabled();
  });

  it("企业尚未配置时显示 needsConfiguration 与创建引导", async () => {
    const api = createWorkflowApi({ views: [], needsConfiguration: true });
    renderDeepLink(api);

    expect(
      await screen.findByText("该企业尚未完成自动任务配置。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "请先在权限设置登记业务企业与标准门店，再回到本页配置自动任务。",
      ),
    ).toBeInTheDocument();
  });

  it("请求失败时显示映射后的错误并可重试", async () => {
    const api = createWorkflowApi({
      listFailure: { status: 500, code: "INTERNAL_ERROR" },
    });
    renderDeepLink(api);

    expect(
      await screen.findByText("服务器暂时无法处理该操作，请稍后重试"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument();
  });

  it("权限被拒绝时显示 403 页面", async () => {
    const api = createWorkflowApi({
      listFailure: { status: 403, code: "BROWSER_ACCESS_DENIED" },
    });
    renderDeepLink(api);

    expect(
      await screen.findByRole("heading", { name: "无访问权限" }),
    ).toBeInTheDocument();
  });

  it("门店选回原范围后保持保存置灰", async () => {
    const api = createWorkflowApi({
      views: [
        dailyView({ configuration: dailyConfiguration(["门店A", "门店B"]) }),
      ],
    });
    renderDeepLink(api);
    await screen.findByRole("heading", { name: "任务业务设置" });

    fireEvent.click(configCheckbox("门店A"));
    expect(configSaveButton()).toBeEnabled();
    fireEvent.click(configCheckbox("门店A"));
    expect(configSaveButton()).toBeDisabled();
  });

  it("保存任务设置后保留来源的未提交草稿", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);
    await screen.findByRole("heading", { name: "美团管家来源设置" });
    const source = within(sectionByHeading("美团管家来源设置"));
    fireEvent.click(source.getAllByRole("button", { name: "添加" })[0]!);
    fireEvent.change(source.getByLabelText("账号显示名称"), {
      target: { value: "未保存的来源" },
    });

    fireEvent.click(configCheckbox("门店B"));
    fireEvent.click(configSaveButton());
    await screen.findByRole("heading", { name: "核对本次变更" });
    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));
    await screen.findByText("已保存。配置保存不代表任务已安装或启用。");

    expect(source.getByLabelText("账号显示名称")).toHaveValue("未保存的来源");
    expect(configSaveButton()).toBeDisabled();
  });

  it("保存任务设置成功时走准备、确认与提交", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "任务业务设置" });
    const save = configSaveButton();

    fireEvent.click(configCheckbox("门店B"));
    await waitFor(() => expect(save).toBeEnabled());

    fireEvent.click(save);
    expect(
      await screen.findByRole("heading", { name: "核对本次变更" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));

    expect(
      await screen.findByText("已保存。配置保存不代表任务已安装或启用。"),
    ).toBeInTheDocument();

    const prepareCall = api.calls.find((call) =>
      call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
    );
    expect(prepareCall).toBeDefined();
    if (prepareCall === undefined) return;
    const prepareBody =
      bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(prepareCall);
    expect(prepareBody).toMatchObject({
      enterpriseKey: "enterprise-1",
      workflowType: "meituan-daily-ingestion",
      expectedVersion: 2,
      expectedIntegrationVersion: 3,
      expectedControlVersion: 1,
    });
    expect(prepareBody.change).toMatchObject({
      kind: "configuration",
      configuration: { storeNames: ["门店A", "门店B"] },
    });

    const saveCall = api.calls.find((call) =>
      call.url.endsWith("/workflows/save_enterprise_workflow"),
    );
    expect(saveCall).toBeDefined();
    if (saveCall === undefined) return;
    expect(bodyOf<WorkflowsSaveEnterpriseWorkflowBody>(saveCall)).toMatchObject(
      {
        previewId: "preview-1",
        confirmationDigest: "a".repeat(64),
      },
    );

    await waitFor(() => expect(configSaveButton()).toBeDisabled());
    expect(configCheckbox("门店B")).toBeChecked();
  });

  it("版本冲突时保留草稿并可用服务端最新值恢复", async () => {
    const api = createWorkflowApi({
      save: () =>
        jsonResponse(
          {
            error: {
              code: "WORKFLOW_VERSION_CONFLICT",
              message: "conflict",
            },
          },
          409,
        ),
    });
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "任务业务设置" });
    const save = configSaveButton();
    fireEvent.click(configCheckbox("门店B"));
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await screen.findByRole("heading", { name: "核对本次变更" });
    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));

    // 服务端在这期间被其他人改成了版本 3
    api.state.views = [
      dailyView({ version: 3, configuration: dailyConfiguration(["门店A"]) }),
    ];

    expect(
      await screen.findByRole("heading", { name: "版本冲突" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "配置已被其他操作更改。草稿已保留；请比较最新配置后重新确认。",
      ),
    ).toBeInTheDocument();
    expect(configCheckbox("门店B")).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "版本冲突" }),
      ).not.toBeInTheDocument(),
    );
    expect(configCheckbox("门店A")).toBeChecked();
    expect(configCheckbox("门店B")).not.toBeChecked();
  });

  it("版本冲突后可用草稿重新准备并提交", async () => {
    let attempts = 0;
    const api = createWorkflowApi({
      save: () => {
        attempts += 1;
        if (attempts === 1) {
          return jsonResponse(
            {
              error: {
                code: "WORKFLOW_VERSION_CONFLICT",
                message: "conflict",
              },
            },
            409,
          );
        }
        return undefined;
      },
    });
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "任务业务设置" });
    const save = configSaveButton();
    fireEvent.click(configCheckbox("门店B"));
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await screen.findByRole("heading", { name: "核对本次变更" });
    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));

    api.state.views = [
      dailyView({ version: 3, configuration: dailyConfiguration(["门店A"]) }),
    ];
    await screen.findByRole("heading", { name: "版本冲突" });

    fireEvent.click(
      screen.getByRole("button", {
        name: "用我的改动重新提交",
      }),
    );

    await screen.findByRole("heading", { name: "核对本次变更" });
    const prepareCalls = api.calls.filter((call) =>
      call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
    );
    expect(prepareCalls).toHaveLength(2);
    const retry = prepareCalls[1];
    if (retry === undefined) return;
    expect(
      bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(retry),
    ).toMatchObject({
      expectedVersion: 3,
      expectedControlVersion: 1,
      change: {
        kind: "configuration",
        configuration: { storeNames: ["门店A", "门店B"] },
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));
    expect(
      await screen.findByText("已保存。配置保存不代表任务已安装或启用。"),
    ).toBeInTheDocument();

    const saveCalls = api.calls.filter((call) =>
      call.url.endsWith("/workflows/save_enterprise_workflow"),
    );
    const finalSave = saveCalls[1];
    if (finalSave === undefined) return;
    expect(
      bodyOf<WorkflowsSaveEnterpriseWorkflowBody>(finalSave),
    ).toMatchObject({
      expectedVersion: 3,
    });
  });

  it("必填校验失败时置灰保存按钮并给出字段错误，提交期间保持忙碌", async () => {
    let release: (() => void) | null = null;
    const api = createWorkflowApi({
      prepare: (request) =>
        new Promise<Response>((resolve) => {
          release = () => resolve(previewResponse(request));
        }),
    });
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "任务业务设置" });
    const save = configSaveButton();

    fireEvent.click(configCheckbox("门店A"));
    await waitFor(() =>
      expect(
        within(configurationSection()).getByRole("alert"),
      ).toHaveTextContent("请至少选择一家处理门店。"),
    );
    expect(save).toBeDisabled();

    fireEvent.click(configCheckbox("门店A"));
    fireEvent.click(configCheckbox("门店B"));
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await waitFor(() => expect(save).toHaveAttribute("aria-busy", "true"));
    expect(save).toBeDisabled();

    expect(release).not.toBeNull();
    const resume = release as (() => void) | null;
    if (resume !== null) resume();
    expect(
      await screen.findByRole("heading", { name: "核对本次变更" }),
    ).toBeInTheDocument();
  });

  it("切换英文后使用英文文案而业务名称保持原样", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "任务业务设置" });
    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(
      await screen.findByRole("heading", { name: "Task settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Daily data ingestion" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save task settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "示例企业" }),
    ).toBeInTheDocument();
  });

  it("未指定企业时选择后进入深链", async () => {
    const api = createWorkflowApi();
    api.install();
    const { router } = renderApp({
      session: adminSession,
      initialEntries: ["/admin/org-1/workflows"],
    });

    const select = await screen.findByRole("combobox", { name: "业务企业" });
    fireEvent.change(select, { target: { value: "enterprise-1" } });
    fireEvent.click(screen.getByRole("button", { name: "自动任务" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ENTERPRISE_PATH),
    );
    expect(
      await screen.findByRole("heading", { name: "任务业务设置" }),
    ).toBeInTheDocument();

    const listCalls = api.calls.filter((call) =>
      call.url.endsWith("/workflows/list_enterprise_workflows"),
    );
    expect(listCalls.length).toBeGreaterThanOrEqual(2);
    const first = listCalls[0];
    if (first === undefined) return;
    expect(bodyOf<{ limit: number }>(first)).toMatchObject({ limit: 1 });
  });

  it("来源设置可编辑并通过准备-确认保存", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "美团管家来源设置" });
    const section = sectionByHeading("美团管家来源设置");
    const add = within(section).getAllByRole("button", { name: "添加" });
    const firstAdd = add[0];
    if (firstAdd === undefined) throw new Error("缺少来源账号添加按钮");
    fireEvent.click(firstAdd);

    fireEvent.change(
      within(section).getByLabelText("账号标记（用于区分来源账号）"),
      { target: { value: "erp-main" } },
    );
    fireEvent.change(within(section).getByLabelText("账号显示名称"), {
      target: { value: "美团管家主账号" },
    });
    fireEvent.change(within(section).getByLabelText("来源企业名称"), {
      target: { value: "示例企业" },
    });

    const save = within(section).getByRole("button", {
      name: "保存来源设置",
    });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await screen.findByRole("heading", { name: "核对本次变更" });
    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));
    await screen.findByText("已保存。配置保存不代表任务已安装或启用。");

    const prepareCall = api.calls.find((call) =>
      call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
    );
    if (prepareCall === undefined) return;
    expect(
      bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(prepareCall).change,
    ).toMatchObject({
      kind: "integration",
      configuration: {
        sourceAccounts: [
          {
            product: "meituan_erp",
            accountRef: "erp-main",
            displayName: "美团管家主账号",
            sourceEnterpriseName: "示例企业",
          },
        ],
      },
    });
  });

  it("按任务显示来源设置并通过 URL 恢复周报标签页", async () => {
    const api = createWorkflowApi({ views: viewsWithSources() });
    const { router, unmount } = renderDeepLink(api);
    await screen.findByRole("heading", { name: "美团管家来源设置" });

    expect(
      screen.queryByRole("button", { name: "读取最新状态" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "账号显示名称" })).toHaveValue(
      "管家账号",
    );
    expect(screen.queryByDisplayValue("经营宝账号")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "评价处理" }));
    const reviewSource = within(sectionByHeading("经营宝来源设置"));
    expect(
      reviewSource.getByRole("textbox", { name: "账号显示名称" }),
    ).toHaveValue("经营宝账号");
    expect(
      reviewSource.queryByRole("option", { name: "管家账号" }),
    ).not.toBeInTheDocument();
    expect(reviewSource.getByDisplayValue("点评来源门店")).toBeInTheDocument();
    expect(
      reviewSource.getAllByRole("combobox", { name: "来源渠道" })[0],
    ).toHaveValue("dianping");
    expect(screen.queryByDisplayValue("管家来源门店")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "自然周经营周报" }));
    const { pathname, search } = router.state.location;
    expect(search).toBe("?task=weekly-business-report");
    unmount();

    renderDeepLink(api, pathname + search);
    await screen.findByRole("heading", { name: "任务业务设置" });
    expect(
      screen.getByRole("button", { name: "自然周经营周报" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("button", { name: "保存来源设置" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "周报邮件交付" }),
    ).toBeInTheDocument();
    const download = within(sectionByHeading("持续授权"));
    expect(
      download.getByRole("checkbox", { name: "店内订单明细" }),
    ).toBeInTheDocument();
    expect(
      download.queryByRole("checkbox", { name: "平台外卖订单明细" }),
    ).not.toBeInTheDocument();
  });

  it("来源保存冲突重试保留另一来源的服务端新值和本地草稿", async () => {
    const views = viewsWithSources();
    const initial = views[0]!.integration;
    const remote = {
      ...initial,
      version: initial.version + 1,
      configuration: {
        ...initial.configuration,
        sourceAccounts: initial.configuration.sourceAccounts.map((account) =>
          account.product === "meituan_reviews"
            ? { ...account, displayName: "经营宝远程改名" }
            : account,
        ),
        storeMappings: initial.configuration.storeMappings.map((mapping) =>
          mapping.source.product === "meituan_reviews"
            ? { ...mapping, storeName: "门店B" }
            : mapping,
        ),
        exclusions: initial.configuration.exclusions.map((exclusion) =>
          exclusion.source.product === "meituan_reviews"
            ? { ...exclusion, reason: "远程排除原因" }
            : exclusion,
        ),
      },
    };
    const api = createWorkflowApi({
      views,
      prepare: (body) =>
        body.expectedIntegrationVersion !==
        api.state.views[0]!.integration.version
          ? jsonResponse(
              {
                error: {
                  code: "WORKFLOW_VERSION_CONFLICT",
                  message: "conflict",
                },
              },
              409,
            )
          : undefined,
    });
    renderDeepLink(api);
    await screen.findByRole("heading", { name: "美团管家来源设置" });
    fireEvent.change(screen.getByRole("textbox", { name: "账号显示名称" }), {
      target: { value: "管家本地改名" },
    });
    fireEvent.click(screen.getByRole("button", { name: "评价处理" }));
    fireEvent.change(screen.getByRole("textbox", { name: "账号显示名称" }), {
      target: { value: "经营宝本地草稿" },
    });
    fireEvent.click(screen.getByRole("button", { name: "每日数据采集入库" }));

    fireEvent.click(screen.getByRole("button", { name: "保存来源设置" }));
    const preview = await screen.findByRole("dialog");
    expect(
      within(preview).queryByText("经营宝本地草稿"),
    ).not.toBeInTheDocument();
    fireEvent.click(within(preview).getByRole("button", { name: "取消" }));

    api.state.views = views.map((view) => ({ ...view, integration: remote }));
    fireEvent.click(screen.getByRole("button", { name: "保存来源设置" }));
    await screen.findByRole("heading", { name: "版本冲突" });
    fireEvent.click(screen.getByRole("button", { name: "用我的改动重新提交" }));
    await screen.findByRole("heading", { name: "核对本次变更" });

    const prepares = api.calls
      .filter((call) =>
        call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
      )
      .map((call) =>
        bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(call),
      );
    expect(prepares[0]).toMatchObject({
      expectedIntegrationVersion: initial.version,
      change: {
        configuration: {
          sourceAccounts: expect.arrayContaining([
            expect.objectContaining({ displayName: "经营宝账号" }),
          ]),
        },
      },
    });
    const retry = prepares.at(-1)!;
    expect(retry.expectedIntegrationVersion).toBe(remote.version);
    expect(retry.change).toEqual({
      kind: "integration",
      configuration: {
        ...remote.configuration,
        sourceAccounts: expect.arrayContaining(
          remote.configuration.sourceAccounts.map((account) =>
            account.product === "meituan_erp"
              ? { ...account, displayName: "管家本地改名" }
              : account,
          ),
        ),
        storeMappings: expect.arrayContaining(
          remote.configuration.storeMappings,
        ),
        exclusions: expect.arrayContaining(remote.configuration.exclusions),
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));
    await screen.findByText("已保存。配置保存不代表任务已安装或启用。");
    fireEvent.click(screen.getByRole("button", { name: "评价处理" }));
    expect(screen.getByRole("textbox", { name: "账号显示名称" })).toHaveValue(
      "经营宝本地草稿",
    );
    expect(screen.getByRole("button", { name: "保存来源设置" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "每日数据采集入库" }));
    expect(screen.getByRole("textbox", { name: "账号显示名称" })).toHaveValue(
      "管家本地改名",
    );
    expect(screen.getByRole("button", { name: "保存来源设置" })).toBeDisabled();
  });

  it.each([
    ["评价处理", "评价新稿通知", "周报交付", "review_drafts"],
    ["自然周经营周报", "周报交付", "评价新稿通知", "weekly_report"],
  ])("%s按实际任务生成邮件授权", async (task, label, otherLabel, purpose) => {
    const api = createWorkflowApi({ views: viewsWithSources() });
    renderDeepLink(api);
    await screen.findByRole("heading", { name: "任务业务设置" });
    fireEvent.click(screen.getByRole("button", { name: task }));
    const authorization = within(sectionByHeading("持续授权"));
    fireEvent.change(authorization.getByLabelText("授权动作"), {
      target: { value: "email" },
    });
    expect(authorization.getByText(label)).toBeInTheDocument();
    expect(authorization.queryByText(otherLabel)).not.toBeInTheDocument();
    expect(authorization.queryByText("异常通知")).not.toBeInTheDocument();

    fireEvent.click(authorization.getByRole("checkbox", { name: "门店A" }));
    fireEvent.change(authorization.getByLabelText("收件人（每行一个）"), {
      target: { value: "boss@example.com" },
    });
    fireEvent.change(authorization.getByLabelText("允许的发件邮箱"), {
      target: { value: "robot@example.com" },
    });
    fireEvent.click(authorization.getByRole("button", { name: "新增授权" }));
    await screen.findByRole("heading", { name: "核对本次变更" });

    const prepare = api.calls.find((call) =>
      call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
    )!;
    expect(
      bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(prepare).change,
    ).toMatchObject({
      kind: "authorization",
      grant: [{ kind: "email", purpose }],
    });
  });

  it("执行控制在缺少原因或状态未变化时置灰，填写原因后可提交", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "任务业务设置" });
    const activate = screen.getByRole("button", { name: "允许执行" });
    const pause = screen.getByRole("button", { name: "暂停任务" });
    expect(activate).toBeDisabled();
    expect(pause).toBeDisabled();

    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "按计划开启" },
    });
    await waitFor(() => expect(activate).toBeEnabled());
    // 当前已是暂停状态，暂停按钮仍然不可用
    expect(pause).toBeDisabled();

    fireEvent.click(activate);
    await screen.findByRole("heading", { name: "核对本次变更" });
    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));

    expect(
      await screen.findByText("已保存。配置保存不代表任务已安装或启用。"),
    ).toBeInTheDocument();
    expect(await screen.findByText("执行状态: 允许执行")).toBeInTheDocument();

    const prepareCall = api.calls.find((call) =>
      call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
    );
    if (prepareCall === undefined) return;
    expect(
      bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(prepareCall).change,
    ).toMatchObject({
      kind: "control",
      state: "active",
      reason: "按计划开启",
    });
  });

  it("持续授权只允许撤销仍有效的授权", async () => {
    const api = createWorkflowApi({
      views: [dailyView({ authorizations: sampleAuthorizations() })],
    });
    renderDeepLink(api);

    await screen.findByRole("heading", { name: "任务业务设置" });
    const revoke = screen.getByRole("button", {
      name: "撤销选中授权",
    });
    expect(revoke).toBeDisabled();

    const checkbox = screen.getByRole("checkbox", {
      name: /选择撤销此授权 下载经营数据 auth-1/,
    });
    fireEvent.click(checkbox);
    await waitFor(() => expect(revoke).toBeEnabled());
    fireEvent.click(revoke);

    await screen.findByRole("heading", { name: "核对本次变更" });
    fireEvent.click(screen.getByRole("button", { name: "确认本次变更" }));
    await screen.findByText("已保存。配置保存不代表任务已安装或启用。");

    const prepareCall = api.calls.find((call) =>
      call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
    );
    if (prepareCall === undefined) return;
    expect(
      bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(prepareCall).change,
    ).toMatchObject({
      kind: "authorization",
      grant: [],
      revokeAuthorizationIds: ["auth-1"],
    });
    await waitFor(() => expect(revoke).toBeDisabled());
  });
});
