import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { adminSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

afterEach(() => vi.unstubAllGlobals());
it("shows the enterprise directory and its three sections", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("/enterprises"))
        return jsonResponse({
          authorizationVersion: "1",
          enterprises: [
            { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
          ],
        });
      if (url.includes("/list_directory"))
        return jsonResponse({
          enterpriseKey: "enterprise-1",
          enterpriseName: "示例企业",
          stores: [],
          departments: [],
        });
      if (url.includes("/list_employees"))
        return jsonResponse({
          employees: [],
          access: "none",
          nextCursor: null,
        });
      return jsonResponse({});
    }),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  expect(
    await screen.findByRole("heading", { name: "企业资料" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "员工档案" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "门店目录" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "部门目录" })).toBeInTheDocument();
});

it("creates an employee without list access using the selected group scope", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const departmentId = "11111111-1111-4111-8111-111111111111";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.includes("/enterprises"))
        return jsonResponse({
          authorizationVersion: "1",
          enterprises: [
            { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
          ],
        });
      if (url.includes("/list_directory"))
        return jsonResponse({
          enterpriseKey: "enterprise-1",
          enterpriseName: "示例企业",
          stores: [],
          departments: [
            { departmentId, name: "前厅", status: "active", version: "1" },
          ],
        });
      if (url.includes("/list_employees"))
        return jsonResponse({
          employees: [],
          access: "none",
          nextCursor: null,
        });
      if (url.includes("/create_employee"))
        return jsonResponse({
          employeeUid: "22222222-2222-4222-8222-222222222222",
        });
      return jsonResponse({});
    }),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  expect(
    await screen.findByText("当前没有员工档案读取权限。仍可尝试新增。"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "新增员工" }));
  const form = screen
    .getByRole("heading", { name: "新增员工" })
    .closest("section")!;
  fireEvent.change(within(form).getByLabelText("姓名"), {
    target: { value: "小王" },
  });
  fireEvent.change(within(form).getByLabelText("部门"), {
    target: { value: departmentId },
  });
  fireEvent.change(within(form).getByLabelText("归属"), {
    target: { value: "group" },
  });
  fireEvent.click(within(form).getByRole("button", { name: "保存" }));
  await waitFor(() =>
    expect(calls.some((c) => c.url.includes("/create_employee"))).toBe(true),
  );
  const call = calls.find((c) => c.url.includes("/create_employee"))!;
  expect(JSON.parse(String(call.init.body))).toEqual({
    enterpriseKey: "enterprise-1",
    name: "小王",
    departmentId,
    scope: { ownership: "group", storeId: null },
  });
  expect(new Headers(call.init.headers).get("x-csrf-token")).toBe(
    "csrf-token-1",
  );
});

it("retains an employee draft after a version conflict and requires comparison", async () => {
  const departmentId = "11111111-1111-4111-8111-111111111111";
  const uid = "22222222-2222-4222-8222-222222222222";
  let version = "1";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("/enterprises"))
        return jsonResponse({
          authorizationVersion: "1",
          enterprises: [
            { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
          ],
        });
      if (url.includes("/list_directory"))
        return jsonResponse({
          enterpriseKey: "enterprise-1",
          enterpriseName: "示例企业",
          stores: [],
          departments: [
            { departmentId, name: "前厅", status: "active", version: "1" },
          ],
        });
      if (url.includes("/list_employees"))
        return jsonResponse({
          employees: [
            {
              employeeUid: uid,
              name: version === "1" ? "原名" : "他人修改",
              departmentId,
              departmentName: "前厅",
              scope: { ownership: "group", storeId: null, storeName: null },
              status: "active",
              version,
            },
          ],
          access: "all",
          nextCursor: null,
        });
      if (url.includes("/update_employee")) {
        version = "2";
        return jsonResponse(
          { error: { code: "DIRECTORY_CONFLICT", message: "conflict" } },
          409,
        );
      }
      return jsonResponse({});
    }),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  fireEvent.click(await screen.findByRole("button", { name: "编辑" }));
  const form = screen
    .getByRole("heading", { name: "编辑员工" })
    .closest("section")!;
  fireEvent.change(within(form).getByLabelText("姓名"), {
    target: { value: "我的草稿" },
  });
  fireEvent.click(within(form).getByRole("button", { name: "保存" }));
  expect(await screen.findByText(/数据已变化，草稿保留/)).toBeInTheDocument();
  expect(within(form).getByLabelText("姓名")).toHaveValue("我的草稿");
  expect(within(form).getByRole("button", { name: "保存" })).toBeDisabled();
  expect(await within(form).findByText(/他人修改/)).toBeInTheDocument();
  fireEvent.click(
    within(form).getByRole("button", { name: "已比较，使用最新版本继续" }),
  );
  expect(within(form).getByRole("button", { name: "保存" })).toBeEnabled();
});

it("asks before marking an employee departed and does not submit when cancelled", async () => {
  const departmentId = "11111111-1111-4111-8111-111111111111";
  const uid = "22222222-2222-4222-8222-222222222222";
  const calls: string[] = [];
  vi.stubGlobal(
    "confirm",
    vi.fn(() => false),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes("/enterprises"))
        return jsonResponse({
          authorizationVersion: "1",
          enterprises: [
            { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
          ],
        });
      if (url.includes("/list_directory"))
        return jsonResponse({
          enterpriseKey: "enterprise-1",
          enterpriseName: "示例企业",
          stores: [],
          departments: [
            { departmentId, name: "前厅", status: "active", version: "1" },
          ],
        });
      if (url.includes("/list_employees"))
        return jsonResponse({
          employees: [
            {
              employeeUid: uid,
              name: "小王",
              departmentId,
              departmentName: "前厅",
              scope: { ownership: "group", storeId: null, storeName: null },
              status: "active",
              version: "1",
            },
          ],
          access: "all",
          nextCursor: null,
        });
      return jsonResponse({});
    }),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  fireEvent.click(await screen.findByRole("button", { name: "编辑" }));
  const form = screen
    .getByRole("heading", { name: "编辑员工" })
    .closest("section")!;
  fireEvent.change(within(form).getByLabelText("状态"), {
    target: { value: "departed" },
  });
  fireEvent.click(within(form).getByRole("button", { name: "保存" }));
  expect(window.confirm).toHaveBeenCalledWith(
    "标记离职后，员工档案会保留，并从默认在职名单移除。SMEDC 登录账号和访问权限不会因此改变。",
  );
  expect(calls.some((url) => url.includes("/update_employee"))).toBe(false);
});

it("shows progress only on the pending directory row action", async () => {
  const storeId = "33333333-3333-4333-8333-333333333333";
  let finish!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("/enterprises"))
        return jsonResponse({
          authorizationVersion: "1",
          enterprises: [
            { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
          ],
        });
      if (url.includes("/list_directory"))
        return jsonResponse({
          enterpriseKey: "enterprise-1",
          enterpriseName: "示例企业",
          stores: [
            { storeId, name: "待确认店", status: "pending", version: "1" },
          ],
          departments: [],
        });
      if (url.includes("/list_employees"))
        return jsonResponse({
          employees: [],
          access: "none",
          nextCursor: null,
        });
      if (url.includes("/manage_store")) return pending;
      return jsonResponse({});
    }),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  fireEvent.click(await screen.findByRole("button", { name: "门店目录" }));
  fireEvent.click(screen.getByRole("button", { name: "待确认" }));
  const row = await screen.findByRole("row", { name: /待确认店/ });
  fireEvent.click(within(row).getByRole("button", { name: "确认" }));
  const action = within(row).getByRole("button", { name: "确认" });
  expect(action).toHaveAttribute("aria-busy", "true");
  expect(within(action).getByTestId("button-spinner")).toBeInTheDocument();
  expect(within(row).getByRole("button", { name: "保留历史" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "新增门店" })).not.toHaveAttribute(
    "aria-busy",
    "true",
  );
  finish(jsonResponse({ storeId, version: "2" }));
  await waitFor(() => expect(action).not.toHaveAttribute("aria-busy", "true"));
});

it("requires assignment changes to be saved separately from marking departure", async () => {
  const first = "11111111-1111-4111-8111-111111111111";
  const second = "44444444-4444-4444-8444-444444444444";
  const uid = "22222222-2222-4222-8222-222222222222";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("/enterprises"))
        return jsonResponse({
          authorizationVersion: "1",
          enterprises: [
            { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
          ],
        });
      if (url.includes("/list_directory"))
        return jsonResponse({
          enterpriseKey: "enterprise-1",
          enterpriseName: "示例企业",
          stores: [],
          departments: [
            {
              departmentId: first,
              name: "前厅",
              status: "active",
              version: "1",
            },
            {
              departmentId: second,
              name: "后厨",
              status: "active",
              version: "1",
            },
          ],
        });
      if (url.includes("/list_employees"))
        return jsonResponse({
          employees: [
            {
              employeeUid: uid,
              name: "小王",
              departmentId: first,
              departmentName: "前厅",
              scope: { ownership: "group", storeId: null, storeName: null },
              status: "active",
              version: "1",
            },
          ],
          access: "all",
          nextCursor: null,
        });
      return jsonResponse({});
    }),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  fireEvent.click(await screen.findByRole("button", { name: "编辑" }));
  const form = screen
    .getByRole("heading", { name: "编辑员工" })
    .closest("section")!;
  fireEvent.change(within(form).getByLabelText("部门"), {
    target: { value: second },
  });
  fireEvent.change(within(form).getByLabelText("状态"), {
    target: { value: "departed" },
  });
  expect(within(form).getByRole("button", { name: "保存" })).toBeDisabled();
  expect(within(form).getByText(/离职时保留原归属/)).toBeInTheDocument();
});
