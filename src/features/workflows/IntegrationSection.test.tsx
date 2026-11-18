import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WorkflowBundle } from "@/features/workflows/api";
import { IntegrationSection } from "@/features/workflows/IntegrationSection";
import {
  defaultConfiguration,
  sourceSettingsFor,
  type SourceStoreMapping,
} from "@/features/workflows/model";
import type {
  SubmitWorkflowEdit,
  WorkflowEdit,
} from "@/features/workflows/recordEdits";
import {
  savedIntegration,
  sourceAccountEdit,
  sourceStoreEdit,
} from "@/features/workflows/sourceRecordEdits";
import { dailyView, viewsWithSources } from "@/features/workflows/testFixtures";
import { renderWithText } from "@/test/renderWithText";

const product = "meituan_reviews";
const stores = [{ name: "门店A", retired: false }];

function sourceBundle(): WorkflowBundle {
  const view = viewsWithSources().find(
    (item) => item.workflowType === "meituan-review-operations",
  );
  if (view === undefined) throw new Error("Missing review fixture");
  const review = defaultConfiguration("meituan-review-operations");
  if (review.type !== "meituan-review-operations")
    throw new Error("Missing review configuration");
  const current = view.integration.configuration;
  const reviewMapping = current.storeMappings.find(
    (item) => item.source.product === product,
  );
  if (reviewMapping === undefined) throw new Error("Missing review mapping");
  const source = { ...reviewMapping.source, sourceStoreId: "shop-42" };
  const integration = {
    ...view.integration,
    configuration: {
      ...current,
      sourceAccounts: current.sourceAccounts.map((account) =>
        account.product === product
          ? { ...account, sourceGroupName: "示例集团" }
          : account,
      ),
      storeMappings: current.storeMappings.map((mapping) =>
        mapping === reviewMapping ? { ...mapping, source } : mapping,
      ),
    },
  };
  return {
    views: {
      "meituan-review-operations": dailyView({
        ...view,
        integration,
        configuration: {
          ...review,
          ignoredReviewIdentities: [
            {
              source,
              reason: "单条排除",
              purpose: "exclude_source_record",
              feedbackId: "feedback-42",
            },
          ],
        },
      }),
    },
    integration,
    needsConfiguration: false,
  };
}

function showSources(bundle: WorkflowBundle, submitEdit: SubmitWorkflowEdit) {
  return renderWithText(
    <IntegrationSection
      product={product}
      settings={sourceSettingsFor(savedIntegration(bundle), product)}
      stores={stores}
      bundle={bundle}
      disabled={false}
      submitEdit={submitEdit}
    />,
  );
}

function dialog() {
  return within(screen.getByRole("dialog"));
}

describe("来源设置记录", () => {
  it("显示完整的已保存记录，并用单一弹窗新增账号", async () => {
    const bundle = sourceBundle();
    const configuration = savedIntegration(bundle);
    const submit = vi.fn(async (edit: WorkflowEdit) => {
      const latest = {
        ...configuration,
        sourceAccounts: [
          ...configuration.sourceAccounts,
          {
            product,
            accountRef: "concurrent",
            displayName: "同时保存的账号",
            sourceEnterpriseName: "示例企业",
          } as const,
        ],
      };
      const current = { ...bundle.integration!, configuration: latest };
      expect(edit.change({ ...bundle, integration: current })).toEqual({
        kind: "integration",
        configuration: {
          ...latest,
          sourceAccounts: [
            ...latest.sourceAccounts,
            {
              product,
              accountRef: "new-reviews",
              displayName: "新账号",
              sourceEnterpriseName: "新来源企业",
            },
          ],
        },
      });
      return { status: "saved" } as const;
    });
    showSources(bundle, submit);

    const accounts = within(screen.getByRole("region", { name: "来源账号" }));
    expect(accounts.getByText("示例集团")).toBeVisible();
    const mappings = within(
      screen.getByRole("region", { name: "来源门店对应" }),
    );
    for (const field of [
      "经营宝",
      "大众点评",
      "reviews-main",
      "经营宝账号",
      "点评来源门店",
      "shop-42",
      "门店A",
    ]) {
      expect(mappings.getByText(field)).toBeVisible();
    }
    const exclusions = within(
      screen.getByRole("region", { name: "明确排除的来源店铺" }),
    );
    expect(exclusions.getByText("示例排除原因")).toBeVisible();
    expect(exclusions.getByText("—")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    fireEvent.click(accounts.getByRole("button", { name: "添加" }));
    expect(dialog().getByRole("button", { name: "保存" })).toBeDisabled();
    fireEvent.click(dialog().getByRole("button", { name: "取消" }));
    expect(submit).not.toHaveBeenCalled();

    fireEvent.click(accounts.getByRole("button", { name: "添加" }));
    fireEvent.change(dialog().getByRole("textbox", { name: /账号标记/ }), {
      target: { value: "new-reviews" },
    });
    fireEvent.change(dialog().getByRole("textbox", { name: /账号显示名称/ }), {
      target: { value: "新账号" },
    });
    fireEvent.change(dialog().getByRole("textbox", { name: /来源企业名称/ }), {
      target: { value: "新来源企业" },
    });
    fireEvent.click(dialog().getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("阻止移除或重命名被引用的账号，并指出门店对应、排除项和忽略评价", () => {
    const submit = vi.fn<SubmitWorkflowEdit>();
    showSources(sourceBundle(), submit);
    const accounts = within(screen.getByRole("region", { name: "来源账号" }));
    fireEvent.click(accounts.getByRole("button", { name: /^移除 经营宝账号/ }));
    expect(dialog().getByRole("button", { name: "确认移除" })).toBeDisabled();
    expect(dialog().getByText(/此账号仍被引用/)).toHaveTextContent(
      /来源门店对应.*点评来源门店.*门店A.*明确排除的来源店铺.*feedback-42/,
    );
    fireEvent.click(dialog().getByRole("button", { name: "取消" }));

    fireEvent.click(accounts.getByRole("button", { name: /^编辑 经营宝账号/ }));
    fireEvent.change(dialog().getByRole("textbox", { name: /账号显示名称/ }), {
      target: { value: "更新显示名称" },
    });
    expect(dialog().getByRole("button", { name: "保存" })).toBeEnabled();
    fireEvent.change(dialog().getByRole("textbox", { name: /账号标记/ }), {
      target: { value: "renamed" },
    });
    expect(dialog().getByRole("button", { name: "保存" })).toBeDisabled();
    expect(dialog().getByText(/此账号仍被引用/)).toHaveTextContent(
      "feedback-42",
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it("应用账号重命名时再次检查并报告新增的忽略评价引用", () => {
    const bundle = sourceBundle();
    const configuration = savedIntegration(bundle);
    const account = configuration.sourceAccounts.find(
      (item) => item.product === product,
    )!;
    const integration = {
      ...bundle.integration!,
      configuration: { ...configuration, storeMappings: [], exclusions: [] },
    };
    const edit = sourceAccountEdit(
      {
        kind: "edit",
        original: account,
        value: { ...account, accountRef: "renamed" },
      },
      (references) =>
        references.map((reference) => reference.recordLabel).join(", "),
    );
    expect(edit.change({ ...bundle, integration, views: {} })).toMatchObject({
      kind: "integration",
      configuration: {
        sourceAccounts: [
          configuration.sourceAccounts[0],
          { ...account, accountRef: "renamed" },
        ],
      },
    });
    expect(() => edit.change({ ...bundle, integration })).toThrow(
      expect.objectContaining({
        message: "sourceAccountInUse",
        details: "feedback-42",
      }),
    );
  });

  it("用店铺编号检查跨列表重复，并在应用变更时用最新配置重查引用和上限", () => {
    const bundle = sourceBundle();
    const integration = bundle.integration!;
    const configuration = integration.configuration;
    const existing = configuration.storeMappings.find(
      (record) => record.source.product === product,
    )!;
    const edit = sourceStoreEdit("exclusions", {
      kind: "add",
      value: {
        source: { ...existing.source, sourceStoreName: "不同的名称" },
        reason: "排除",
      },
    });
    const applyTo = (next: typeof configuration) =>
      edit.change({
        ...bundle,
        integration: { ...integration, configuration: next },
      });
    expect(() => edit.change(bundle)).toThrow("recordDuplicate");

    const changed = { ...configuration, storeMappings: [] };
    expect(applyTo(changed)).toMatchObject({
      kind: "integration",
      configuration: { exclusions: [...changed.exclusions, edit.after] },
    });
    expect(() => applyTo({ ...changed, sourceAccounts: [] })).toThrow(
      "sourceAccountUnavailable",
    );

    const other = configuration.storeMappings.find(
      (record) => record.source.product !== product,
    )!;
    const storeMappings = Array.from(
      { length: 1_998 },
      (_, index): SourceStoreMapping => ({
        ...other,
        source: { ...other.source, sourceStoreId: String(index) },
      }),
    );
    expect(() => applyTo({ ...changed, storeMappings })).toThrow(
      "sourceLimitsReached",
    );
  });
});
