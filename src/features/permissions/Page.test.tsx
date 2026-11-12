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
          ownership: "group",
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

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

function bodyOf(
  fetchMock: ReturnType<typeof installFetch>,
  method: string,
  path: RegExp,
): unknown[] {
  return fetchMock.mock.calls
    .filter(([input, init]) => {
      const url = new URL(String(input), "http://localhost");
      return (init?.method ?? "GET") === method && path.test(url.pathname);
    })
    .map(([, init]) =>
      init?.body === undefined ? undefined : JSON.parse(String(init.body)),
    );
}

async function openTab(name: string) {
  fireEvent.click(await screen.findByRole("tab", { name }));
}

describe("权限设置页", () => {
  it("加载时读取同一版本的全部分区，默认打开文档类别", async () => {
    const { fetchMock } = renderPermissions();

    await screen.findByRole("heading", { name: "文档类别" });
    await screen.findByText("运营制度");
    expect(
      screen.getByRole("heading", { name: "权限设置" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "类别与密级" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const paths = fetchMock.mock.calls.map(
      ([input]) => new URL(String(input), "http://localhost").pathname,
    );
    for (const suffix of [
      "/permissions/me",
      "/permissions/categories",
      "/permissions/stores",
      "/permissions/dimensions",
      "/permissions/accounts",
      "/permissions/enterprises",
    ]) {
      expect(paths.some((path) => path.endsWith(suffix))).toBe(true);
    }
  });

  it("编辑固定类别密级时确认摘要只有密级一项，并按冻结版本提交", async () => {
    const { fetchMock } = renderPermissions();
    await screen.findByRole("heading", { name: "文档类别" });

    fireEvent.click(await screen.findByRole("button", { name: "固定类别" }));
    const row = (await screen.findByText("营业数据")).closest("tr");
    if (row === null) throw new Error("找不到固定类别行");
    fireEvent.click(within(row).getByRole("button", { name: "编辑" }));

    const panel = await screen.findByRole("dialog", { name: "固定类别" });
    fireEvent.change(within(panel).getByLabelText("密级"), {
      target: { value: "2" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "保存" }));

    const confirm = await screen.findByRole("dialog", { name: "确认本次变更" });
    expect(within(confirm).getAllByTestId("diff-entry")).toHaveLength(1);
    expect(within(confirm).getByText("密级")).toBeInTheDocument();
    expect(within(confirm).queryByText("资料归属")).toBeNull();

    fireEvent.click(within(confirm).getByRole("button", { name: "确认变更" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "固定类别" })).toBeNull();
    });

    const bodies = bodyOf(
      fetchMock,
      "PATCH",
      /\/permissions\/categories\/cat-business$/,
    );
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({
      expectedVersion: "7",
      name: "营业数据",
      confidentialityLevel: 2,
    });
  });

  it("账号逐条新增与删除授权只在最后提交一次完整载荷", async () => {
    const { fetchMock } = renderPermissions();
    await screen.findByRole("heading", { name: "文档类别" });
    await openTab("账号授权");

    const row = (await screen.findByText("张三")).closest("tr");
    if (row === null) throw new Error("找不到账号行");
    fireEvent.click(within(row).getByRole("button", { name: "编辑" }));

    const panel = await screen.findByRole("dialog", { name: "编辑账号授权" });
    fireEvent.change(within(panel).getByLabelText("账号密级"), {
      target: { value: "3" },
    });

    fireEvent.click(within(panel).getByRole("button", { name: "删除" }));
    const removeConfirm = await screen.findByRole("dialog", {
      name: "删除此授权条目？",
    });
    fireEvent.click(
      within(removeConfirm).getByRole("button", { name: "删除" }),
    );
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "删除此授权条目？" }),
      ).toBeNull();
    });

    fireEvent.click(
      within(panel).getByRole("button", { name: "新增授权条目" }),
    );
    const editor = await screen.findByRole("dialog", { name: "新增授权条目" });
    fireEvent.change(within(editor).getByLabelText("业务企业"), {
      target: { value: "ent-1" },
    });
    fireEvent.change(within(editor).getByLabelText("资料归属"), {
      target: { value: "store" },
    });
    fireEvent.click(within(editor).getByRole("checkbox", { name: "营业数据" }));
    fireEvent.change(within(editor).getByLabelText("门店范围"), {
      target: { value: "fixed" },
    });
    fireEvent.click(within(editor).getByRole("checkbox", { name: "一号店" }));
    fireEvent.click(within(editor).getByRole("button", { name: "完成条目" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "新增授权条目" })).toBeNull();
    });

    expect(
      bodyOf(fetchMock, "PATCH", /\/permissions\/accounts\/employee-1$/),
    ).toHaveLength(0);

    fireEvent.click(within(panel).getByRole("button", { name: "保存" }));
    const confirm = await screen.findByRole("dialog", { name: "确认本次变更" });
    expect(within(confirm).getAllByTestId("diff-entry")).toHaveLength(3);

    fireEvent.click(within(confirm).getByRole("button", { name: "确认变更" }));
    await waitFor(() => {
      expect(
        bodyOf(fetchMock, "PATCH", /\/permissions\/accounts\/employee-1$/),
      ).toHaveLength(1);
    });

    const body = bodyOf(
      fetchMock,
      "PATCH",
      /\/permissions\/accounts\/employee-1$/,
    )[0] as {
      readonly expectedVersion: string;
      readonly clearance: number;
      readonly grants: readonly {
        readonly enterpriseKey: string;
        readonly categoryIds: readonly string[];
        readonly ownership: string;
        readonly stores?: {
          readonly kind: string;
          readonly values: readonly string[];
        };
      }[];
    };
    expect(body.expectedVersion).toBe("7");
    expect(body.clearance).toBe(3);
    expect(body.grants).toHaveLength(1);
    expect(body.grants[0]).toMatchObject({
      enterpriseKey: "ent-1",
      ownership: "store",
      categoryIds: ["cat-business"],
      stores: { kind: "fixed", values: ["一号店"] },
    });
  });

  it("版本冲突保留草稿，重新应用后保留服务端新增的授权", async () => {
    const state = createState();
    let conflictSent = false;
    const { fetchMock } = renderPermissions({
      state,
      overrides: {
        "accounts.update": () => {
          if (!conflictSent) {
            conflictSent = true;
            state.version = "8";
            state.accounts = state.accounts.map((account) =>
              account.id === "employee-1"
                ? {
                    ...account,
                    grants: [
                      ...account.grants,
                      {
                        id: "grant-server",
                        orgId: ORG,
                        enterpriseKey: "ent-1",
                        categoryIds: ["cat-dishes"],
                        ownership: "store",
                        stores: { kind: "all" },
                        dimensions: {},
                      },
                    ],
                  }
                : account,
            );
          }
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

    await screen.findByRole("heading", { name: "文档类别" });
    await openTab("账号授权");
    const row = (await screen.findByText("张三")).closest("tr");
    if (row === null) throw new Error("找不到账号行");
    fireEvent.click(within(row).getByRole("button", { name: "编辑" }));
    const panel = await screen.findByRole("dialog", { name: "编辑账号授权" });
    fireEvent.change(within(panel).getByLabelText("账号密级"), {
      target: { value: "3" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "保存" }));
    const confirm = await screen.findByRole("dialog", { name: "确认本次变更" });
    fireEvent.click(within(confirm).getByRole("button", { name: "确认变更" }));

    await screen.findByText("版本冲突");
    expect(screen.queryByRole("dialog", { name: "确认本次变更" })).toBeNull();
    expect(within(panel).getByText("版本冲突")).toBeInTheDocument();

    fireEvent.click(
      within(panel).getByRole("button", {
        name: "以最新配置为基线重新应用我的改动",
      }),
    );
    const reconfirm = await screen.findByRole("dialog", {
      name: "确认本次变更",
    });
    expect(within(reconfirm).getAllByTestId("diff-entry")).toHaveLength(1);
    fireEvent.click(
      within(reconfirm).getByRole("button", { name: "确认变更" }),
    );

    await waitFor(() => {
      const bodies = fetchMock.mock.calls.filter(
        ([input, init]) =>
          String(input).endsWith("/accounts/employee-1") &&
          init?.method === "PATCH",
      );
      expect(bodies).toHaveLength(2);
    });
    const patches = fetchMock.mock.calls.filter(
      ([input, init]) =>
        String(input).endsWith("/accounts/employee-1") &&
        init?.method === "PATCH",
    );
    const body = JSON.parse(String(patches[1]?.[1]?.body)) as {
      readonly expectedVersion: string;
      readonly grants: readonly { readonly id: string }[];
    };
    expect(body.expectedVersion).toBe("8");
    expect(body.grants.map((grant) => grant.id)).toEqual(
      expect.arrayContaining(["grant-1", "grant-server"]),
    );
  });

  it("版本冲突时载入服务器值会放弃草稿", async () => {
    const state = createState();
    const { fetchMock } = renderPermissions({
      state,
      overrides: {
        "accounts.update": () => {
          state.version = "8";
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
    await screen.findByRole("heading", { name: "文档类别" });
    await openTab("账号授权");
    const row = (await screen.findByText("张三")).closest("tr");
    if (row === null) throw new Error("找不到账号行");
    fireEvent.click(within(row).getByRole("button", { name: "编辑" }));
    const panel = await screen.findByRole("dialog", { name: "编辑账号授权" });
    fireEvent.change(within(panel).getByLabelText("账号密级"), {
      target: { value: "3" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "保存" }));
    const confirm = await screen.findByRole("dialog", { name: "确认本次变更" });
    fireEvent.click(within(confirm).getByRole("button", { name: "确认变更" }));

    await screen.findByText("版本冲突");
    fireEvent.click(
      within(panel).getByRole("button", {
        name: "载入服务器值并放弃草稿",
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText("版本冲突")).toBeNull();
    });
    expect(within(panel).getByLabelText("账号密级")).toHaveValue("2");
    expect(
      bodyOf(fetchMock, "PATCH", /\/permissions\/accounts\/employee-1$/),
    ).toHaveLength(1);
  });

  it("有草稿时切换分区要求先确认放弃", async () => {
    renderPermissions();
    await screen.findByRole("heading", { name: "文档类别" });
    fireEvent.click(await screen.findByRole("button", { name: "固定类别" }));
    const row = (await screen.findByText("营业数据")).closest("tr");
    if (row === null) throw new Error("找不到固定类别行");
    fireEvent.click(within(row).getByRole("button", { name: "编辑" }));
    const panel = await screen.findByRole("dialog", { name: "固定类别" });
    fireEvent.change(within(panel).getByLabelText("密级"), {
      target: { value: "2" },
    });

    fireEvent.click(within(panel).getByRole("button", { name: "取消" }));
    const discard = await screen.findByRole("dialog", {
      name: "放弃未保存的更改？",
    });
    fireEvent.click(within(discard).getByRole("button", { name: "保留草稿" }));
    expect(
      screen.queryByRole("dialog", { name: "放弃未保存的更改？" }),
    ).toBeNull();
    expect(
      await screen.findByRole("dialog", { name: "固定类别" }),
    ).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("button", { name: "取消" }));
    const second = await screen.findByRole("dialog", {
      name: "放弃未保存的更改？",
    });
    fireEvent.click(within(second).getByRole("button", { name: "放弃更改" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "固定类别" })).toBeNull();
    });
  });

  it("文档：搜索、打开配置并保存文件密级", async () => {
    const { fetchMock } = renderPermissions();
    await screen.findByRole("heading", { name: "文档类别" });
    await openTab("普通文档");

    await screen.findByText("门店巡检制度");
    fireEvent.change(screen.getByLabelText("按文档名称或 ID 查找"), {
      target: { value: "巡检" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查找" }));
    await waitFor(() => {
      const urls = fetchMock.mock.calls.map(([input]) => String(input));
      expect(urls.some((url) => url.includes("search="))).toBe(true);
    });

    const row = (await screen.findByText("门店巡检制度")).closest("tr");
    if (row === null) throw new Error("找不到文档行");
    fireEvent.click(within(row).getByRole("button", { name: "编辑" }));
    const panel = await screen.findByRole("dialog", { name: "编辑文档配置" });
    fireEvent.change(within(panel).getByLabelText("密级"), {
      target: { value: "3" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "保存" }));

    const confirm = await screen.findByRole("dialog", { name: "确认本次变更" });
    expect(within(confirm).getAllByTestId("diff-entry")).toHaveLength(1);
    fireEvent.click(within(confirm).getByRole("button", { name: "确认变更" }));

    await waitFor(() => {
      expect(
        bodyOf(fetchMock, "PATCH", /\/permissions\/documents\/doc-1$/),
      ).toHaveLength(1);
    });
    const body = bodyOf(
      fetchMock,
      "PATCH",
      /\/permissions\/documents\/doc-1$/,
    )[0] as {
      readonly expectedVersion: string;
      readonly fileConfidentialityLevel: number;
    };
    expect(body.expectedVersion).toBe("7");
    expect(body.fileConfidentialityLevel).toBe(3);
    expect(
      screen.queryByRole("dialog", { name: "编辑文档配置" }),
    ).toBeInTheDocument();
  });

  it("准备检查通过且版本一致时才发送启用请求", async () => {
    const { fetchMock } = renderPermissions();
    await screen.findByRole("heading", { name: "文档类别" });
    await openTab("检查与启用");

    const activate = await screen.findByRole("button", {
      name: "确认启用业务权限",
    });
    expect(activate).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "运行只读准备检查" }));
    await screen.findByText("准备检查通过");
    expect(activate).toBeEnabled();

    fireEvent.click(
      await screen.findByRole("button", { name: "确认启用业务权限" }),
    );
    const confirm = await screen.findByRole("dialog", {
      name: "确认启用业务权限",
    });
    fireEvent.click(within(confirm).getByRole("button", { name: "确认启用" }));

    await waitFor(() => {
      expect(
        bodyOf(fetchMock, "POST", /\/permissions\/cutover\/activate$/),
      ).toHaveLength(1);
    });
    const body = bodyOf(
      fetchMock,
      "POST",
      /\/permissions\/cutover\/activate$/,
    )[0] as { readonly expectedVersion: string; readonly confirm: boolean };
    expect(body).toMatchObject({ expectedVersion: "7", confirm: true });
  });

  it("分区标签支持方向键切换", async () => {
    renderPermissions();
    const tab = await screen.findByRole("tab", { name: "类别与密级" });
    tab.focus();
    fireEvent.keyDown(tab, { key: "ArrowRight" });
    expect(
      await screen.findByRole("tab", { name: "业务条件" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("关闭面板后焦点回到打开它的按钮", async () => {
    renderPermissions();
    await screen.findByRole("heading", { name: "文档类别" });
    await openTab("账号授权");
    const row = (await screen.findByText("张三")).closest("tr");
    if (row === null) throw new Error("找不到账号行");
    const edit = within(row).getByRole("button", { name: "编辑" });
    edit.focus();
    fireEvent.click(edit);
    await screen.findByRole("dialog", { name: "编辑账号授权" });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "编辑账号授权" })).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(edit);
    });
  });

  it("切换语言后分区与按钮使用英文词组", async () => {
    renderPermissions();
    await screen.findByRole("heading", { name: "文档类别" });
    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(
      screen.getByRole("heading", { name: "Permissions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Categories and levels" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Document categories" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "中文" }));
    expect(screen.getByRole("tab", { name: "类别与密级" })).toBeInTheDocument();
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

    await screen.findByText("无访问权限");
    expect(screen.queryByRole("tab", { name: "账号授权" })).toBeNull();
  });

  it("读取失败时给出可重试入口", async () => {
    let attempts = 0;
    renderPermissions({
      overrides: {
        "categories.list": (state, request) => {
          attempts += 1;
          if (attempts === 1) {
            return jsonResponse(
              { error: { code: "INTERNAL_ERROR", message: "boom" } },
              500,
            );
          }
          return handleRequest(state, request, "categories.list");
        },
      },
    });

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    fireEvent.click(
      await screen.findByRole("button", { name: "重新读取配置" }),
    );
    await screen.findByRole("heading", { name: "文档类别" });
    expect(attempts).toBeGreaterThanOrEqual(2);
  });

  it("深链使用 URL 中的企业标识读取配置", async () => {
    const { fetchMock, router } = renderPermissions({ orgId: "org-9" });

    await screen.findByRole("heading", { name: "文档类别" });

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
