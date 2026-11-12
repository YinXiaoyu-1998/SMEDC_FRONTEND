import type {
  PermissionCategory,
  PermissionDocument,
  PermissionDimension,
  PermissionStore,
  PermissionsDocumentsUpdateBody,
  PermissionsDocumentsUpdateResponse,
} from "@/api/permissions";

import {
  diffField,
  sameSet,
  type DiffEntry,
  type RebaseChoice,
  type RebaseInput,
  type RebaseOutcome,
} from "./diff";
import { createId } from "./ids";
import {
  categoryName,
  dimensionName,
  dimensionValueName,
  enterpriseName,
  levelLabel,
  type LabelData,
  type Translate,
} from "./labels";

/** 文档范围没有持久条目 ID；id 只用于 React 列表和当前草稿，提交时移除。 */
export interface DocumentScopeDraft {
  readonly id: string;
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

export const EMPTY_DOCUMENT_DRAFT: DocumentDraft = {
  categoryId: "",
  fileConfidentialityLevel: null,
  scopes: [],
  historicalSupplementReason: "",
};

export function documentToDraft(document: PermissionDocument): DocumentDraft {
  return {
    categoryId: document.categoryId ?? "",
    fileConfidentialityLevel: document.fileConfidentialityLevel,
    scopes: document.scopes.map((scope, index) =>
      scope.ownership === "store"
        ? {
            id: `scope-${index}`,
            enterpriseKey: scope.enterpriseKey,
            ownership: "store",
            storeName: scope.storeName,
            dimensions: { ...scope.dimensions },
          }
        : {
            id: `scope-${index}`,
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

export function emptyDocumentScope(): DocumentScopeDraft {
  return { id: createId(), enterpriseKey: "", ownership: "", dimensions: {} };
}

function normalizedStoreName(scope: DocumentScopeDraft): string {
  return scope.ownership === "store" ? (scope.storeName ?? "") : "";
}

/** 规范化完整元组：用于判断两个范围在语义上是否相同。 */
export function sameScopeTuple(
  left: DocumentScopeDraft,
  right: DocumentScopeDraft,
): boolean {
  if (
    left.enterpriseKey !== right.enterpriseKey ||
    left.ownership !== right.ownership ||
    normalizedStoreName(left) !== normalizedStoreName(right)
  ) {
    return false;
  }
  const leftKeys = Object.keys(left.dimensions);
  const rightKeys = Object.keys(right.dimensions);
  return (
    sameSet(leftKeys, rightKeys) &&
    leftKeys.every((key) => left.dimensions[key] === right.dimensions[key])
  );
}

export function describeScope(
  t: Translate,
  data: LabelData,
  scope: DocumentScopeDraft,
): string {
  const business = enterpriseName(t, data, scope.enterpriseKey);
  const ownership =
    scope.ownership === "store"
      ? scope.storeName === undefined || scope.storeName === ""
        ? t("permissions.choose")
        : scope.storeName
      : scope.ownership === "group"
        ? t("permissions.group")
        : t("permissions.choose");
  const conditions = Object.entries(scope.dimensions)
    .map(
      ([dimensionId, valueId]) =>
        `${dimensionName(t, data, dimensionId)}: ${dimensionValueName(
          t,
          data,
          dimensionId,
          valueId,
        )}`,
    )
    .join("; ");
  return `${business} · ${ownership}${conditions === "" ? "" : ` · ${conditions}`}`;
}

function conditionsText(
  t: Translate,
  data: LabelData,
  scope: DocumentScopeDraft,
): string {
  const entries = Object.entries(scope.dimensions);
  if (entries.length === 0) return t("permissions.none");
  return entries
    .map(
      ([dimensionId, valueId]) =>
        `${dimensionName(t, data, dimensionId)}: ${dimensionValueName(
          t,
          data,
          dimensionId,
          valueId,
        )}`,
    )
    .join("; ");
}

function scopeFieldDiff(
  t: Translate,
  data: LabelData,
  before: DocumentScopeDraft,
  after: DocumentScopeDraft,
): DiffEntry[] {
  return [
    ...diffField(
      t("permissions.enterprise"),
      enterpriseName(t, data, before.enterpriseKey),
      enterpriseName(t, data, after.enterpriseKey),
    ),
    ...diffField(
      t("permissions.ownership"),
      before.ownership === "store"
        ? t("permissions.store")
        : before.ownership === "group"
          ? t("permissions.group")
          : t("permissions.choose"),
      after.ownership === "store"
        ? t("permissions.store")
        : after.ownership === "group"
          ? t("permissions.group")
          : t("permissions.choose"),
    ),
    ...diffField(
      t("permissions.scopeStore"),
      before.storeName ?? t("permissions.none"),
      after.storeName ?? t("permissions.none"),
    ),
    ...diffField(
      t("permissions.scopes"),
      conditionsText(t, data, before),
      conditionsText(t, data, after),
    ),
  ];
}

/**
 * 文档差异：类别、密级、范围与本次补录理由。
 * 同一草稿条目按 id 配对显示字段改动；重载后无法唯一配对的范围显示为增删。
 */
export function documentDiff(
  t: Translate,
  data: LabelData,
  draft: DocumentDraft,
  baseline: DocumentDraft,
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  entries.push(
    ...diffField(
      t("permissions.documentCategory"),
      baseline.categoryId === ""
        ? t("permissions.unset")
        : categoryName(t, data, baseline.categoryId),
      draft.categoryId === ""
        ? t("permissions.unset")
        : categoryName(t, data, draft.categoryId),
    ),
  );
  entries.push(
    ...diffField(
      t("permissions.level"),
      levelLabel(t, baseline.fileConfidentialityLevel),
      levelLabel(t, draft.fileConfidentialityLevel),
    ),
  );

  const usedBaseline = new Set<string>();
  for (const scope of draft.scopes) {
    const paired = baseline.scopes.find((item) => item.id === scope.id);
    if (paired !== undefined) {
      usedBaseline.add(paired.id);
      for (const entry of scopeFieldDiff(t, data, paired, scope)) {
        entries.push(entry);
      }
      continue;
    }
    const identical = baseline.scopes.find(
      (item) => !usedBaseline.has(item.id) && sameScopeTuple(item, scope),
    );
    if (identical !== undefined) {
      usedBaseline.add(identical.id);
      continue;
    }
    entries.push({
      kind: "added",
      label: t("permissions.scopes"),
      after: describeScope(t, data, scope),
    });
  }
  for (const scope of baseline.scopes) {
    if (usedBaseline.has(scope.id)) continue;
    entries.push({
      kind: "removed",
      label: t("permissions.scopes"),
      before: describeScope(t, data, scope),
    });
  }

  entries.push(
    ...diffField(
      t("permissions.supplementReason"),
      baseline.historicalSupplementReason.trim(),
      draft.historicalSupplementReason.trim(),
    ),
  );
  return entries;
}

export interface DocumentValidationData {
  readonly stores: readonly PermissionStore[];
  readonly dimensions: readonly PermissionDimension[];
}

/** 改动涉及停用目录项时，服务端要求填写历史补录理由。 */
export function touchesRetiredCatalog(
  draft: DocumentDraft,
  baseline: DocumentDraft,
  data: LabelData,
): boolean {
  const isChanged = (scope: DocumentScopeDraft): boolean => {
    const paired = baseline.scopes.find((item) => item.id === scope.id);
    return paired === undefined || !sameScopeTuple(paired, scope);
  };
  for (const scope of draft.scopes) {
    if (!isChanged(scope)) continue;
    for (const [dimensionId, valueId] of Object.entries(scope.dimensions)) {
      const dimension = data.dimensions.find((item) => item.id === dimensionId);
      if (dimension === undefined || dimension.retired) return true;
      const value = dimension.values.find((item) => item.id === valueId);
      if (value === undefined || value.retired) return true;
    }
  }
  const category = data.categories.find((item) => item.id === draft.categoryId);
  if (category?.retired === true && draft.categoryId !== baseline.categoryId) {
    return true;
  }
  return false;
}

export function validateDocumentDraft(
  draft: DocumentDraft,
  baseline: DocumentDraft,
  category: PermissionCategory | undefined,
  data: DocumentValidationData & LabelData,
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
      return "permissions.scopeRequired";
    }
    if (scope.ownership === "group" && !category.allowGroup) {
      return "permissions.scopeRequired";
    }
    if (scope.ownership === "store" && !category.allowStore) {
      return "permissions.scopeRequired";
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
      return "permissions.scopeMissing";
    }
    const selected = Object.keys(scope.dimensions);
    if (
      selected.length !== required.length ||
      required.some((dimensionId) => !scope.dimensions[dimensionId])
    ) {
      return "permissions.scopeRequired";
    }
  }

  if (
    draft.historicalSupplementReason.trim() === "" &&
    touchesRetiredCatalog(draft, baseline, data)
  ) {
    return "permissions.scopeChangedRequiresReason";
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

function mergeScopes(
  t: Translate,
  draft: DocumentDraft,
  baseline: DocumentDraft,
  server: DocumentDraft,
): {
  readonly scopes: readonly DocumentScopeDraft[];
  readonly notes: string[];
} {
  const notes: string[] = [];
  const result: DocumentScopeDraft[] = [];

  for (const scope of draft.scopes) {
    const original = baseline.scopes.find((item) => item.id === scope.id);
    if (original === undefined) {
      result.push(scope);
      continue;
    }
    if (sameScopeTuple(original, scope)) {
      const stillThere = server.scopes.some((item) =>
        sameScopeTuple(item, original),
      );
      if (!stillThere) {
        notes.push(t("permissions.conflict.scopeServerRemoved"));
        continue;
      }
      result.push(scope);
      continue;
    }
    const stillThere = server.scopes.some((item) =>
      sameScopeTuple(item, original),
    );
    if (!stillThere) {
      notes.push(t("permissions.conflict.scopeNeedsReview"));
    }
    result.push(scope);
  }

  for (const scope of server.scopes) {
    if (baseline.scopes.some((item) => sameScopeTuple(item, scope))) continue;
    if (result.some((item) => sameScopeTuple(item, scope))) continue;
    result.push({ ...scope, id: createId() });
  }

  return { scopes: result, notes };
}

/**
 * 以服务器最新快照为新基线重新应用文档改动。
 * 类别与密级两边都改时要求显式选择；范围按规范化元组合并，
 * 无法唯一配对的范围保留草稿并在重新确认的摘要里提示核对。
 */
export function rebaseDocument(
  t: Translate,
  input: RebaseInput<DocumentDraft>,
): RebaseOutcome<DocumentDraft> {
  const { draft, baseline, server, decisions } = input;
  const choices: RebaseChoice[] = [];

  const resolve = (
    key: string,
    label: string,
    baseValue: string,
    draftValue: string,
    serverValue: string,
    pickDraft: () => void,
  ) => {
    const mineChanged = draftValue !== baseValue;
    const theirsChanged = serverValue !== baseValue;
    if (mineChanged && theirsChanged && draftValue !== serverValue) {
      const decision = decisions[key];
      if (decision === undefined) {
        choices.push({ key, label, serverValue, draftValue });
        return;
      }
      if (decision === "draft") pickDraft();
      return;
    }
    if (mineChanged) pickDraft();
  };

  let categoryId = server.categoryId;
  resolve(
    "category",
    t("permissions.documentCategory"),
    baseline.categoryId,
    draft.categoryId,
    server.categoryId,
    () => {
      categoryId = draft.categoryId;
    },
  );

  let level = server.fileConfidentialityLevel;
  resolve(
    "level",
    t("permissions.level"),
    levelLabel(t, baseline.fileConfidentialityLevel),
    levelLabel(t, draft.fileConfidentialityLevel),
    levelLabel(t, server.fileConfidentialityLevel),
    () => {
      level = draft.fileConfidentialityLevel;
    },
  );

  const merged = mergeScopes(t, draft, baseline, server);
  if (choices.length > 0) return { kind: "choice", choices };
  return {
    kind: "merged",
    draft: {
      categoryId,
      fileConfidentialityLevel: level,
      scopes: merged.scopes,
      historicalSupplementReason: draft.historicalSupplementReason,
    },
    notes: merged.notes,
  };
}
