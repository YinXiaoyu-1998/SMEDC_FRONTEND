import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  WorkflowsPrepareEnterpriseWorkflowChangeBody,
  WorkflowsSaveEnterpriseWorkflowBody,
} from "@/api/generated/contract";
import {
  createWorkflowApi,
  dailyView,
  dailyConfiguration,
  integrationRecord,
  statusPage,
  TIMESTAMP,
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

const savedNotice = "已保存。配置保存不代表任务已安装或启用。";

function prepareCalls(api: ReturnType<typeof createWorkflowApi>) {
  return api.calls
    .filter((call) =>
      call.url.endsWith("/workflows/prepare_enterprise_workflow_change"),
    )
    .map((call) => bodyOf<WorkflowsPrepareEnterpriseWorkflowChangeBody>(call));
}

function saveCalls(api: ReturnType<typeof createWorkflowApi>) {
  return api.calls
    .filter((call) => call.url.endsWith("/workflows/save_enterprise_workflow"))
    .map((call) => bodyOf<WorkflowsSaveEnterpriseWorkflowBody>(call));
}

async function openIngestionScope() {
  fireEvent.click(await screen.findByRole("button", { name: "编辑 采集范围" }));
  return within(screen.getByRole("dialog", { name: "编辑 · 采集范围" }));
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
    expect(
      within(sectionByHeading("采集范围")).getByText("门店A"),
    ).toBeInTheDocument();
    expect(
      within(sectionByHeading("任务业务设置")).queryByRole("checkbox"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "任务运行情况" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "保存任务设置" }),
    ).not.toBeInTheDocument();

    const listCall = api.calls.find((call) =>
      call.url.endsWith("/workflows/list_enterprise_workflows"),
    );
    expect(listCall).toBeDefined();
    if (listCall === undefined) return;
    expect(bodyOf<{ enterpriseKey: string }>(listCall)).toMatchObject({
      enterpriseKey: "enterprise-1",
    });
  });

  it("摘要显示最近一次运行，历史记录可展开，读取页面的时间不展示", async () => {
    const run = {
      id: "run-2",
      runId: "run-2",
      orgId: "org-1",
      workflowId: "wf-daily-1",
      installationId: "mac-1",
      userAccountId: "admin",
      configurationVersion: 2,
      integrationVersion: 3,
      controlVersion: 1,
      assignmentEpoch: 1,
      workflowPackageVersion: "1.0.0",
      startDate: TIMESTAMP,
      endDate: TIMESTAMP,
      mode: "scheduled",
      phase: "finished",
      status: "succeeded" as const,
      snapshot: {
        workflowType: "meituan-daily-ingestion" as const,
        configurationVersion: 2,
        integrationVersion: 3,
        workflowPackageVersion: "1.0.0",
        configuration: dailyConfiguration(),
        integration: integrationRecord().configuration,
        window: { startDate: "2026-01-01", endDate: "2026-01-01" },
      },
      summary: null,
      startedAt: TIMESTAMP,
      renewedAt: TIMESTAMP,
      finishedAt: TIMESTAMP,
      retainUntil: TIMESTAMP,
    };
    const api = createWorkflowApi({
      status: statusPage({
        runs: [
          run,
          {
            ...run,
            id: "run-1",
            runId: "run-1",
            status: "failed",
            startedAt: "2025-12-31T00:00:00.000Z",
            startDate: "2025-12-31T00:00:00.000Z",
            endDate: "2025-12-31T00:00:00.000Z",
            snapshot: {
              ...run.snapshot,
              window: { startDate: "2025-12-31", endDate: "2025-12-31" },
            },
          },
        ],
        possibleMissedWindow: true,
      }),
    });
    renderDeepLink(api);
    const panel = within(
      await screen.findByRole("region", { name: "任务运行情况" }),
    );
    expect(await panel.findByText("已确认成功")).toBeVisible();
    expect(panel.getByText(/开始于.*业务日期 2026-01-01$/)).toBeVisible();
    expect(panel.getByText(/任务可能漏跑/)).toBeVisible();
    expect(panel.queryByText(/状态读取时间/)).not.toBeInTheDocument();
    expect(panel.queryByText("查看待核对事项")).not.toBeInTheDocument();
    expect(panel.getByText("失败")).not.toBeVisible();
    fireEvent.click(panel.getByText("更早的运行记录"));
    expect(panel.getByText("失败")).toBeVisible();
  });

  it("没有业务企业时只显示登记引导", async () => {
    const api = createWorkflowApi({ enterprises: [] });
    api.install();
    renderApp({
      session: adminSession,
      initialEntries: ["/admin/org-1/workflows"],
    });

    expect(
      await screen.findByText("请先在权限设置登记业务企业，再设置自动任务。"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "业务企业" })).getByRole(
        "link",
        {
          name: "权限设置",
        },
      ),
    ).toHaveAttribute("href", "/admin/org-1/permissions");
    expect(
      screen.queryByRole("combobox", { name: "业务企业" }),
    ).not.toBeInTheDocument();
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

  it("任务范围仅在弹窗修改和保存，取消及无改动不提交", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);
    let editor = await openIngestionScope();
    expect(editor.getByRole("button", { name: "保存" })).toBeDisabled();
    fireEvent.click(editor.getByRole("checkbox", { name: "门店A" }));
    expect(editor.getByText("请至少选择一家处理门店。")).toBeInTheDocument();
    expect(editor.getByRole("button", { name: "保存" })).toBeDisabled();
    fireEvent.click(editor.getByRole("checkbox", { name: "门店B" }));
    fireEvent.click(editor.getByRole("button", { name: "取消" }));
    expect(prepareCalls(api)).toHaveLength(0);

    editor = await openIngestionScope();
    expect(editor.getByRole("checkbox", { name: "门店A" })).toBeChecked();
    expect(editor.getByRole("checkbox", { name: "门店B" })).not.toBeChecked();
    fireEvent.click(editor.getByRole("checkbox", { name: "门店B" }));
    fireEvent.click(editor.getByRole("button", { name: "保存" }));
    await screen.findByText(savedNotice);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(prepareCalls(api)).toMatchObject([
      {
        expectedVersion: 2,
        change: {
          kind: "configuration",
          configuration: {
            storeNames: ["门店A", "门店B"],
            datasets: ["business"],
          },
        },
      },
    ]);
    expect(saveCalls(api)).toMatchObject([
      { previewId: "preview-1", expectedVersion: 2 },
    ]);
  });

  it("套餐销售统计可独立勾选并保存到每日采集范围", async () => {
    const api = createWorkflowApi();
    renderDeepLink(api);
    const editor = await openIngestionScope();
    const combo = editor.getByRole("checkbox", { name: "套餐销售统计" });
    expect(combo).not.toBeChecked();
    fireEvent.click(combo);
    fireEvent.click(editor.getByRole("button", { name: "保存" }));
    await screen.findByText(savedNotice);
    expect(prepareCalls(api)).toMatchObject([
      {
        change: {
          kind: "configuration",
          configuration: {
            datasets: ["business", "combo_sales"],
            storeNames: ["门店A"],
          },
        },
      },
    ]);
    expect(saveCalls(api)).toHaveLength(1);
  });

  it("准备期间防止重复提交，保存失败时保留表单填写值", async () => {
    let release: (() => void) | undefined;
    const api = createWorkflowApi({
      prepare: (request) =>
        new Promise((resolve) => {
          release = () => resolve(previewResponse(request));
        }),
      save: () =>
        jsonResponse(
          { error: { code: "INTERNAL_ERROR", message: "server error" } },
          500,
        ),
    });
    renderDeepLink(api);
    const editor = await openIngestionScope();
    fireEvent.click(editor.getByRole("checkbox", { name: "门店B" }));
    const save = editor.getByRole("button", { name: "保存" });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(save).toBeDisabled();
    expect(prepareCalls(api)).toHaveLength(1);
    release!();

    expect(await editor.findByRole("alert")).toHaveTextContent(
      "服务器暂时无法处理该操作",
    );
    expect(editor.getByRole("checkbox", { name: "门店B" })).toBeChecked();
    expect(save).toBeEnabled();
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
      screen.getByRole("button", { name: "Edit Ingestion scope" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "示例企业" }),
    ).toBeInTheDocument();
  });

  it("只有一个企业时直接进入深链并替换选择页历史", async () => {
    const api = createWorkflowApi();
    api.install();
    const { router } = renderApp({
      session: adminSession,
      initialEntries: ["/admin/org-1/workflows"],
    });

    expect(
      await screen.findByRole("heading", { name: "任务业务设置" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ENTERPRISE_PATH);
    expect(router.state.historyAction).toBe("REPLACE");
    expect(
      screen.queryByRole("combobox", { name: "业务企业" }),
    ).not.toBeInTheDocument();

    expect(
      api.calls
        .filter((call) =>
          call.url.endsWith("/workflows/list_enterprise_workflows"),
        )
        .map((call) => call.body),
    ).toEqual([{ enterpriseKey: "enterprise-1", limit: 100 }]);
  });

  it("有多个企业时选择后直接进入对应设置", async () => {
    const api = createWorkflowApi({
      enterprises: [
        { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
        { enterpriseKey: "enterprise-2", enterpriseName: "第二企业" },
      ],
    });
    api.install();
    const { router } = renderApp({
      session: adminSession,
      initialEntries: ["/admin/org-1/workflows"],
    });

    const select = await screen.findByRole("combobox", { name: "业务企业" });
    expect(select).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "自动任务" }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/admin/org-1/workflows");
    fireEvent.change(select, { target: { value: "enterprise-1" } });
    expect(
      await screen.findByRole("heading", { name: "任务业务设置" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ENTERPRISE_PATH);
    expect(router.state.historyAction).toBe("PUSH");
  });

  it("来源账号在弹窗内直接新增，收起后显示完整字段", async () => {
    const api = createWorkflowApi({ views: viewsWithSources() });
    renderDeepLink(api);
    expect(
      await screen.findByRole("heading", { name: "美团管家来源设置" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "保存来源设置" }),
    ).not.toBeInTheDocument();
    const accounts = within(sectionByHeading("来源账号"));
    expect(accounts.getByText("erp-main")).toBeInTheDocument();
    expect(accounts.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(accounts.getByRole("button", { name: "添加" }));

    const editor = within(screen.getByRole("dialog"));
    for (const [label, value] of [
      ["账号标记（用于区分来源账号）", "erp-east"],
      ["账号显示名称", "华东管家账号"],
      ["来源企业名称", "华东企业"],
      ["来源集团名称（可选）", "集团名称"],
    ] as const) {
      fireEvent.change(editor.getByRole("textbox", { name: label }), {
        target: { value },
      });
    }
    fireEvent.click(editor.getByRole("button", { name: "保存" }));
    await screen.findByText(savedNotice);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const row = within(
      accounts
        .getByRole("button", { name: /编辑 华东管家账号/ })
        .closest("li")!,
    );
    for (const value of [
      "美团管家",
      "erp-east",
      "华东管家账号",
      "华东企业",
      "集团名称",
    ]) {
      expect(row.getByText(value)).toBeInTheDocument();
    }
    expect(row.queryByRole("textbox")).not.toBeInTheDocument();
    expect(prepareCalls(api)[0]?.change).toMatchObject({
      kind: "integration",
      configuration: {
        sourceAccounts: expect.arrayContaining([
          expect.objectContaining({ accountRef: "erp-main" }),
          expect.objectContaining({ accountRef: "erp-east" }),
          expect.objectContaining({ accountRef: "reviews-main" }),
        ]),
      },
    });
    expect(saveCalls(api)).toHaveLength(1);
  });

  it.each(["prepare", "save"] as const)(
    "来源保存冲突（%s）按条重试并保留其他人的记录",
    async (conflictAt) => {
      const views = viewsWithSources();
      const initial = views[0]!.integration;
      const latest = {
        ...initial,
        version: initial.version + 1,
        configuration: {
          ...initial.configuration,
          sourceAccounts: initial.configuration.sourceAccounts
            .map((account) => ({
              ...account,
              displayName:
                account.product === "meituan_erp"
                  ? "同一账号的服务端新值"
                  : "经营宝的新值",
            }))
            .concat({
              product: "meituan_erp",
              accountRef: "another-erp",
              displayName: "另一个管理员新增",
              sourceEnterpriseName: "示例企业",
            }),
        },
      };
      const conflict = () => {
        api.state.views = views.map((view) => ({
          ...view,
          integration: latest,
        }));
        return jsonResponse(
          { error: { code: "WORKFLOW_VERSION_CONFLICT", message: "conflict" } },
          409,
        );
      };
      const api = createWorkflowApi({
        views,
        prepare: (body) =>
          body.expectedIntegrationVersion === initial.version &&
          conflictAt === "prepare"
            ? conflict()
            : undefined,
        save: (body) =>
          body.expectedIntegrationVersion === initial.version &&
          conflictAt === "save"
            ? conflict()
            : undefined,
      });
      renderDeepLink(api);
      fireEvent.click(
        await screen.findByRole("button", { name: "编辑 管家账号 / erp-main" }),
      );
      const editor = within(screen.getByRole("dialog"));
      fireEvent.change(editor.getByRole("textbox", { name: "账号显示名称" }), {
        target: { value: "本地修改" },
      });
      fireEvent.click(editor.getByRole("button", { name: "保存" }));

      expect(
        await editor.findByText("同一账号的服务端新值"),
      ).toBeInTheDocument();
      expect(editor.getByText("本地修改")).toBeInTheDocument();
      expect(prepareCalls(api)).toHaveLength(1);
      expect(saveCalls(api)).toHaveLength(conflictAt === "prepare" ? 0 : 1);
      fireEvent.click(editor.getByRole("button", { name: "确认本次变更" }));
      await screen.findByText(savedNotice);

      const retry = prepareCalls(api).at(-1)!;
      expect(retry.expectedIntegrationVersion).toBe(latest.version);
      expect(retry.change).toEqual({
        kind: "integration",
        configuration: {
          ...latest.configuration,
          sourceAccounts: latest.configuration.sourceAccounts.map((account) =>
            account.accountRef === "erp-main"
              ? { ...account, displayName: "本地修改" }
              : account,
          ),
        },
      });
    },
  );

  it("移除来源对应先确认目标，受影响任务在同一弹窗核对", async () => {
    const api = createWorkflowApi({
      views: viewsWithSources(),
      prepare: (request) =>
        previewResponse(request, [
          { workflowType: "meituan-daily-ingestion", storeNames: ["门店A"] },
        ]),
    });
    renderDeepLink(api);
    const remove = await screen.findByRole("button", {
      name: /移除 管家来源门店 \/ 美团管家/,
    });
    fireEvent.click(remove);
    let editor = within(screen.getByRole("dialog"));
    expect(editor.getByText("管家来源门店")).toBeInTheDocument();
    fireEvent.click(editor.getByRole("button", { name: "取消" }));
    expect(prepareCalls(api)).toHaveLength(0);
    fireEvent.click(remove);

    editor = within(screen.getByRole("dialog"));
    fireEvent.click(editor.getByRole("button", { name: "确认移除" }));
    await editor.findByText("变更影响");
    expect(saveCalls(api)).toHaveLength(0);
    fireEvent.click(editor.getByRole("button", { name: "确认本次变更" }));
    await screen.findByText(savedNotice);
    expect(
      screen.queryByText("管家来源门店", { exact: true }),
    ).not.toBeInTheDocument();
    const integration = api.state.views[0]!.integration.configuration;
    expect(
      integration.storeMappings.map((mapping) => mapping.source.product),
    ).toEqual(["meituan_reviews"]);
  });

  it("浏览器刷新恢复周报标签页，保留任务专属信息和授权范围", async () => {
    const api = createWorkflowApi({ views: viewsWithSources() });
    const { router, unmount } = renderDeepLink(api);
    await screen.findByRole("heading", { name: "美团管家来源设置" });

    expect(
      screen.queryByRole("button", { name: "读取最新状态" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "评价处理" }));
    expect(
      within(sectionByHeading("经营宝来源设置")).getByText("点评来源门店"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("管家来源门店", { exact: true }),
    ).not.toBeInTheDocument();

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
      screen.queryByRole("heading", { name: /来源设置/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "周报邮件交付" }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(sectionByHeading("授权记录")).getByRole("button", {
        name: "添加",
      }),
    );
    const authorization = within(screen.getByRole("dialog"));
    expect(
      authorization.getByRole("checkbox", { name: "店内订单明细" }),
    ).toBeInTheDocument();
    expect(
      authorization.queryByRole("checkbox", { name: "平台外卖订单明细" }),
    ).not.toBeInTheDocument();
  });

  it("缩小周报范围时指出依赖的分组并阻止整条设置提交", async () => {
    const views = viewsWithSources().map((view) => {
      const configuration = view.configuration;
      if (configuration?.type !== "weekly-business-report") return view;
      return {
        ...view,
        configuration: {
          ...configuration,
          storeNames: ["门店A", "门店B"],
          groups: [{ name: "东区", storeNames: ["门店A", "门店B"] }],
        },
      };
    });
    const api = createWorkflowApi({ views });
    renderDeepLink(api);
    fireEvent.click(
      await screen.findByRole("button", { name: "自然周经营周报" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "编辑 周报范围" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("checkbox", { name: "门店B" }));
    expect(dialog.getByText(/请先从这些分组移除.*东区/)).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "保存" })).toBeDisabled();
    expect(prepareCalls(api)).toHaveLength(0);

    fireEvent.click(dialog.getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "评价处理" }));
    expect(
      screen.queryByRole("heading", { name: "可选门店分组" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "任务业务设置" }),
    ).toHaveLength(1);
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

  it("在授权列表和撤销确认中按账号 ID 显示姓名", async () => {
    const [dailyGrant, reportGrant] = sampleAuthorizations();
    const currentGrant = { ...dailyGrant!, grantedBy: "active-grantor" };
    const missingGrant = {
      ...currentGrant,
      authorizationId: "auth-missing",
      grantedBy: "missing-grantor",
    };
    const formerGrant = {
      ...reportGrant!,
      grantedBy: "disabled-grantor",
      revokedAt: null,
    };
    const api = createWorkflowApi({
      views: viewsWithSources().map((view) => ({
        ...view,
        authorizations:
          view.workflowType === "meituan-daily-ingestion"
            ? [currentGrant, missingGrant]
            : view.workflowType === "weekly-business-report"
              ? [formerGrant]
              : [],
      })),
      accounts: [
        {
          userAccountId: "active-grantor",
          displayName: "谢明",
          disabled: false,
        },
        {
          userAccountId: "disabled-grantor",
          displayName: "许珊",
          disabled: true,
        },
      ].map((account) => ({
        ...account,
        id: account.userAccountId,
        orgId: "org-1",
        email: `${account.userAccountId}@example.com`,
        role: "admin",
        clearance: 1,
        mode: "enabled",
        authorizationVersion: "1",
        categories: [],
        grants: [],
      })),
    });
    renderDeepLink(api);

    expect(await screen.findByText("谢明")).toBeInTheDocument();
    expect(screen.getByText("姓名不可用")).toBeInTheDocument();
    expect(screen.queryByText("active-grantor")).not.toBeInTheDocument();
    expect(screen.queryByText("missing-grantor")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "撤销授权 下载经营数据 auth-1" }),
    );
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("谢明")).toBeInTheDocument();
    expect(dialog.queryByText("active-grantor")).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole("button", { name: "取消" }));

    fireEvent.click(
      screen.getByRole("button", {
        name: "撤销授权 下载经营数据 auth-missing",
      }),
    );
    const unresolvedDialog = within(screen.getByRole("dialog"));
    expect(unresolvedDialog.getByText("姓名不可用")).toBeInTheDocument();
    expect(
      unresolvedDialog.queryByText("missing-grantor"),
    ).not.toBeInTheDocument();
    fireEvent.click(unresolvedDialog.getByRole("button", { name: "取消" }));

    fireEvent.click(screen.getByRole("button", { name: "自然周经营周报" }));
    expect(screen.getByText("许珊")).toBeInTheDocument();
    expect(
      api.calls.filter((call) => call.url.endsWith("/permissions/accounts")),
    ).toHaveLength(1);
  });

  it("在邮件授权列表、撤销确认及冲突核对中隐藏内部字段", async () => {
    const activeEmail = { ...sampleAuthorizations()[1]!, revokedAt: null };
    const api = createWorkflowApi({
      views: viewsWithSources().map((view) =>
        view.workflowType === "weekly-business-report"
          ? { ...view, authorizations: [activeEmail] }
          : view,
      ),
      prepare: () =>
        jsonResponse(
          {
            error: { code: "WORKFLOW_VERSION_CONFLICT", message: "conflict" },
          },
          409,
        ),
    });
    renderDeepLink(api, ENTERPRISE_PATH + "?task=weekly-business-report");

    const revoke = await screen.findByRole("button", {
      name: "撤销授权 发送邮件 auth-2",
    });
    const internalFields = [
      "授权时的配置版本",
      "授权时的控制版本",
      "本次交付批次",
      "已授予",
      "授权时间",
    ];
    const row = within(revoke.closest("li")!);
    for (const label of internalFields) {
      expect(row.queryByText(label)).not.toBeInTheDocument();
    }

    fireEvent.click(revoke);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("boss@example.com")).toBeVisible();
    for (const label of internalFields) {
      expect(dialog.queryByText(label)).not.toBeInTheDocument();
    }

    fireEvent.click(dialog.getByRole("button", { name: "确认撤销" }));
    const current = await dialog.findByRole("heading", {
      name: "服务端最新配置",
    });
    expect(
      within(current.closest("section")!).getByText("boss@example.com"),
    ).toBeVisible();
    for (const label of internalFields) {
      expect(dialog.queryByText(label)).not.toBeInTheDocument();
    }
    expect(saveCalls(api)).toHaveLength(0);
  });

  it("持续授权逐条确认撤销，已撤销授权保持只读", async () => {
    const api = createWorkflowApi({
      views: [dailyView({ authorizations: sampleAuthorizations() })],
    });
    renderDeepLink(api);
    const revoke = await screen.findByRole("button", {
      name: "撤销授权 下载经营数据 auth-1",
    });
    expect(
      screen.queryByRole("button", { name: /撤销授权 .*auth-2/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(revoke);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("auth-1")).toBeInTheDocument();
    expect(saveCalls(api)).toHaveLength(0);
    fireEvent.click(dialog.getByRole("button", { name: "确认撤销" }));
    await screen.findByText(savedNotice);

    expect(prepareCalls(api)[0]?.change).toEqual({
      kind: "authorization",
      grant: [],
      revokeAuthorizationIds: ["auth-1"],
    });
    expect(
      screen.queryByRole("button", { name: /撤销授权 .*auth-1/ }),
    ).not.toBeInTheDocument();
  });
});
