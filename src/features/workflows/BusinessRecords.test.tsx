import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";

import type { WorkflowBundle } from "@/features/workflows/api";
import type {
  IgnoredReviewIdentity,
  ReviewOperationsConfiguration,
  SourceAccount,
  WeeklyReportConfiguration,
} from "@/features/workflows/model";
import type {
  WorkflowEdit,
  WorkflowEditResult,
} from "@/features/workflows/recordEdits";
import { ReportGroups } from "@/features/workflows/ReportGroups";
import { ReviewExclusions } from "@/features/workflows/ReviewExclusions";
import {
  dailyView,
  integrationRecord,
} from "@/features/workflows/testFixtures";
import { TextProvider } from "@/i18n/TextProvider";

const account: SourceAccount = {
  product: "meituan_reviews",
  accountRef: "reviews-account",
  displayName: "经营宝账号",
  sourceEnterpriseName: "来源企业",
};

const review: IgnoredReviewIdentity = {
  source: {
    product: "meituan_reviews",
    channel: "dianping",
    accountRef: account.accountRef,
    sourceStoreName: "点评店铺",
    sourceStoreId: "2358",
  },
  feedbackId: "评价-001",
  reason: "排除这条记录",
  purpose: "exclude_source_record",
};

const reviewConfiguration: ReviewOperationsConfiguration = {
  schemaVersion: 1,
  type: "meituan-review-operations",
  storeNames: ["标准门店"],
  notificationPolicy: "action_required",
  executionPolicy: { id: "verified-review-operations", version: 1 },
  ignoredReviewIdentities: [review],
  channels: ["dianping"],
  publication: { enabled: false, storeNames: [] },
  brandFacts: "已保存的品牌信息",
  tone: "友善",
  draftNotification: { enabled: false, recipients: [] },
  cleanupPolicy: "complete_run_only",
};

const reportConfiguration: WeeklyReportConfiguration = {
  schemaVersion: 1,
  type: "weekly-business-report",
  storeNames: ["已有分组的店", "可选门店", "已停用门店", "历史名称"],
  notificationPolicy: "action_required",
  groups: [
    { name: "一区", storeNames: ["已有分组的店", "已停用门店", "历史名称"] },
  ],
  delivery: { enabled: false, recipients: [] },
  cleanupPolicy: "retain_final_report",
};

function bundle(
  configuration: ReviewOperationsConfiguration | WeeklyReportConfiguration,
): WorkflowBundle {
  const source = integrationRecord();
  const integration = {
    ...source,
    configuration: { ...source.configuration, sourceAccounts: [account] },
  };
  const view = dailyView({
    workflowType: configuration.type,
    configuration,
    integration,
  });
  return {
    views: { [configuration.type]: view },
    integration,
    needsConfiguration: false,
  };
}

it("shows every ignored-review field and edits only that exact identity", async () => {
  const other = { ...review, feedbackId: "other-feedback" };
  const latest = {
    ...reviewConfiguration,
    tone: "更新后的语气",
    ignoredReviewIdentities: [review, other],
  };
  const submit = vi.fn(
    async (edit: WorkflowEdit): Promise<WorkflowEditResult> => {
      expect(edit.change(bundle(latest))).toEqual({
        kind: "configuration",
        configuration: {
          ...latest,
          ignoredReviewIdentities: [
            { ...review, reason: "调整后的原因" },
            other,
          ],
        },
      });
      return { status: "saved" };
    },
  );
  render(
    <TextProvider>
      <ReviewExclusions
        configuration={reviewConfiguration}
        accounts={[account]}
        disabled={false}
        submitEdit={submit}
      />
    </TextProvider>,
  );
  const row = within(screen.getByRole("listitem"));
  for (const field of [
    "经营宝",
    "大众点评",
    "经营宝账号 · reviews-account",
    "点评店铺",
    "2358",
    "评价-001",
    "排除这条记录",
    "明确排除此来源记录",
  ]) {
    expect(row.getByText(field)).toBeVisible();
  }
  fireEvent.click(row.getByRole("button", { name: /^编辑 / }));
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getByRole("button", { name: "保存" })).toBeDisabled();
  fireEvent.change(dialog.getByRole("textbox", { name: "原因" }), {
    target: { value: "调整后的原因" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "保存" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(submit).toHaveBeenCalledTimes(1);
});

it("shows historic group members and checks new membership again against saved settings", async () => {
  const submit = vi.fn(
    async (edit: WorkflowEdit): Promise<WorkflowEditResult> => {
      expect(edit.change(bundle(reportConfiguration))).toEqual({
        kind: "configuration",
        configuration: {
          ...reportConfiguration,
          groups: [
            ...reportConfiguration.groups,
            { name: "二区", storeNames: ["可选门店"] },
          ],
        },
      });
      const newer = {
        ...reportConfiguration,
        storeNames: reportConfiguration.storeNames.filter(
          (name) => name !== "可选门店",
        ),
      };
      expect(() => edit.change(bundle(newer))).toThrow("groupsInvalid");
      return { status: "saved" };
    },
  );
  render(
    <TextProvider>
      <ReportGroups
        configuration={reportConfiguration}
        stores={[
          { name: "已有分组的店", retired: false },
          { name: "已停用门店", retired: true },
          { name: "可选门店", retired: false },
          { name: "未选门店", retired: false },
        ]}
        disabled={false}
        submitEdit={submit}
      />
    </TextProvider>,
  );
  for (const name of reportConfiguration.groups[0]!.storeNames) {
    expect(screen.getByText(name)).toBeVisible();
  }
  fireEvent.click(screen.getByRole("button", { name: "添加" }));
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getAllByRole("checkbox")).toHaveLength(1);
  fireEvent.change(dialog.getByRole("textbox", { name: "分组名称" }), {
    target: { value: "二区" },
  });
  fireEvent.click(dialog.getByRole("checkbox", { name: "可选门店" }));
  fireEvent.click(dialog.getByRole("button", { name: "保存" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(submit).toHaveBeenCalledTimes(1);
});
