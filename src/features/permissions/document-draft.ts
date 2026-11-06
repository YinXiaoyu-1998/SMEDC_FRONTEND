import type {
  PermissionCategory,
  PermissionDocument,
  PermissionStore,
  PermissionsDocumentsUpdateBody,
  PermissionsDocumentsUpdateResponse,
} from "@/api/permissions";

export interface DocumentScopeDraft {
  readonly enterpriseKey: string;
  readonly ownership: "group" | "store" | "";
  readonly storeName?: string;
  readonly dimensions: Readonly<Record<string, string>>;
}

export interface DocumentDraft {
  readonly categoryId: string;
  readonly fileConfidentialityLevel: number | null;
  readonly scopes: readonly DocumentScopeDraft[];
  readonly historicalSupplementReason: string;
}

export function documentToDraft(document: PermissionDocument): DocumentDraft {
  return {
    categoryId: document.categoryId ?? "",
    fileConfidentialityLevel: document.fileConfidentialityLevel,
    scopes: document.scopes.map((scope) =>
      scope.ownership === "store"
        ? {
            enterpriseKey: scope.enterpriseKey,
            ownership: "store",
            storeName: scope.storeName,
            dimensions: { ...scope.dimensions },
          }
        : {
            enterpriseKey: scope.enterpriseKey,
            ownership: "group",
            dimensions: { ...scope.dimensions },
          },
    ),
    historicalSupplementReason: "",
  };
}

function dimensionsFromList(
  dimensions: readonly {
    readonly dimensionId: string;
    readonly valueId: string;
  }[],
): Record<string, string> {
  return Object.fromEntries(
    dimensions.map(({ dimensionId, valueId }) => [dimensionId, valueId]),
  );
}

export function draftFromUpdateValue(
  value: PermissionsDocumentsUpdateResponse["value"],
  previous: DocumentDraft,
): DocumentDraft {
  return {
    categoryId: value.categoryId,
    fileConfidentialityLevel: value.fileConfidentialityLevel,
    scopes: value.scopes.map((scope) =>
      scope.ownership === "store"
        ? {
            enterpriseKey: scope.enterpriseKey,
            ownership: "store",
            storeName: scope.storeName ?? "",
            dimensions: dimensionsFromList(scope.dimensions),
          }
        : {
            enterpriseKey: scope.enterpriseKey,
            ownership: "group",
            dimensions: dimensionsFromList(scope.dimensions),
          },
    ),
    historicalSupplementReason: previous.historicalSupplementReason,
  };
}

/** 更新响应与列表响应结构不同，这里把响应折回列表行，避免整页重新拉取。 */
export function documentFromUpdate(
  current: PermissionDocument,
  value: PermissionsDocumentsUpdateResponse["value"],
): PermissionDocument {
  return {
    id: current.id,
    title: current.title,
    status: current.status,
    categoryId: value.categoryId,
    fileConfidentialityLevel: value.fileConfidentialityLevel,
    valid: value.valid,
    scopes: value.scopes.map((scope) =>
      scope.ownership === "store"
        ? {
            enterpriseKey: scope.enterpriseKey,
            ownership: "store",
            storeName: scope.storeName ?? "",
            dimensions: dimensionsFromList(scope.dimensions),
          }
        : {
            enterpriseKey: scope.enterpriseKey,
            ownership: "group",
            dimensions: dimensionsFromList(scope.dimensions),
          },
    ),
  };
}

export interface DocumentValidationData {
  readonly stores: readonly PermissionStore[];
}

export function validateDocumentDraft(
  draft: DocumentDraft,
  category: PermissionCategory | undefined,
  data: DocumentValidationData,
): string | null {
  if (category === undefined || category.kind !== "evidence") {
    return "permissions.required";
  }
  if (draft.fileConfidentialityLevel === null) return "permissions.required";
  if (draft.scopes.length === 0) return "permissions.required";

  const required = category.dimensions.map((item) => item.dimensionId);
  for (const scope of draft.scopes) {
    if (
      scope.enterpriseKey === "" ||
      (scope.ownership !== "group" && scope.ownership !== "store")
    ) {
      return "permissions.required";
    }
    if (scope.ownership === "group" && !category.allowGroup) {
      return "permissions.required";
    }
    if (scope.ownership === "store" && !category.allowStore) {
      return "permissions.required";
    }
    if (
      scope.ownership === "store" &&
      (scope.storeName === undefined ||
        scope.storeName === "" ||
        !data.stores.some(
          (store) =>
            store.enterpriseKey === scope.enterpriseKey &&
            store.name === scope.storeName,
        ))
    ) {
      return "permissions.required";
    }
    const selected = Object.keys(scope.dimensions);
    if (
      selected.length !== required.length ||
      required.some((dimensionId) => !scope.dimensions[dimensionId])
    ) {
      return "permissions.required";
    }
  }
  return null;
}

export function documentUpdateBody(
  draft: DocumentDraft,
  expectedVersion: string,
): PermissionsDocumentsUpdateBody {
  return {
    expectedVersion,
    categoryId: draft.categoryId,
    fileConfidentialityLevel: draft.fileConfidentialityLevel ?? 0,
    scopes: draft.scopes.map((scope) =>
      scope.ownership === "store"
        ? {
            enterpriseKey: scope.enterpriseKey,
            ownership: "store" as const,
            storeName: scope.storeName ?? "",
            dimensions: { ...scope.dimensions },
          }
        : {
            enterpriseKey: scope.enterpriseKey,
            ownership: "group" as const,
            dimensions: { ...scope.dimensions },
          },
    ),
    ...(draft.historicalSupplementReason.trim() === ""
      ? {}
      : { historicalSupplementReason: draft.historicalSupplementReason }),
  };
}

export function emptyDocumentScope(): DocumentScopeDraft {
  return { enterpriseKey: "", ownership: "", dimensions: {} };
}
