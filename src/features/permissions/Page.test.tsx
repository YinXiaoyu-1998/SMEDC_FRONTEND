import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  PermissionAccount,
  PermissionCategory,
  PermissionDimension,
  PermissionDocument,
  PermissionEnterprise,
  PermissionStore,
  PermissionsCutoverReadResponse,
} from "@/api/permissions";
import { adminSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

interface MockState {
  version: string;
  mode: "legacy" | "preparing" | "enabled" | "suspended";
  clearance: number;
  categories: PermissionCategory[];
  stores: PermissionStore[];
  dimensions: PermissionDimension[];
  accounts: PermissionAccount[];
  enterprises: PermissionEnterprise[];
  documents: PermissionDocument[];
  cutover: PermissionsCutoverReadResponse;
}

interface MockRequest {
  readonly method: string;
  readonly pathname: string;
  readonly searchParams: URLSearchParams;
  readonly body: unknown;
}

type Handler = (
  state: MockState,
  request: MockRequest,
) => Response | Promise<Response>;

const ORG = "org-1";

function nextVersion(version: string): string {
  return String(Number(version) + 1);
}

function createState(): MockState {
  const categoryBusiness: PermissionCategory = {
    orgId: ORG,
    id: "cat-business",
    key: "business",
    name: "营业数据",
    kind: "fixed",
    confidentialityLevel: 1,
    allowGroup: false,
    allowStore: true,
    retired: false,
    dimensions: [],
  };
  const categoryDishes: PermissionCategory = {
    orgId: ORG,
    id: "cat-dishes",
    key: "dishes",
    name: "菜品销售",
    kind: "fixed",
    confidentialityLevel: null,
    allowGroup: false,
    allowStore: true,
    retired: false,
    dimensions: [],
  };
  const categoryPolicy: PermissionCategory = {
    orgId: ORG,
    id: "cat-policy",
    key: null,
    name: "运营制度",
    kind: "evidence",
    confidentialityLevel: null,
    allowGroup: true,
    allowStore: false,
    retired: false,
    dimensions: [
      { orgId: ORG, categoryId: "cat-policy", dimensionId: "dim-team" },
    ],
  };
  const dimension: PermissionDimension = {
    orgId: ORG,
    id: "dim-team",
    name: "团队",
    retired: false,
    values: [
      {
        orgId: ORG,
        dimensionId: "dim-team",
        id: "team-a",
        name: "一组",
        retired: false,
      },
    ],
  };
  const store: PermissionStore = {
    orgId: ORG,
    enterpriseKey: "ent-1",
    name: "一号店",
    retired: false,
  };
  const account: PermissionAccount = {
    orgId: ORG,
    userAccountId: "employee-1",
    role: "admin",
    disabled: false,
    clearance: 2,
    mode: "preparing",
    authorizationVersion: "7",
    categories: [
      {
        id: "cat-business",
        key: "business",
        kind: "fixed",
        confidentialityLevel: 1,
        ownerships: ["store"],
        requiredDimensionIds: [],
      },
    ],
    grants: [
      {
        id: "grant-1",
        orgId: ORG,
        enterpriseKey: "ent-1",
        categoryIds: ["cat-business"],
        ownership: "store",
        stores: { kind: "fixed", values: ["一号店"] },
        dimensions: {},
      },
    ],
    displayName: "张三",
    email: "zhangsan@example.com",
    id: "employee-1",
  };
  const documents: PermissionDocument[] = [
    {
      id: "doc-1",
      title: "门店巡检制度",
      status: "archived",
      categoryId: "cat-policy",
      fileConfidentialityLevel: 2,
      valid: true,
      scopes: [
        {
          enterpriseKey: "ent-1",
          ownership: "store",
          storeName: "一号店",
          dimensions: { "dim-team": "team-a" },
        },
      ],
    },
    {
      id: "doc-2",
      title: "培训资料",
      status: "processing",
      categoryId: null,
      fileConfidentialityLevel: null,
      valid: false,
      scopes: [],
    },
  ];

  return {
    version: "7",
    mode: "preparing",
    clearance: 2,
    categories: [categoryBusiness, categoryDishes, categoryPolicy],
    stores: [store],
    dimensions: [dimension],
    accounts: [account],
    enterprises: [{ enterpriseKey: "ent-1", enterpriseName: "示例餐饮" }],
    documents,
    cutover: {
      authorizationVersion: "7",
      mode: "preparing",
      ready: true,
      missing: [],
      accountsWithoutGrants: [],
    },
  };
}

interface RouteDefinition {
  readonly name: string;
  readonly method: string;
  readonly pattern: RegExp;
}

const routes: readonly RouteDefinition[] = [
  { name: "me.read", method: "GET", pattern: /\/permissions\/me$/ },
  {
    name: "categories.initialize",
    method: "POST",
    pattern: /\/permissions\/categories\/initialize$/,
  },
  {
    name: "categories.create",
    method: "POST",
    pattern: /\/permissions\/categories$/,
  },
  {
    name: "categories.update",
    method: "PATCH",
    pattern: /\/permissions\/categories\/[^/]+$/,
  },
  {
    name: "categories.list",
    method: "GET",
    pattern: /\/permissions\/categories$/,
  },
  { name: "stores.upsert", method: "POST", pattern: /\/permissions\/stores$/ },
  { name: "stores.list", method: "GET", pattern: /\/permissions\/stores$/ },
  {
    name: "dimensions.valueUpdate",
    method: "PATCH",
    pattern: /\/permissions\/dimensions\/[^/]+\/values\/[^/]+$/,
  },
  {
    name: "dimensions.valueCreate",
    method: "POST",
    pattern: /\/permissions\/dimensions\/[^/]+\/values$/,
  },
  {
    name: "dimensions.update",
    method: "PATCH",
    pattern: /\/permissions\/dimensions\/[^/]+$/,
  },
  {
    name: "dimensions.create",
    method: "POST",
    pattern: /\/permissions\/dimensions$/,
  },
  {
    name: "dimensions.list",
    method: "GET",
    pattern: /\/permissions\/dimensions$/,
  },
  {
    name: "accounts.update",
    method: "PATCH",
    pattern: /\/permissions\/accounts\/[^/]+$/,
  },
  {
    name: "accounts.read",
    method: "GET",
    pattern: /\/permissions\/accounts\/[^/]+$/,
  },
  { name: "accounts.list", method: "GET", pattern: /\/permissions\/accounts$/ },
  {
    name: "documents.update",
    method: "PATCH",
    pattern: /\/permissions\/documents\/[^/]+$/,
  },
  {
    name: "documents.list",
    method: "GET",
    pattern: /\/permissions\/documents$/,
  },
  {
    name: "enterprises.preview",
    method: "POST",
    pattern: /\/permissions\/enterprises\/preview$/,
  },
  {
    name: "enterprises.declare",
    method: "POST",
    pattern: /\/permissions\/enterprises$/,
  },
  {
    name: "enterprises.list",
    method: "GET",
    pattern: /\/permissions\/enterprises$/,
  },
  {
    name: "cutover.activate",
    method: "POST",
    pattern: /\/permissions\/cutover\/activate$/,
  },
  {
    name: "cutover.suspend",
    method: "POST",
    pattern: /\/permissions\/cutover\/suspend$/,
  },
  { name: "cutover.read", method: "GET", pattern: /\/permissions\/cutover$/ },
];

function resolveRoute(method: string, pathname: string): string {
  for (const route of routes) {
    if (route.method === method && route.pattern.test(pathname)) {
      return route.name;
    }
  }
  throw new Error(`未模拟的接口：${method} ${pathname}`);
}

function replaceById<T extends { readonly id: string }>(
  items: readonly T[],
  next: T,
): T[] {
  return items.map((item) => (item.id === next.id ? next : item));
}

function handleRequest(
  state: MockState,
  request: MockRequest,
  route: string,
): Response {
  switch (route) {
    case "me.read": {
      const account = state.accounts[0];
      return jsonResponse({
        orgId: ORG,
        userAccountId: account?.id ?? "employee-1",
        role: account?.role ?? "admin",
        disabled: account?.disabled ?? false,
        clearance: state.clearance,
        mode: state.mode,
        authorizationVersion: state.version,
        categories: account?.categories ?? [],
        grants: account?.grants ?? [],
        storeReviewEnterprises: { complete: true, write: [], read: [] },
      });
    }
    case "categories.list":
      return jsonResponse({
        authorizationVersion: state.version,
        categories: state.categories,
      });
    case "stores.list":
      return jsonResponse({
        authorizationVersion: state.version,
        stores: state.stores,
      });
    case "dimensions.list":
      return jsonResponse({
        authorizationVersion: state.version,
        dimensions: state.dimensions,
      });
    case "accounts.list":
      return jsonResponse({
        accounts: state.accounts.map((account) => ({
          ...account,
          authorizationVersion: state.version,
        })),
      });
    case "accounts.read": {
      const userAccountId = request.pathname.split("/").at(-1);
      const account = state.accounts.find((item) => item.id === userAccountId);
      if (account === undefined) {
        return jsonResponse(
          {
            error: {
              code: "AUTHORIZATION_ACCOUNT_NOT_FOUND",
              message: "missing",
            },
          },
          404,
        );
      }
      return jsonResponse({
        orgId: ORG,
        userAccountId: account.id,
        role: account.role,
        disabled: account.disabled,
        clearance: account.clearance,
        mode: account.mode,
        authorizationVersion: state.version,
        categories: account.categories,
        grants: account.grants,
      });
    }
    case "enterprises.list":
      return jsonResponse({
        authorizationVersion: state.version,
        enterprises: state.enterprises,
      });
    case "documents.list": {
      const search = (request.searchParams.get("search") ?? "").toLowerCase();
      const documents = state.documents.filter(
        (document) =>
          search === "" ||
          document.title.toLowerCase().includes(search) ||
          document.id.toLowerCase().includes(search),
      );
      return jsonResponse({
        authorizationVersion: state.version,
        documents,
        nextCursor: null,
      });
    }
    case "cutover.read":
      return jsonResponse({
        ...state.cutover,
        authorizationVersion: state.version,
        mode: state.mode,
      });
    case "categories.update": {
      const body = request.body as {
        readonly expectedVersion: string;
        readonly name: string;
        readonly confidentialityLevel?: number;
        readonly ownerships?: readonly ("group" | "store")[];
        readonly requiredDimensionIds?: readonly string[];
        readonly retired?: boolean;
      };
      const id = request.pathname.split("/").at(-1) ?? "";
      const current = state.categories.find((item) => item.id === id);
      if (current === undefined) {
        return jsonResponse(
          { error: { code: "CATEGORY_NOT_FOUND", message: "missing" } },
          404,
        );
      }
      const saved: PermissionCategory = {
        ...current,
        name: body.name,
        retired: body.retired ?? current.retired,
        ...(current.kind === "fixed"
          ? { confidentialityLevel: body.confidentialityLevel ?? null }
          : {
              allowStore: body.ownerships?.includes("store") ?? false,
              allowGroup: body.ownerships?.includes("group") ?? false,
              dimensions: (body.requiredDimensionIds ?? []).map(
                (dimensionId) => ({
                  orgId: ORG,
                  categoryId: current.id,
                  dimensionId,
                }),
              ),
            }),
      };
      state.version = nextVersion(state.version);
      state.categories = replaceById(state.categories, saved);
      return jsonResponse({
        authorizationVersion: state.version,
        value: saved,
      });
    }
    case "categories.create": {
      const body = request.body as {
        readonly id: string;
        readonly name: string;
        readonly ownerships: readonly ("group" | "store")[];
        readonly requiredDimensionIds: readonly string[];
        readonly retired?: boolean;
      };
      state.version = nextVersion(state.version);
      const saved: PermissionCategory = {
        orgId: ORG,
        id: body.id,
        key: null,
        name: body.name,
        kind: "evidence",
        confidentialityLevel: null,
        allowGroup: body.ownerships.includes("group"),
        allowStore: body.ownerships.includes("store"),
        retired: body.retired ?? false,
        dimensions: body.requiredDimensionIds.map((dimensionId) => ({
          orgId: ORG,
          categoryId: body.id,
          dimensionId,
        })),
      };
      state.categories = [...state.categories, saved];
      return jsonResponse({
        authorizationVersion: state.version,
        value: saved,
      });
    }
    case "categories.initialize": {
      state.version = nextVersion(state.version);
      return jsonResponse({
        authorizationVersion: state.version,
        value: { createdCount: 1 },
      });
    }
    case "dimensions.update": {
      const body = request.body as {
        readonly name: string;
        readonly retired?: boolean;
      };
      const id = request.pathname.split("/").at(-1) ?? "";
      const current = state.dimensions.find((item) => item.id === id);
      if (current === undefined) {
        return jsonResponse(
          {
            error: {
              code: "INVALID_PERMISSION_CONFIGURATION",
              message: "missing",
            },
          },
          400,
        );
      }
      const saved: PermissionDimension = {
        ...current,
        name: body.name,
        retired: body.retired ?? current.retired,
      };
      state.version = nextVersion(state.version);
      state.dimensions = replaceById(state.dimensions, saved);
      return jsonResponse({
        authorizationVersion: state.version,
        value: {
          orgId: ORG,
          id: saved.id,
          name: saved.name,
          retired: saved.retired,
        },
      });
    }
    case "dimensions.create": {
      const body = request.body as {
        readonly id: string;
        readonly name: string;
        readonly retired?: boolean;
      };
      state.version = nextVersion(state.version);
      state.dimensions = [
        ...state.dimensions,
        {
          orgId: ORG,
          id: body.id,
          name: body.name,
          retired: body.retired ?? false,
          values: [],
        },
      ];
      return jsonResponse({
        authorizationVersion: state.version,
        value: {
          orgId: ORG,
          id: body.id,
          name: body.name,
          retired: body.retired ?? false,
        },
      });
    }
    case "dimensions.valueCreate": {
      const body = request.body as {
        readonly id: string;
        readonly name: string;
        readonly retired?: boolean;
      };
      const dimensionId = request.pathname.split("/").at(-2) ?? "";
      state.version = nextVersion(state.version);
      const saved = {
        orgId: ORG,
        dimensionId,
        id: body.id,
        name: body.name,
        retired: body.retired ?? false,
      };
      state.dimensions = state.dimensions.map((dimension) =>
        dimension.id === dimensionId
          ? { ...dimension, values: [...dimension.values, saved] }
          : dimension,
      );
      return jsonResponse({
        authorizationVersion: state.version,
        value: saved,
      });
    }
    case "dimensions.valueUpdate": {
      const body = request.body as {
        readonly name: string;
        readonly retired?: boolean;
      };
      const id = request.pathname.split("/").at(-1) ?? "";
      const dimensionId = request.pathname.split("/").at(-3) ?? "";
      state.version = nextVersion(state.version);
      const saved = {
        orgId: ORG,
        dimensionId,
        id,
        name: body.name,
        retired: body.retired ?? false,
      };
      state.dimensions = state.dimensions.map((dimension) =>
        dimension.id === dimensionId
          ? {
              ...dimension,
              values: dimension.values.map((value) =>
                value.id === id ? saved : value,
              ),
            }
          : dimension,
      );
      return jsonResponse({
        authorizationVersion: state.version,
        value: saved,
      });
    }
    case "stores.upsert": {
      const body = request.body as {
        readonly enterpriseKey: string;
        readonly enterpriseName?: string;
        readonly name: string;
        readonly retired?: boolean;
      };
      state.version = nextVersion(state.version);
      const saved: PermissionStore = {
        orgId: ORG,
        enterpriseKey: body.enterpriseKey,
        name: body.name,
        retired: body.retired ?? false,
      };
      state.stores = state.stores.some(
        (store) =>
          store.enterpriseKey === saved.enterpriseKey &&
          store.name === saved.name,
      )
        ? state.stores.map((store) =>
            store.enterpriseKey === saved.enterpriseKey &&
            store.name === saved.name
              ? saved
              : store,
          )
        : [...state.stores, saved];
      const enterpriseName =
        body.enterpriseName ??
        state.enterprises.find(
          (enterprise) => enterprise.enterpriseKey === saved.enterpriseKey,
        )?.enterpriseName ??
        saved.enterpriseKey;
      if (
        !state.enterprises.some(
          (enterprise) => enterprise.enterpriseKey === saved.enterpriseKey,
        )
      ) {
        state.enterprises = [
          ...state.enterprises,
          { enterpriseKey: saved.enterpriseKey, enterpriseName },
        ];
      }
      return jsonResponse({
        authorizationVersion: state.version,
        value: { ...saved, enterpriseName },
      });
    }
    case "enterprises.declare": {
      const body = request.body as { readonly name: string };
      state.version = nextVersion(state.version);
      const saved = {
        orgId: ORG,
        enterpriseKey: "ent-new",
        enterpriseName: body.name,
      };
      state.enterprises = [...state.enterprises, saved];
      return jsonResponse({
        authorizationVersion: state.version,
        value: saved,
      });
    }
    case "enterprises.preview": {
      const body = request.body as { readonly name: string };
      return jsonResponse({
        enterpriseKey: "ent-new",
        enterpriseName: body.name,
      });
    }
    case "accounts.update": {
      const body = request.body as {
        readonly expectedVersion: string;
        readonly clearance: number;
        readonly grants: PermissionAccount["grants"];
      };
      const userAccountId = request.pathname.split("/").at(-1) ?? "";
      state.version = nextVersion(state.version);
      state.accounts = state.accounts.map((account) =>
        account.id === userAccountId
          ? {
              ...account,
              clearance: body.clearance,
              grants: body.grants,
              authorizationVersion: state.version,
            }
          : account,
      );
      return jsonResponse({
        authorizationVersion: state.version,
        value: { clearance: body.clearance, grants: body.grants },
      });
    }
    case "documents.update": {
      const body = request.body as {
        readonly categoryId: string;
        readonly fileConfidentialityLevel: number;
        readonly scopes: readonly (
          | {
              readonly enterpriseKey: string;
              readonly ownership: "group";
              readonly dimensions: Readonly<Record<string, string>>;
            }
          | {
              readonly enterpriseKey: string;
              readonly ownership: "store";
              readonly storeName: string;
              readonly dimensions: Readonly<Record<string, string>>;
            }
        )[];
      };
      const documentId = request.pathname.split("/").at(-1) ?? "";
      state.version = nextVersion(state.version);
      const value = {
        orgId: ORG,
        id: documentId,
        kind: "evidence" as const,
        resourceKey: documentId,
        categoryId: body.categoryId,
        valid: true,
        fileConfidentialityLevel: body.fileConfidentialityLevel,
        contentVersion: "content-1",
        authorizationVersion: state.version,
        documentId,
        sourceDocumentId: null,
        scopes: body.scopes.map((scope, index) => ({
          orgId: ORG,
          resourceId: documentId,
          id: `scope-${index}`,
          enterpriseKey: scope.enterpriseKey,
          ownership: scope.ownership,
          storeName: scope.ownership === "store" ? scope.storeName : null,
          dimensions: Object.entries(scope.dimensions).map(
            ([dimensionId, valueId]) => ({
              orgId: ORG,
              resourceId: documentId,
              scopeId: `scope-${index}`,
              dimensionId,
              valueId,
            }),
          ),
        })),
      };
      state.documents = state.documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              categoryId: body.categoryId,
              fileConfidentialityLevel: body.fileConfidentialityLevel,
              valid: true,
              // 保持与契约一致的判别联合：store 必须带门店名，group 不能带。
              scopes: value.scopes.map((scope) => {
                const dimensions = Object.fromEntries(
                  scope.dimensions.map((dimension) => [
                    dimension.dimensionId,
                    dimension.valueId,
                  ]),
                );
                return scope.ownership === "store"
                  ? {
                      enterpriseKey: scope.enterpriseKey,
                      ownership: "store" as const,
                      storeName: scope.storeName ?? "",
                      dimensions,
                    }
                  : {
                      enterpriseKey: scope.enterpriseKey,
                      ownership: "group" as const,
                      dimensions,
                    };
              }),
            }
          : document,
      );
      return jsonResponse({ authorizationVersion: state.version, value });
    }
    case "cutover.activate": {
      state.version = nextVersion(state.version);
      state.mode = "enabled";
      state.cutover = { ...state.cutover, mode: "enabled" };
      return jsonResponse({
        authorizationVersion: state.version,
        value: { mode: "enabled" },
      });
    }
    case "cutover.suspend": {
      state.version = nextVersion(state.version);
      state.mode = "suspended";
      state.cutover = { ...state.cutover, mode: "suspended" };
      return jsonResponse({
        authorizationVersion: state.version,
        value: { mode: "suspended" },
      });
    }
    default:
      throw new Error(`未实现的接口：${route}`);
  }
}

function installFetch(
  state: MockState,
  overrides: Readonly<Record<string, Handler>> = {},
) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), "http://localhost");
      const method = init?.method ?? "GET";
      const request: MockRequest = {
        method,
        pathname: url.pathname,
        searchParams: url.searchParams,
        body:
          init?.body === undefined
            ? undefined
            : (JSON.parse(String(init.body)) as unknown),
      };
      const route = resolveRoute(method, url.pathname);
      const handler = overrides[route];
      if (handler !== undefined) return handler(state, request);
      return handleRequest(state, request, route);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPermissions(
  options: {
    readonly state?: MockState;
    readonly overrides?: Readonly<Record<string, Handler>>;
    readonly orgId?: string;
  } = {},
) {
  const state = options.state ?? createState();
  const fetchMock = installFetch(state, options.overrides);
  const view = renderApp({
    session: adminSession,
    initialEntries: [`/admin/${options.orgId ?? ORG}/permissions`],
  });
  return { ...view, state, fetchMock };
}

async function openCategories() {
  await screen.findByRole("heading", { name: "营业数据" });
}

function categoryForm(name: string): HTMLElement {
  const heading = screen.getByRole("heading", { name });
  const form = heading.closest("form");
  if (form === null) throw new Error("找不到类别表单");
  return form;
}

async function saveLevel(form: HTMLElement, value: string) {
  fireEvent.change(within(form).getByLabelText("密级"), {
    target: { value },
  });
  fireEvent.click(within(form).getByRole("button", { name: "保存" }));
  const dialog = await screen.findByRole("dialog");
  return dialog;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("权限设置页", () => {
  it("首次加载时读取同一版本的全部分区快照", async () => {
    const { fetchMock } = renderPermissions();

    await openCategories();

    expect(
      screen.getByRole("heading", { name: "权限设置" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "类别密级" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("配置版本: 7")).toBeInTheDocument();
    expect(screen.getByText("准备中 · 仍按原有规则读取")).toBeInTheDocument();

    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    for (const endpoint of [
      "/permissions/me",
      "/permissions/categories",
      "/permissions/stores",
      "/permissions/dimensions",
      "/permissions/accounts",
      "/permissions/enterprises",
    ]) {
      expect(urls.some((url) => url.endsWith(endpoint))).toBe(true);
    }
  });

  it.each([
    { tab: "类别密级", item: "运营制度" },
    { tab: "业务条件", item: "团队" },
  ])(
    "$item 保存停用后移入折叠区，恢复后回到默认列表",
    async ({ tab, item }) => {
      renderPermissions();
      await openCategories();
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      const panel = screen.getByRole("tabpanel", { name: tab });
      const heading = within(panel).getByRole("heading", { name: item });
      const form = heading.closest("form")!;
      const retired = within(form).getByRole("checkbox", {
        name: "停用此项（保留历史引用）",
      });
      const save = within(form).getByRole("button", { name: "保存" });

      fireEvent.click(retired);
      expect(heading).toBeVisible();
      fireEvent.click(save);
      const retireDialog = await screen.findByRole("dialog");
      fireEvent.click(
        within(retireDialog).getByRole("button", { name: "确认变更" }),
      );

      const disclosure = await within(panel).findByRole("button", {
        name: "已停用 (1)",
      });
      expect(disclosure).toHaveAttribute("aria-expanded", "false");
      expect(heading).not.toBeVisible();
      await waitFor(() => expect(disclosure).toHaveFocus());

      fireEvent.click(disclosure);
      expect(disclosure).toHaveAttribute("aria-expanded", "true");
      expect(heading).toBeVisible();
      expect(retired).toBeChecked();

      fireEvent.click(retired);
      fireEvent.click(save);
      const restoreDialog = await screen.findByRole("dialog");
      fireEvent.click(
        within(restoreDialog).getByRole("button", { name: "确认变更" }),
      );

      await waitFor(() => expect(disclosure).not.toBeInTheDocument());
      expect(heading).toBeVisible();
      expect(retired).not.toBeChecked();
    },
  );

  it("类别表单保留已绑定的停用条件，新类别不显示该条件", async () => {
    const state = createState();
    state.dimensions = state.dimensions.map((item) => ({
      ...item,
      retired: true,
    }));
    renderPermissions({ state });
    await openCategories();

    expect(
      within(categoryForm("运营制度")).getByRole("checkbox", {
        name: "团队（已停用）",
      }),
    ).toBeChecked();
    expect(
      within(categoryForm("新增普通文档类别")).queryByRole("checkbox", {
        name: "团队（已停用）",
      }),
    ).not.toBeInTheDocument();
  });

  it("服务器已停用正在编辑的类别时，展开已停用区并保留冲突草稿", async () => {
    renderPermissions({
      overrides: {
        "categories.update": (state) => {
          state.version = "8";
          state.categories = state.categories.map((item) =>
            item.id === "cat-policy" ? { ...item, retired: true } : item,
          );
          return jsonResponse(
            {
              error: {
                code: "AUTHORIZATION_VERSION_CONFLICT",
                message: "conflict",
              },
            },
            409,
          );
        },
      },
    });
    await openCategories();
    const form = categoryForm("运营制度");
    const name = within(form).getByRole("textbox", { name: "文档类别名称" });
    fireEvent.change(name, { target: { value: "运营制度草稿" } });
    fireEvent.click(within(form).getByRole("button", { name: "保存" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "确认变更",
      }),
    );

    const disclosure = await screen.findByRole("button", {
      name: "已停用 (1)",
    });
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(within(form).getByRole("alert", { name: "版本冲突" })).toBeVisible();
    expect(name).toHaveValue("运营制度草稿");
  });

  it("空态：文档列表没有条目时显示空态而不是表格行", async () => {
    const state = createState();
    state.documents = [];
    renderPermissions({ state });
    await openCategories();

    fireEvent.click(screen.getByRole("tab", { name: "普通文档" }));

    const panel = screen.getByRole("tabpanel", { name: "普通文档" });
    await waitFor(() => {
      expect(within(panel).getByText("暂无条目")).toBeInTheDocument();
    });
    expect(
      within(panel).queryByRole("button", { name: "门店巡检制度" }),
    ).toBeNull();
  });

  it("请求失败时展示可重试的错误状态", async () => {
    renderPermissions({
      overrides: {
        "categories.list": () =>
          jsonResponse(
            { error: { code: "INTERNAL_ERROR", message: "boom" } },
            500,
          ),
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "服务器暂时无法处理该操作，请稍后重试",
    );
    expect(
      screen.getByRole("button", { name: "重新读取配置" }),
    ).toBeInTheDocument();
  });

  it("权限被拒绝（403）时显示无权限页面而不是空表单", async () => {
    renderPermissions({
      overrides: {
        "me.read": () =>
          jsonResponse(
            { error: { code: "BROWSER_ACCESS_DENIED", message: "denied" } },
            403,
          ),
      },
    });

    expect(
      await screen.findByRole("heading", { name: "无访问权限" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "营业数据" }),
    ).not.toBeInTheDocument();
  });

  it("确认撤销后提交的授权列表只保留未删除的授权", async () => {
    const state = createState();
    const account = state.accounts[0]!;
    state.accounts = [
      {
        ...account,
        grants: [
          ...account.grants,
          { ...account.grants[0]!, id: "grant-keep" },
        ],
      },
    ];
    renderPermissions({ state });
    await openCategories();
    fireEvent.click(screen.getByRole("tab", { name: "账号授权" }));
    fireEvent.click(await screen.findByRole("button", { name: "编辑" }));
    const [remove] = await screen.findAllByRole("button", {
      name: "删除此授权条目",
    });
    fireEvent.click(remove!);
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "删除此授权条目",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "确认变更",
      }),
    );
    await screen.findByText("已保存。");
    expect(state.accounts[0]?.grants.map((grant) => grant.id)).toEqual([
      "grant-keep",
    ]);
  });

  it("保存密级：确认摘要后提交 expectedVersion 并推进版本", async () => {
    const { fetchMock } = renderPermissions();
    await openCategories();
    const form = categoryForm("营业数据");

    const save = within(form).getByRole("button", { name: "保存" });
    expect(save).toBeDisabled();
    expect(save).toHaveAccessibleDescription("没有需要保存的变更。");

    const dialog = await saveLevel(form, "3");
    expect(within(dialog).getByText("确认本次变更")).toBeInTheDocument();
    expect(within(dialog).getByText(/原配置: 1/)).toBeInTheDocument();
    expect(within(dialog).getByText(/本次配置: 3/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "确认变更" }));

    await waitFor(() => {
      expect(within(form).getByText("已保存。")).toBeInTheDocument();
    });
    expect(screen.getByText("配置版本: 8")).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "保存" })).toBeDisabled();

    const patch = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith("/categories/cat-business") &&
        init?.method === "PATCH",
    );
    expect(patch).toBeDefined();
    expect(JSON.parse(String(patch?.[1]?.body))).toMatchObject({
      expectedVersion: "7",
      name: "营业数据",
      confidentialityLevel: 3,
    });
  });

  it("提交中按钮保持忙碌且不能重复提交", async () => {
    let resolveWrite: ((response: Response) => void) | undefined;
    const state = createState();
    const { fetchMock } = renderPermissions({
      state,
      overrides: {
        "categories.update": (currentState, request) => {
          if (resolveWrite === undefined) {
            return new Promise<Response>((resolve) => {
              resolveWrite = (response) => {
                currentState.version = nextVersion(currentState.version);
                currentState.categories = replaceById(currentState.categories, {
                  ...currentState.categories[0]!,
                  confidentialityLevel: 3,
                });
                resolve(response);
              };
            });
          }
          return handleRequest(currentState, request, "categories.update");
        },
      },
    });
    await openCategories();
    const form = categoryForm("营业数据");
    const dialog = await saveLevel(form, "3");
    const confirm = within(dialog).getByRole("button", { name: "确认变更" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => {
      expect(confirm).toHaveAttribute("aria-busy", "true");
    });
    expect(confirm).toBeDisabled();

    const patchCalls = fetchMock.mock.calls.filter(
      ([input, init]) =>
        String(input).endsWith("/categories/cat-business") &&
        init?.method === "PATCH",
    );
    expect(patchCalls).toHaveLength(1);

    resolveWrite?.(
      jsonResponse({
        authorizationVersion: nextVersion(state.version),
        value: { ...state.categories[0], confidentialityLevel: 3 },
      }),
    );
    await waitFor(() => {
      expect(within(form).getByText("已保存。")).toBeInTheDocument();
    });
  });

  it("版本冲突（409）保留草稿并比较，重新加载后回到服务端值", async () => {
    let calls = 0;
    const state = createState();
    renderPermissions({
      state,
      overrides: {
        "categories.update": (currentState, request) => {
          calls += 1;
          if (calls === 1) {
            currentState.version = "8";
            currentState.categories = replaceById(currentState.categories, {
              ...currentState.categories[0]!,
              confidentialityLevel: 2,
            });
            return jsonResponse(
              {
                error: {
                  code: "AUTHORIZATION_VERSION_CONFLICT",
                  message: "conflict",
                },
              },
              409,
            );
          }
          return handleRequest(currentState, request, "categories.update");
        },
      },
    });
    await openCategories();
    const form = categoryForm("营业数据");
    const dialog = await saveLevel(form, "3");
    fireEvent.click(within(dialog).getByRole("button", { name: "确认变更" }));

    const panel = await screen.findByRole("alert", { name: "版本冲突" });
    expect(within(panel).getByText("2")).toBeInTheDocument();
    expect(within(panel).getByText("3")).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "保存" })).toBeDisabled();
    expect(screen.getByText("配置版本: 8")).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("button", { name: "重新加载" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("alert", { name: "版本冲突" }),
      ).not.toBeInTheDocument();
    });
    expect(within(form).getByLabelText("密级")).toHaveValue("2");
    expect(within(form).getByRole("button", { name: "保存" })).toBeDisabled();
  });

  it("版本冲突后可用草稿重新提交，并按最新版本号提交", async () => {
    let calls = 0;
    const state = createState();
    const { fetchMock } = renderPermissions({
      state,
      overrides: {
        "categories.update": (currentState, request) => {
          calls += 1;
          if (calls === 1) {
            currentState.version = "8";
            currentState.categories = replaceById(currentState.categories, {
              ...currentState.categories[0]!,
              confidentialityLevel: 2,
            });
            return jsonResponse(
              {
                error: {
                  code: "AUTHORIZATION_VERSION_CONFLICT",
                  message: "conflict",
                },
              },
              409,
            );
          }
          return handleRequest(currentState, request, "categories.update");
        },
      },
    });
    await openCategories();
    const form = categoryForm("营业数据");
    const dialog = await saveLevel(form, "3");
    fireEvent.click(within(dialog).getByRole("button", { name: "确认变更" }));

    const panel = await screen.findByRole("alert", { name: "版本冲突" });
    fireEvent.click(
      within(panel).getByRole("button", { name: "用我的改动重新提交" }),
    );

    const secondDialog = await screen.findByRole("dialog");
    expect(within(secondDialog).getByText(/本次配置: 3/)).toBeInTheDocument();
    fireEvent.click(
      within(secondDialog).getByRole("button", { name: "确认变更" }),
    );

    await waitFor(() => {
      expect(within(form).getByText("已保存。")).toBeInTheDocument();
    });

    const patches = fetchMock.mock.calls.filter(
      ([input, init]) =>
        String(input).endsWith("/categories/cat-business") &&
        init?.method === "PATCH",
    );
    expect(patches).toHaveLength(2);
    expect(JSON.parse(String(patches[1]?.[1]?.body))).toMatchObject({
      expectedVersion: "8",
      confidentialityLevel: 3,
    });
  });

  it("切换语言后分区、类别与按钮使用英文词组", async () => {
    renderPermissions();
    await openCategories();

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(
      screen.getByRole("tab", { name: "Category levels" }),
    ).toBeInTheDocument();
    const form = categoryForm("Business data");
    expect(
      within(form).getByRole("button", { name: "Save" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "中文" }));
    expect(screen.getByRole("tab", { name: "类别密级" })).toBeInTheDocument();
  });

  it("深链使用 URL 中的企业标识读取配置", async () => {
    const { fetchMock, router } = renderPermissions({ orgId: "org-9" });

    await screen.findByRole("heading", { name: "营业数据" });

    expect(router.state.location.pathname).toBe("/admin/org-9/permissions");
    expect(screen.getByRole("link", { name: "权限设置" })).toHaveAttribute(
      "href",
      "/admin/org-9/permissions",
    );
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.every((url) => url.includes("/orgs/org-9/permissions/"))).toBe(
      true,
    );
  });
});
