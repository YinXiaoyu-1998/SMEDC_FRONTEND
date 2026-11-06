import { requestWebApi, WebApiError } from "@/api/client";
import {
  permissionsAccountsListResponseSchema,
  permissionsAccountsReadResponseSchema,
  permissionsAccountsUpdateResponseSchema,
  permissionsCategoriesCreateResponseSchema,
  permissionsCategoriesInitializeResponseSchema,
  permissionsCategoriesListResponseSchema,
  permissionsCategoriesUpdateResponseSchema,
  permissionsCutoverActivateResponseSchema,
  permissionsCutoverReadResponseSchema,
  permissionsCutoverSuspendResponseSchema,
  permissionsDimensionsCreateResponseSchema,
  permissionsDimensionsListResponseSchema,
  permissionsDimensionsUpdateResponseSchema,
  permissionsDimensionsValueCreateResponseSchema,
  permissionsDimensionsValueUpdateResponseSchema,
  permissionsDocumentsListResponseSchema,
  permissionsDocumentsUpdateResponseSchema,
  permissionsEnterprisesDeclareResponseSchema,
  permissionsEnterprisesListResponseSchema,
  permissionsEnterprisesPreviewResponseSchema,
  permissionsMeReadResponseSchema,
  permissionsStoresListResponseSchema,
  permissionsStoresUpsertResponseSchema,
  webApiRoutes,
  type PermissionsAccountsListResponse,
  type PermissionsAccountsReadResponse,
  type PermissionsAccountsUpdateBody,
  type PermissionsAccountsUpdateResponse,
  type PermissionsCategoriesCreateBody,
  type PermissionsCategoriesCreateResponse,
  type PermissionsCategoriesInitializeResponse,
  type PermissionsCategoriesListResponse,
  type PermissionsCategoriesUpdateBody,
  type PermissionsCategoriesUpdateResponse,
  type PermissionsCutoverActivateResponse,
  type PermissionsCutoverReadResponse,
  type PermissionsCutoverSuspendResponse,
  type PermissionsDimensionsCreateBody,
  type PermissionsDimensionsCreateResponse,
  type PermissionsDimensionsListResponse,
  type PermissionsDimensionsUpdateBody,
  type PermissionsDimensionsUpdateResponse,
  type PermissionsDimensionsValueCreateBody,
  type PermissionsDimensionsValueCreateResponse,
  type PermissionsDimensionsValueUpdateBody,
  type PermissionsDimensionsValueUpdateResponse,
  type PermissionsDocumentsListResponse,
  type PermissionsDocumentsUpdateBody,
  type PermissionsDocumentsUpdateResponse,
  type PermissionsEnterprisesDeclareResponse,
  type PermissionsEnterprisesListResponse,
  type PermissionsEnterprisesPreviewResponse,
  type PermissionsMeReadResponse,
  type PermissionsStoresListResponse,
  type PermissionsStoresUpsertBody,
  type PermissionsStoresUpsertResponse,
} from "@/api/generated/contract";

// 业务层只从这里引用契约类型，避免在功能目录重复导入 generated
export type {
  PermissionsAccountsListResponse,
  PermissionsAccountsReadResponse,
  PermissionsAccountsUpdateBody,
  PermissionsAccountsUpdateResponse,
  PermissionsCategoriesCreateBody,
  PermissionsCategoriesCreateResponse,
  PermissionsCategoriesInitializeResponse,
  PermissionsCategoriesListResponse,
  PermissionsCategoriesUpdateBody,
  PermissionsCategoriesUpdateResponse,
  PermissionsCutoverActivateResponse,
  PermissionsCutoverReadResponse,
  PermissionsCutoverSuspendResponse,
  PermissionsDimensionsCreateBody,
  PermissionsDimensionsCreateResponse,
  PermissionsDimensionsListResponse,
  PermissionsDimensionsUpdateBody,
  PermissionsDimensionsUpdateResponse,
  PermissionsDimensionsValueCreateBody,
  PermissionsDimensionsValueCreateResponse,
  PermissionsDimensionsValueUpdateBody,
  PermissionsDimensionsValueUpdateResponse,
  PermissionsDocumentsListResponse,
  PermissionsDocumentsUpdateBody,
  PermissionsDocumentsUpdateResponse,
  PermissionsEnterprisesDeclareResponse,
  PermissionsEnterprisesListResponse,
  PermissionsEnterprisesPreviewResponse,
  PermissionsMeReadResponse,
  PermissionsStoresListResponse,
  PermissionsStoresUpsertBody,
  PermissionsStoresUpsertResponse,
};

/** 服务端表示乐观锁版本不一致；调用方必须保留草稿并显式比较，不能重试覆盖。 */
export const VERSION_CONFLICT_CODE = "AUTHORIZATION_VERSION_CONFLICT";

export function isVersionConflict(error: unknown): boolean {
  return error instanceof WebApiError && error.code === VERSION_CONFLICT_CODE;
}

export type PermissionCategory =
  PermissionsCategoriesListResponse["categories"][number];
export type PermissionDimension =
  PermissionsDimensionsListResponse["dimensions"][number];
export type PermissionDimensionValue = PermissionDimension["values"][number];
export type PermissionStore = PermissionsStoresListResponse["stores"][number];
export type PermissionAccount =
  PermissionsAccountsListResponse["accounts"][number];
export type PermissionGrant = PermissionAccount["grants"][number];
export type PermissionEnterprise =
  PermissionsEnterprisesListResponse["enterprises"][number];
export type PermissionDocument =
  PermissionsDocumentsListResponse["documents"][number];
export type PermissionSelection =
  | { readonly kind: "all" }
  | { readonly kind: "fixed"; readonly values: readonly string[] };

export interface PermissionsBundle {
  readonly me: PermissionsMeReadResponse;
  readonly version: string;
  readonly categories: readonly PermissionCategory[];
  readonly stores: readonly PermissionStore[];
  readonly dimensions: readonly PermissionDimension[];
  readonly accounts: readonly PermissionAccount[];
  readonly enterprises: readonly PermissionEnterprise[];
}

export function permissionsQueryKey(orgId: string) {
  return ["web-api", "permissions", orgId] as const;
}

export function readMe(orgId: string): Promise<PermissionsMeReadResponse> {
  const { method, path } = webApiRoutes["permissions.me.read"];
  return requestWebApi(
    { method, path, params: { orgId } },
    permissionsMeReadResponseSchema,
  );
}

export function listCategories(
  orgId: string,
): Promise<PermissionsCategoriesListResponse> {
  const { method, path } = webApiRoutes["permissions.categories.list"];
  return requestWebApi(
    { method, path, params: { orgId } },
    permissionsCategoriesListResponseSchema,
  );
}

export function listStores(
  orgId: string,
): Promise<PermissionsStoresListResponse> {
  const { method, path } = webApiRoutes["permissions.stores.list"];
  return requestWebApi(
    { method, path, params: { orgId } },
    permissionsStoresListResponseSchema,
  );
}

export function listDimensions(
  orgId: string,
): Promise<PermissionsDimensionsListResponse> {
  const { method, path } = webApiRoutes["permissions.dimensions.list"];
  return requestWebApi(
    { method, path, params: { orgId } },
    permissionsDimensionsListResponseSchema,
  );
}

export function listAccounts(
  orgId: string,
): Promise<PermissionsAccountsListResponse> {
  const { method, path } = webApiRoutes["permissions.accounts.list"];
  return requestWebApi(
    { method, path, params: { orgId } },
    permissionsAccountsListResponseSchema,
  );
}

export function readAccount(
  orgId: string,
  employeeId: string,
): Promise<PermissionsAccountsReadResponse> {
  const { method, path } = webApiRoutes["permissions.accounts.read"];
  return requestWebApi(
    { method, path, params: { orgId, employeeId } },
    permissionsAccountsReadResponseSchema,
  );
}

export function listEnterprises(
  orgId: string,
): Promise<PermissionsEnterprisesListResponse> {
  const { method, path } = webApiRoutes["permissions.enterprises.list"];
  return requestWebApi(
    { method, path, params: { orgId } },
    permissionsEnterprisesListResponseSchema,
  );
}

export function listDocuments(
  orgId: string,
  search: string,
  cursor: string | null,
): Promise<PermissionsDocumentsListResponse> {
  const { method, path } = webApiRoutes["permissions.documents.list"];
  return requestWebApi(
    {
      method,
      path,
      params: { orgId },
      query: {
        ...(search === "" ? {} : { search }),
        ...(cursor === null ? {} : { cursor }),
      },
    },
    permissionsDocumentsListResponseSchema,
  );
}

export function readCutover(
  orgId: string,
): Promise<PermissionsCutoverReadResponse> {
  const { method, path } = webApiRoutes["permissions.cutover.read"];
  return requestWebApi(
    { method, path, params: { orgId } },
    permissionsCutoverReadResponseSchema,
  );
}

export function createCategory(
  orgId: string,
  body: PermissionsCategoriesCreateBody,
  csrfToken: string,
): Promise<PermissionsCategoriesCreateResponse> {
  const { method, path } = webApiRoutes["permissions.categories.create"];
  return requestWebApi(
    { method, path, params: { orgId }, body, csrfToken },
    permissionsCategoriesCreateResponseSchema,
  );
}

export function initializeCategories(
  orgId: string,
  expectedVersion: string,
  csrfToken: string,
): Promise<PermissionsCategoriesInitializeResponse> {
  const { method, path } = webApiRoutes["permissions.categories.initialize"];
  return requestWebApi(
    { method, path, params: { orgId }, body: { expectedVersion }, csrfToken },
    permissionsCategoriesInitializeResponseSchema,
  );
}

export function updateCategory(
  orgId: string,
  id: string,
  body: PermissionsCategoriesUpdateBody,
  csrfToken: string,
): Promise<PermissionsCategoriesUpdateResponse> {
  const { method, path } = webApiRoutes["permissions.categories.update"];
  return requestWebApi(
    { method, path, params: { orgId, id }, body, csrfToken },
    permissionsCategoriesUpdateResponseSchema,
  );
}

export function createDimension(
  orgId: string,
  body: PermissionsDimensionsCreateBody,
  csrfToken: string,
): Promise<PermissionsDimensionsCreateResponse> {
  const { method, path } = webApiRoutes["permissions.dimensions.create"];
  return requestWebApi(
    { method, path, params: { orgId }, body, csrfToken },
    permissionsDimensionsCreateResponseSchema,
  );
}

export function updateDimension(
  orgId: string,
  id: string,
  body: PermissionsDimensionsUpdateBody,
  csrfToken: string,
): Promise<PermissionsDimensionsUpdateResponse> {
  const { method, path } = webApiRoutes["permissions.dimensions.update"];
  return requestWebApi(
    { method, path, params: { orgId, id }, body, csrfToken },
    permissionsDimensionsUpdateResponseSchema,
  );
}

export function createDimensionValue(
  orgId: string,
  dimensionId: string,
  body: PermissionsDimensionsValueCreateBody,
  csrfToken: string,
): Promise<PermissionsDimensionsValueCreateResponse> {
  const { method, path } = webApiRoutes["permissions.dimensions.valueCreate"];
  return requestWebApi(
    { method, path, params: { orgId, dimensionId }, body, csrfToken },
    permissionsDimensionsValueCreateResponseSchema,
  );
}

export function updateDimensionValue(
  orgId: string,
  dimensionId: string,
  id: string,
  body: PermissionsDimensionsValueUpdateBody,
  csrfToken: string,
): Promise<PermissionsDimensionsValueUpdateResponse> {
  const { method, path } = webApiRoutes["permissions.dimensions.valueUpdate"];
  return requestWebApi(
    { method, path, params: { orgId, dimensionId, id }, body, csrfToken },
    permissionsDimensionsValueUpdateResponseSchema,
  );
}

export function upsertStore(
  orgId: string,
  body: PermissionsStoresUpsertBody,
  csrfToken: string,
): Promise<PermissionsStoresUpsertResponse> {
  const { method, path } = webApiRoutes["permissions.stores.upsert"];
  return requestWebApi(
    { method, path, params: { orgId }, body, csrfToken },
    permissionsStoresUpsertResponseSchema,
  );
}

export function declareEnterprise(
  orgId: string,
  name: string,
  expectedVersion: string,
  csrfToken: string,
): Promise<PermissionsEnterprisesDeclareResponse> {
  const { method, path } = webApiRoutes["permissions.enterprises.declare"];
  return requestWebApi(
    {
      method,
      path,
      params: { orgId },
      body: { expectedVersion, name },
      csrfToken,
    },
    permissionsEnterprisesDeclareResponseSchema,
  );
}

export function previewEnterprise(
  orgId: string,
  name: string,
  csrfToken: string,
): Promise<PermissionsEnterprisesPreviewResponse> {
  const { method, path } = webApiRoutes["permissions.enterprises.preview"];
  return requestWebApi(
    { method, path, params: { orgId }, body: { name }, csrfToken },
    permissionsEnterprisesPreviewResponseSchema,
  );
}

export function updateAccount(
  orgId: string,
  employeeId: string,
  body: PermissionsAccountsUpdateBody,
  csrfToken: string,
): Promise<PermissionsAccountsUpdateResponse> {
  const { method, path } = webApiRoutes["permissions.accounts.update"];
  return requestWebApi(
    { method, path, params: { orgId, employeeId }, body, csrfToken },
    permissionsAccountsUpdateResponseSchema,
  );
}

export function updateDocument(
  orgId: string,
  documentId: string,
  body: PermissionsDocumentsUpdateBody,
  csrfToken: string,
): Promise<PermissionsDocumentsUpdateResponse> {
  const { method, path } = webApiRoutes["permissions.documents.update"];
  return requestWebApi(
    { method, path, params: { orgId, documentId }, body, csrfToken },
    permissionsDocumentsUpdateResponseSchema,
  );
}

export function activateCutover(
  orgId: string,
  expectedVersion: string,
  csrfToken: string,
): Promise<PermissionsCutoverActivateResponse> {
  const { method, path } = webApiRoutes["permissions.cutover.activate"];
  return requestWebApi(
    {
      method,
      path,
      params: { orgId },
      body: { expectedVersion, confirm: true },
      csrfToken,
    },
    permissionsCutoverActivateResponseSchema,
  );
}

export function suspendCutover(
  orgId: string,
  expectedVersion: string,
  csrfToken: string,
): Promise<PermissionsCutoverSuspendResponse> {
  const { method, path } = webApiRoutes["permissions.cutover.suspend"];
  return requestWebApi(
    {
      method,
      path,
      params: { orgId },
      body: { expectedVersion, confirm: true },
      csrfToken,
    },
    permissionsCutoverSuspendResponseSchema,
  );
}

/**
 * 六个读取接口必须来自同一配置版本：任意一处漂移都说明读取期间配置被改写，
 * 直接按版本冲突处理，避免把不同版本的数据拼成一个快照。
 */
export async function loadPermissionsBundle(
  orgId: string,
): Promise<PermissionsBundle> {
  const [me, categories, stores, dimensions, accounts, enterprises] =
    await Promise.all([
      readMe(orgId),
      listCategories(orgId),
      listStores(orgId),
      listDimensions(orgId),
      listAccounts(orgId),
      listEnterprises(orgId),
    ]);

  const version = me.authorizationVersion;
  const versions = [
    categories.authorizationVersion,
    stores.authorizationVersion,
    dimensions.authorizationVersion,
    enterprises.authorizationVersion,
    ...accounts.accounts.map((account) => account.authorizationVersion),
  ];
  if (versions.some((candidate) => candidate !== version)) {
    throw new WebApiError({
      status: 409,
      code: VERSION_CONFLICT_CODE,
      message: "配置版本不一致",
    });
  }

  return {
    me,
    version,
    categories: categories.categories,
    stores: stores.stores,
    dimensions: dimensions.dimensions,
    accounts: accounts.accounts,
    enterprises: enterprises.enterprises,
  };
}
