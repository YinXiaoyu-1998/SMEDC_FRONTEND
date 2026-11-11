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

type DirectoryDepartment = {
  departmentId: string;
  name: string;
  status: "active" | "retired";
  version: string;
};

const frontDeskId = "11111111-1111-4111-8111-111111111111";
const kitchenId = "22222222-2222-4222-8222-222222222222";

function stubDepartmentDirectory(
  departments: DirectoryDepartment[],
  manageDepartment?: (body: unknown) => Response | Promise<Response>,
  checkName: (body: {
    name: string;
    enterpriseKey: string;
    excludeDepartmentId?: string;
  }) => Response | Promise<Response> = () => jsonResponse({ duplicate: false }),
) {
  const calls: { url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
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
          departments,
        });
      if (url.includes("/list_employees"))
        return jsonResponse({
          employees: [],
          access: "none",
          nextCursor: null,
        });
      if (url.includes("/check_department_name")) {
        return checkName(JSON.parse(String(init.body)));
      }
      if (url.includes("/manage_department")) {
        const body =
          init.body === undefined ? null : JSON.parse(String(init.body));
        calls.push({ url, body });
        return manageDepartment
          ? manageDepartment(body)
          : jsonResponse({
              departmentId: "33333333-3333-4333-8333-333333333333",
              version: "2",
            });
      }
      return jsonResponse({});
    }),
  );
  return calls;
}

async function openDepartments() {
  fireEvent.click(await screen.findByRole("button", { name: "部门目录" }));
  return await screen.findByLabelText("新部门名称");
}

it("blocks creating a department whose name duplicates an existing one", async () => {
  const check = vi.fn(() => jsonResponse({ duplicate: true }));
  const calls = stubDepartmentDirectory(
    [
      {
        departmentId: frontDeskId,
        name: "Ａ组",
        status: "active",
        version: "1",
      },
    ],
    undefined,
    check,
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  const input = await openDepartments();
  await screen.findByRole("row", { name: /Ａ组/ });
  fireEvent.change(input, { target: { value: "Ａ组" } });
  expect(screen.getByText("该部门名称已存在")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "新增部门" })).toBeDisabled();

  fireEvent.change(input, { target: { value: "A组" } });
  expect(await screen.findByText("该部门名称已存在")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "新增部门" })).toBeDisabled();
  expect(check).toHaveBeenCalledWith({
    enterpriseKey: "enterprise-1",
    name: "A组",
  });
  expect(calls).toHaveLength(0);
});

it("blocks creating a department whose name has leading or trailing whitespace", async () => {
  const calls = stubDepartmentDirectory([
    {
      departmentId: frontDeskId,
      name: "前厅",
      status: "active",
      version: "1",
    },
  ]);
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  const input = await openDepartments();
  fireEvent.change(input, { target: { value: " 后厨 " } });
  expect(screen.getByText("部门名称不能以空白开头或结尾")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "新增部门" })).toBeDisabled();
  expect(calls).toHaveLength(0);
});

it("blocks creating a department with a blank name", async () => {
  const calls = stubDepartmentDirectory([]);
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  const input = await openDepartments();
  expect(screen.getByRole("button", { name: "新增部门" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "   " } });
  expect(screen.getByText("请输入部门名称")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "新增部门" })).toBeDisabled();
  expect(calls).toHaveLength(0);
});

it("shows a duplicate-name error beside the name field when the server rejects a create", async () => {
  const calls = stubDepartmentDirectory(
    [
      {
        departmentId: frontDeskId,
        name: "前厅",
        status: "active",
        version: "1",
      },
    ],
    () =>
      jsonResponse(
        { error: { code: "DIRECTORY_DUPLICATE_NAME", message: "duplicate" } },
        409,
      ),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  const input = await openDepartments();
  fireEvent.change(input, { target: { value: "后厨" } });
  const button = screen.getByRole("button", { name: "新增部门" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  expect(await screen.findByText("该部门名称已存在")).toBeInTheDocument();
  expect(input).toHaveValue("后厨");
  expect(screen.getByRole("button", { name: "新增部门" })).toBeDisabled();
  expect(screen.queryByText(/数据已变化，草稿保留/)).not.toBeInTheDocument();
  expect(calls).toHaveLength(1);
});

it("keeps a new draft submittable when an older request reports a duplicate", async () => {
  let respond!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    respond = resolve;
  });
  const calls = stubDepartmentDirectory([], () => pending);
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  const input = await openDepartments();
  const button = screen.getByRole("button", { name: "新增部门" });
  fireEvent.change(input, { target: { value: "前厅" } });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() => expect(calls).toHaveLength(1));
  fireEvent.change(input, { target: { value: "后厨" } });
  respond(
    jsonResponse(
      { error: { code: "DIRECTORY_DUPLICATE_NAME", message: "duplicate" } },
      409,
    ),
  );
  await waitFor(() => expect(button).toBeEnabled());
  expect(input).toHaveValue("后厨");
  expect(screen.queryByText("该部门名称已存在")).not.toBeInTheDocument();
});

it("shows a duplicate-name error beside the name field when the server rejects a rename", async () => {
  stubDepartmentDirectory(
    [
      {
        departmentId: frontDeskId,
        name: "前厅",
        status: "active",
        version: "1",
      },
      {
        departmentId: kitchenId,
        name: "后厨",
        status: "active",
        version: "1",
      },
    ],
    () =>
      jsonResponse(
        { error: { code: "DIRECTORY_DUPLICATE_NAME", message: "duplicate" } },
        409,
      ),
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  await openDepartments();
  const row = await screen.findByRole("row", { name: /前厅/ });
  fireEvent.click(within(row).getByRole("button", { name: "改名" }));
  const form = screen
    .getByRole("heading", { name: "修改名称" })
    .closest("section")!;
  fireEvent.change(within(form).getByLabelText("新名称"), {
    target: { value: "后厨" },
  });
  const save = within(form).getByRole("button", { name: "保存" });
  await waitFor(() => expect(save).toBeEnabled());
  fireEvent.click(save);
  expect(await within(form).findByText("该部门名称已存在")).toBeInTheDocument();
  expect(within(form).getByLabelText("新名称")).toHaveValue("后厨");
  expect(screen.queryByText(/数据已变化，草稿保留/)).not.toBeInTheDocument();
});

it("checks rename duplicates against other departments but not itself", async () => {
  const check = vi.fn((body: { name: string }) =>
    jsonResponse({ duplicate: body.name === "kitchen" }),
  );
  const calls = stubDepartmentDirectory(
    [
      {
        departmentId: frontDeskId,
        name: "Front Desk",
        status: "active",
        version: "1",
      },
      {
        departmentId: kitchenId,
        name: "Kitchen",
        status: "retired",
        version: "1",
      },
    ],
    undefined,
    check,
  );
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  await openDepartments();
  const row = await screen.findByRole("row", { name: /Front Desk/ });
  fireEvent.click(within(row).getByRole("button", { name: "改名" }));
  const form = screen
    .getByRole("heading", { name: "修改名称" })
    .closest("section")!;
  const input = within(form).getByLabelText("新名称");
  fireEvent.change(input, { target: { value: "  Kitchen" } });
  expect(
    within(form).getByText("部门名称不能以空白开头或结尾"),
  ).toBeInTheDocument();
  expect(within(form).getByRole("button", { name: "保存" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "kitchen" } });
  expect(await within(form).findByText("该部门名称已存在")).toBeInTheDocument();
  expect(within(form).getByRole("button", { name: "保存" })).toBeDisabled();
  expect(calls).toHaveLength(0);
  fireEvent.change(input, { target: { value: "front desk" } });
  expect(within(form).queryByText("该部门名称已存在")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(within(form).getByRole("button", { name: "保存" })).toBeEnabled(),
  );
  expect(check).toHaveBeenLastCalledWith({
    enterpriseKey: "enterprise-1",
    name: "front desk",
    excludeDepartmentId: frontDeskId,
  });
  fireEvent.click(within(form).getByRole("button", { name: "保存" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]!.body).toEqual({
    enterpriseKey: "enterprise-1",
    operation: {
      kind: "rename",
      departmentId: frontDeskId,
      expectedVersion: "1",
      name: "front desk",
    },
  });
});

it("keeps submission disabled while the database check is unavailable and can retry", async () => {
  const check = vi
    .fn()
    .mockReturnValueOnce(
      jsonResponse(
        { error: { code: "INTERNAL_ERROR", message: "Unavailable" } },
        500,
      ),
    )
    .mockReturnValue(jsonResponse({ duplicate: false }));
  const calls = stubDepartmentDirectory([], undefined, check);
  renderApp({
    session: adminSession,
    initialEntries: ["/admin/org-1/directory"],
  });
  const input = await openDepartments();
  fireEvent.change(input, { target: { value: "新部门" } });
  const button = screen.getByRole("button", { name: "新增部门" });
  expect(button).toBeDisabled();
  const retry = await screen.findByRole("button", { name: "重试检查" });
  expect(button).toBeDisabled();
  fireEvent.click(retry);
  await waitFor(() => expect(button).toBeEnabled());
  expect(calls).toHaveLength(0);
});
