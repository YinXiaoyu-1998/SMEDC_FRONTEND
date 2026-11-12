import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import * as permissionsApi from "@/api/permissions";
import { documentFromUpdate } from "@/features/permissions/document-draft";
import type {
  PermissionAccount,
  PermissionDimension,
  PermissionDocument,
  PermissionEnterprise,
  PermissionStore,
  PermissionsBundle,
} from "@/api/permissions";
import type {
  PermissionsAccountsUpdateBody,
  PermissionsAccountsUpdateResponse,
  PermissionsCategoriesCreateBody,
  PermissionsCategoriesCreateResponse,
  PermissionsCategoriesInitializeResponse,
  PermissionsCategoriesUpdateBody,
  PermissionsCategoriesUpdateResponse,
  PermissionsCutoverActivateResponse,
  PermissionsCutoverSuspendResponse,
  PermissionsDimensionsCreateBody,
  PermissionsDimensionsCreateResponse,
  PermissionsDimensionsUpdateBody,
  PermissionsDimensionsUpdateResponse,
  PermissionsDimensionsValueCreateBody,
  PermissionsDimensionsValueCreateResponse,
  PermissionsDimensionsValueUpdateBody,
  PermissionsDimensionsValueUpdateResponse,
  PermissionsDocumentsUpdateBody,
  PermissionsEnterprisesDeclareResponse,
  PermissionsEnterprisesPreviewResponse,
  PermissionsStoresUpsertBody,
  PermissionsStoresUpsertResponse,
} from "@/api/generated/contract";

function replaceById<T extends { readonly id: string }>(
  items: readonly T[],
  next: T,
): T[] {
  return items.some((item) => item.id === next.id)
    ? items.map((item) => (item.id === next.id ? next : item))
    : [...items, next];
}

function mergeStoreList(
  stores: readonly PermissionStore[],
  next: PermissionStore,
): PermissionStore[] {
  return stores.some(
    (store) =>
      store.enterpriseKey === next.enterpriseKey && store.name === next.name,
  )
    ? stores.map((store) =>
        store.enterpriseKey === next.enterpriseKey && store.name === next.name
          ? next
          : store,
      )
    : [...stores, next];
}

function upsertEnterprise(
  enterprises: readonly PermissionEnterprise[],
  next: PermissionEnterprise,
): PermissionEnterprise[] {
  return enterprises.some((item) => item.enterpriseKey === next.enterpriseKey)
    ? enterprises.map((item) =>
        item.enterpriseKey === next.enterpriseKey ? next : item,
      )
    : [...enterprises, next];
}

function addDimensionValue(
  dimensions: readonly PermissionDimension[],
  dimensionId: string,
  value: PermissionDimension["values"][number],
  replace: boolean,
): PermissionDimension[] {
  return dimensions.map((dimension) => {
    if (dimension.id !== dimensionId) return dimension;
    return {
      ...dimension,
      values: replace
        ? dimension.values.map((item) => (item.id === value.id ? value : item))
        : [...dimension.values, value],
    };
  });
}

export interface PermissionsWrites {
  readonly busy: boolean;
  readonly readAccount: (userAccountId: string) => Promise<PermissionAccount>;
  readonly previewEnterprise: (
    name: string,
  ) => Promise<PermissionsEnterprisesPreviewResponse>;
  readonly updateCategory: (
    id: string,
    body: PermissionsCategoriesUpdateBody,
  ) => Promise<PermissionsCategoriesUpdateResponse>;
  readonly createCategory: (
    body: PermissionsCategoriesCreateBody,
  ) => Promise<PermissionsCategoriesCreateResponse>;
  readonly initializeCategories: (
    expectedVersion: string,
  ) => Promise<PermissionsCategoriesInitializeResponse>;
  readonly updateDimension: (
    id: string,
    body: PermissionsDimensionsUpdateBody,
  ) => Promise<PermissionsDimensionsUpdateResponse>;
  readonly createDimension: (
    body: PermissionsDimensionsCreateBody,
  ) => Promise<PermissionsDimensionsCreateResponse>;
  readonly createDimensionValue: (
    dimensionId: string,
    body: PermissionsDimensionsValueCreateBody,
  ) => Promise<PermissionsDimensionsValueCreateResponse>;
  readonly updateDimensionValue: (
    dimensionId: string,
    id: string,
    body: PermissionsDimensionsValueUpdateBody,
  ) => Promise<PermissionsDimensionsValueUpdateResponse>;
  readonly upsertStore: (
    body: PermissionsStoresUpsertBody,
  ) => Promise<PermissionsStoresUpsertResponse>;
  readonly declareEnterprise: (
    name: string,
    expectedVersion: string,
  ) => Promise<PermissionsEnterprisesDeclareResponse>;
  readonly saveAccount: (
    userAccountId: string,
    body: PermissionsAccountsUpdateBody,
  ) => Promise<PermissionsAccountsUpdateResponse>;
  readonly saveDocument: (
    document: PermissionDocument,
    body: PermissionsDocumentsUpdateBody,
  ) => Promise<{
    readonly document: PermissionDocument;
    readonly authorizationVersion: string;
  }>;
  /** 启用必须绑定准备检查报告里的 authorizationVersion。 */
  readonly activate: (
    expectedVersion: string,
  ) => Promise<PermissionsCutoverActivateResponse>;
  readonly suspend: (
    expectedVersion: string,
  ) => Promise<PermissionsCutoverSuspendResponse>;
}

interface UsePermissionsWritesOptions {
  readonly orgId: string;
  readonly csrfToken: string;
  readonly queryKey: QueryKey;
}

/**
 * 所有写操作都经这里落到契约客户端，并在成功后把服务端返回值合回当前快照。
 * 版本号只在服务端返回后推进，页面从不猜测下一个版本。
 */
export function usePermissionsWrites({
  orgId,
  csrfToken,
  queryKey,
}: UsePermissionsWritesOptions): PermissionsWrites {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(0);

  const update = useCallback(
    async (updater: (previous: PermissionsBundle) => PermissionsBundle) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData<PermissionsBundle | undefined>(
        queryKey,
        (previous) => {
          if (previous === undefined) return undefined;
          const next = updater(previous);
          return BigInt(next.version) < BigInt(previous.version)
            ? previous
            : next;
        },
      );
    },
    [queryClient, queryKey],
  );

  const run = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setPending((count) => count + 1);
      try {
        return await operation();
      } finally {
        setPending((count) => Math.max(0, count - 1));
      }
    },
    [],
  );

  const readAccount = useCallback(
    async (userAccountId: string): Promise<PermissionAccount> => {
      const account = await permissionsApi.readAccount(orgId, userAccountId);
      const current = queryClient
        .getQueryData<PermissionsBundle>(queryKey)
        ?.accounts.find((item) => item.id === userAccountId);
      if (current === undefined) {
        throw new Error("账号快照不在当前列表中");
      }
      const merged: PermissionAccount = {
        ...current,
        role: account.role,
        disabled: account.disabled,
        clearance: account.clearance,
        grants: account.grants,
        categories: account.categories,
        authorizationVersion: account.authorizationVersion,
      };
      return merged;
    },
    [orgId, queryClient, queryKey],
  );

  const previewEnterprise = useCallback(
    (name: string) => permissionsApi.previewEnterprise(orgId, name, csrfToken),
    [csrfToken, orgId],
  );

  const updateCategory = useCallback(
    (id: string, body: PermissionsCategoriesUpdateBody) =>
      run(async () => {
        const result = await permissionsApi.updateCategory(
          orgId,
          id,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          categories: replaceById(previous.categories, result.value),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const createCategory = useCallback(
    (body: PermissionsCategoriesCreateBody) =>
      run(async () => {
        const result = await permissionsApi.createCategory(
          orgId,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          categories: replaceById(previous.categories, result.value),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const initializeCategories = useCallback(
    (expectedVersion: string) =>
      run(async () => {
        const result = await permissionsApi.initializeCategories(
          orgId,
          expectedVersion,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const updateDimension = useCallback(
    (id: string, body: PermissionsDimensionsUpdateBody) =>
      run(async () => {
        const result = await permissionsApi.updateDimension(
          orgId,
          id,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          dimensions: previous.dimensions.map((dimension) =>
            dimension.id === id
              ? {
                  ...dimension,
                  name: result.value.name,
                  retired: result.value.retired,
                }
              : dimension,
          ),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const createDimension = useCallback(
    (body: PermissionsDimensionsCreateBody) =>
      run(async () => {
        const result = await permissionsApi.createDimension(
          orgId,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          dimensions: [
            ...previous.dimensions,
            {
              orgId: result.value.orgId,
              id: result.value.id,
              name: result.value.name,
              retired: result.value.retired,
              values: [],
            },
          ],
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const createDimensionValue = useCallback(
    (dimensionId: string, body: PermissionsDimensionsValueCreateBody) =>
      run(async () => {
        const result = await permissionsApi.createDimensionValue(
          orgId,
          dimensionId,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          dimensions: addDimensionValue(
            previous.dimensions,
            dimensionId,
            result.value,
            false,
          ),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const updateDimensionValue = useCallback(
    (
      dimensionId: string,
      id: string,
      body: PermissionsDimensionsValueUpdateBody,
    ) =>
      run(async () => {
        const result = await permissionsApi.updateDimensionValue(
          orgId,
          dimensionId,
          id,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          dimensions: addDimensionValue(
            previous.dimensions,
            dimensionId,
            result.value,
            true,
          ),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const upsertStore = useCallback(
    (body: PermissionsStoresUpsertBody) =>
      run(async () => {
        const result = await permissionsApi.upsertStore(orgId, body, csrfToken);
        const saved: PermissionStore = {
          orgId: result.value.orgId,
          enterpriseKey: result.value.enterpriseKey,
          name: result.value.name,
          retired: result.value.retired,
        };
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          stores: mergeStoreList(previous.stores, saved),
          enterprises: upsertEnterprise(previous.enterprises, {
            enterpriseKey: result.value.enterpriseKey,
            enterpriseName: result.value.enterpriseName,
          }),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const declareEnterprise = useCallback(
    (name: string, expectedVersion: string) =>
      run(async () => {
        const result = await permissionsApi.declareEnterprise(
          orgId,
          name,
          expectedVersion,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          enterprises: upsertEnterprise(previous.enterprises, result.value),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const saveAccount = useCallback(
    (userAccountId: string, body: PermissionsAccountsUpdateBody) =>
      run(async () => {
        const result = await permissionsApi.updateAccount(
          orgId,
          userAccountId,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          accounts: previous.accounts.map((account) =>
            account.id === userAccountId
              ? {
                  ...account,
                  clearance: result.value.clearance,
                  grants: result.value.grants,
                  authorizationVersion: result.authorizationVersion,
                }
              : account,
          ),
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const saveDocument = useCallback(
    (document: PermissionDocument, body: PermissionsDocumentsUpdateBody) =>
      run(async () => {
        const result = await permissionsApi.updateDocument(
          orgId,
          document.id,
          body,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
        }));
        return {
          document: documentFromUpdate(document, result.value),
          authorizationVersion: result.authorizationVersion,
        };
      }),
    [csrfToken, orgId, run, update],
  );

  const activate = useCallback(
    (expectedVersion: string) =>
      run(async () => {
        const result = await permissionsApi.activateCutover(
          orgId,
          expectedVersion,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          me: { ...previous.me, mode: result.value.mode },
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  const suspend = useCallback(
    (expectedVersion: string) =>
      run(async () => {
        const result = await permissionsApi.suspendCutover(
          orgId,
          expectedVersion,
          csrfToken,
        );
        await update((previous) => ({
          ...previous,
          version: result.authorizationVersion,
          me: { ...previous.me, mode: result.value.mode },
        }));
        return result;
      }),
    [csrfToken, orgId, run, update],
  );

  return {
    busy: pending > 0,
    readAccount,
    previewEnterprise,
    updateCategory,
    createCategory,
    initializeCategories,
    updateDimension,
    createDimension,
    createDimensionValue,
    updateDimensionValue,
    upsertStore,
    declareEnterprise,
    saveAccount,
    saveDocument,
    activate,
    suspend,
  };
}
