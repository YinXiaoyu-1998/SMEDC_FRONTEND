import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorizationSection } from "@/features/workflows/AuthorizationSection";
import type { WorkflowBundle } from "@/features/workflows/api";
import type {
  WorkflowAuthorization,
  WorkflowView,
} from "@/features/workflows/model";
import { defaultConfiguration } from "@/features/workflows/model";
import type { SubmitWorkflowEdit } from "@/features/workflows/recordEdits";
import { dailyView, TIMESTAMP } from "@/features/workflows/testFixtures";
import { TextProvider } from "@/i18n/TextProvider";

const reportType = "weekly-business-report";
const metadata = {
  configurationVersion: 1,
  controlVersion: 2,
  grantedBy: "granting-admin",
  grantedAt: TIMESTAMP,
};

const legacyDownload = {
  ...metadata,
  authorizationId: "auth-download",
  revokedAt: null,
  scope: {
    kind: "download",
    storeNames: ["门店A", "旧门店"],
    datasets: ["business", "takeaway_orders"],
  },
} satisfies WorkflowAuthorization;

const revokedEmail = {
  ...metadata,
  authorizationId: "auth-email",
  revokedAt: TIMESTAMP,
  scope: {
    kind: "email",
    purpose: "exception",
    storeNames: ["门店A", "旧门店"],
    recipients: ["one@example.com", "two@example.com"],
    allowedSender: "sender@example.com",
    deliveryVersion: 42,
  },
} satisfies WorkflowAuthorization;

function reportView(authorizations: WorkflowAuthorization[]): WorkflowView {
  return dailyView({
    workflowType: reportType,
    configuration: {
      ...defaultConfiguration(reportType),
      storeNames: ["门店A", "门店B"],
    },
    authorizations,
  });
}

function bundle(view: WorkflowView): WorkflowBundle {
  return {
    views: { [reportType]: view },
    integration: view.integration,
    needsConfiguration: false,
  };
}

function renderAuthorization(
  view: WorkflowView,
  submitEdit: SubmitWorkflowEdit,
) {
  render(
    <TextProvider>
      <AuthorizationSection
        view={view}
        type={view.workflowType}
        grantorNames={new Map([["granting-admin", "授权管理员"]])}
        stores={[
          { name: "门店A", retired: false },
          { name: "门店B", retired: false },
          { name: "旧门店", retired: true },
        ]}
        disabled={false}
        submitEdit={submitEdit}
      />
    </TextProvider>,
  );
}

beforeEach(() => localStorage.clear());

describe("standing authorization records", () => {
  it("offers only dish sales in daily upload authorization and folds redundant saved scope", () => {
    const current = dailyView({
      authorizations: [
        {
          ...metadata,
          authorizationId: "daily-upload",
          revokedAt: null,
          scope: {
            kind: "upload",
            datasets: ["dishes", "combo_sales"],
            storeNames: ["门店A"],
          },
        },
      ],
    });
    renderAuthorization(current, vi.fn());
    const record = within(screen.getByRole("listitem"));
    expect(record.getByText("菜品销售")).toBeVisible();
    expect(record.queryByText("套餐销售统计")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /编辑.*daily-upload/ }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("checkbox", { name: "菜品销售" })).toBeChecked();
    expect(
      dialog.queryByRole("checkbox", { name: /套餐销售/ }),
    ).not.toBeInTheDocument();
  });

  it("shows historical email scopes in full without exposing edit or revoke buttons", () => {
    renderAuthorization(reportView([revokedEmail]), vi.fn());
    const record = within(screen.getByRole("listitem"));
    expect(record.getByText("已撤销")).toBeVisible();
    expect(record.getByText("异常通知")).toBeVisible();
    expect(record.getByText("门店A 旧门店")).toBeVisible();
    expect(record.getByText("one@example.com two@example.com")).toBeVisible();
    expect(record.getByText("sender@example.com")).toBeVisible();
    expect(record.queryByText("本次交付批次")).not.toBeInTheDocument();
    expect(record.getByText("授权管理员")).toBeVisible();
    expect(record.queryByText("granting-admin")).not.toBeInTheDocument();
    expect(record.queryByText("授权时间")).not.toBeInTheDocument();
    expect(record.getByText("撤销时间")).toBeVisible();
    expect(record.queryByRole("button")).toBeNull();
  });

  it("requires explicitly removing legacy values before one atomic replacement", async () => {
    const view = reportView([legacyDownload, revokedEmail]);
    const submitEdit = vi.fn<SubmitWorkflowEdit>(async () => ({
      status: "saved",
    }));
    renderAuthorization(view, submitEdit);

    fireEvent.click(
      screen.getByRole("button", { name: /编辑.*auth-download/ }),
    );
    const dialog = within(screen.getByRole("dialog"));
    const save = dialog.getByRole("button", { name: "保存" });
    const oldStore = dialog.getByRole("checkbox", {
      name: /旧门店.*当前范围不可用/,
    });
    const oldDataset = dialog.getByRole("checkbox", {
      name: /外卖.*当前范围不可用/,
    });
    expect(oldStore).toBeChecked();
    expect(oldDataset).toBeChecked();
    expect(save).toBeDisabled();

    fireEvent.click(oldStore);
    expect(oldDataset).toBeChecked();
    expect(save).toBeDisabled();
    fireEvent.click(oldDataset);
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    const [edit] = submitEdit.mock.calls[0]!;
    expect(edit.before).toEqual(legacyDownload);
    expect(edit.current(bundle(view))).toEqual(legacyDownload);
    expect(edit.change(bundle(view))).toEqual({
      kind: "authorization",
      grant: [
        { kind: "download", storeNames: ["门店A"], datasets: ["business"] },
      ],
      revokeAuthorizationIds: [legacyDownload.authorizationId],
    });

    const revoked = { ...legacyDownload, revokedAt: TIMESTAMP };
    const latest = bundle(reportView([revoked, revokedEmail]));
    expect(edit.current(latest)).toEqual(revoked);
    expect(() => edit.change(latest)).toThrow("recordMissing");
    expect(() =>
      edit.change(
        bundle({
          ...view,
          configuration: {
            ...defaultConfiguration(reportType),
            storeNames: ["门店B"],
          },
        }),
      ),
    ).toThrow("authorizationScopeChanged");
  });

  it("saves a new email grant with the task-specific purpose and batch 1", async () => {
    const view = reportView([]);
    const submitEdit = vi.fn<SubmitWorkflowEdit>(async () => ({
      status: "saved",
    }));
    renderAuthorization(view, submitEdit);

    fireEvent.click(screen.getByRole("button", { name: "添加" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByRole("combobox", { name: "授权动作" }), {
      target: { value: "email" },
    });
    const purpose = dialog.getByRole("combobox", { name: "用途" });
    expect(within(purpose).getAllByRole("option")).toHaveLength(1);
    expect(purpose).toHaveValue("weekly_report");
    expect(
      dialog.queryByRole("spinbutton", { name: "本次交付批次" }),
    ).not.toBeInTheDocument();

    fireEvent.click(dialog.getByRole("checkbox", { name: "门店B" }));
    fireEvent.change(
      dialog.getByRole("textbox", { name: "收件人（每行一个）" }),
      {
        target: { value: "one@example.com\ntwo@example.com" },
      },
    );
    fireEvent.change(dialog.getByRole("textbox", { name: "允许的发件邮箱" }), {
      target: { value: "sender@example.com" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    const [edit] = submitEdit.mock.calls[0]!;
    expect(edit.before).toBeNull();
    expect(edit.change(bundle(view))).toEqual({
      kind: "authorization",
      grant: [
        {
          kind: "email",
          storeNames: ["门店B"],
          purpose: "weekly_report",
          recipients: ["one@example.com", "two@example.com"],
          allowedSender: "sender@example.com",
          deliveryVersion: 1,
        },
      ],
      revokeAuthorizationIds: [],
    });
  });

  it.each([0, 42])(
    "preserves the saved batch %s even after switching authorization actions",
    async (deliveryVersion) => {
      const activeEmail = {
        ...revokedEmail,
        revokedAt: null,
        scope: {
          ...revokedEmail.scope,
          purpose: "weekly_report",
          storeNames: ["门店A"],
          deliveryVersion,
        },
      } satisfies WorkflowAuthorization;
      const view = reportView([activeEmail]);
      const submitEdit = vi.fn<SubmitWorkflowEdit>(async () => ({
        status: "saved",
      }));
      renderAuthorization(view, submitEdit);

      fireEvent.click(screen.getByRole("button", { name: /编辑.*auth-email/ }));
      const dialog = within(screen.getByRole("dialog"));
      const action = dialog.getByRole("combobox", { name: "授权动作" });
      fireEvent.change(action, { target: { value: "download" } });
      fireEvent.change(action, { target: { value: "email" } });
      expect(
        dialog.queryByRole("spinbutton", { name: "本次交付批次" }),
      ).not.toBeInTheDocument();

      fireEvent.change(
        dialog.getByRole("textbox", { name: "收件人（每行一个）" }),
        {
          target: { value: "updated@example.com" },
        },
      );
      fireEvent.change(
        dialog.getByRole("textbox", { name: "允许的发件邮箱" }),
        {
          target: { value: "sender@example.com" },
        },
      );
      fireEvent.click(dialog.getByRole("button", { name: "保存" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );

      const [edit] = submitEdit.mock.calls[0]!;
      expect(edit.change(bundle(view))).toEqual({
        kind: "authorization",
        grant: [{ ...activeEmail.scope, recipients: ["updated@example.com"] }],
        revokeAuthorizationIds: [activeEmail.authorizationId],
      });
    },
  );

  it("revokes only the selected active record after confirmation", async () => {
    const view = reportView([legacyDownload, revokedEmail]);
    const submitEdit = vi.fn<SubmitWorkflowEdit>(async () => ({
      status: "saved",
    }));
    renderAuthorization(view, submitEdit);

    fireEvent.click(
      screen.getByRole("button", { name: /撤销授权.*auth-download/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(submitEdit).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: /撤销授权.*auth-download/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "确认撤销" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const [edit] = submitEdit.mock.calls[0]!;
    expect(edit.change(bundle(view))).toEqual({
      kind: "authorization",
      grant: [],
      revokeAuthorizationIds: [legacyDownload.authorizationId],
    });
  });
});
