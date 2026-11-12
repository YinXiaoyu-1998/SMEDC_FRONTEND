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
    scopes: document.scopes.map((scope) =>
      scope.ownership === "store"
        ? {
            id: createId(),
            enterpriseKey: scope.enterpriseKey,
            ownership: "store",
            storeName: scope.storeName,
            dimensions: { ...scope.dimensions },
          }
        : {
            id: createId(),
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

function identityDiff(
  label: string,
  before: string,
  after: string,
  beforeLabel: string,
  afterLabel: string,
): DiffEntry[] {
  if (before === after) return [];
  return [
    {
      kind: "changed",
      label,
      before:
        beforeLabel === afterLabel
          ? beforeLabel + " (" + before + ")"
          : beforeLabel,
      after:
        beforeLabel === afterLabel
          ? afterLabel + " (" + after + ")"
          : afterLabel,
    },
  ];
}

const dimensionTuple = (scope: DocumentScopeDraft) =>
  JSON.stringify(
    Object.entries(scope.dimensions).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );

function scopeFieldDiff(
  t: Translate,
  data: LabelData,
  before: DocumentScopeDraft,
  after: DocumentScopeDraft,
): DiffEntry[] {
  return [
    ...identityDiff(
      t("permissions.enterprise"),
      before.enterpriseKey,
      after.enterpriseKey,
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
    ...identityDiff(
      t("permissions.requiredConditions"),
      dimensionTuple(before),
      dimensionTuple(after),
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
    ...identityDiff(
      t("permissions.documentCategory"),
      baseline.categoryId,
      draft.categoryId,
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
  if (
    baseline.categoryId === draft.categoryId &&
    sameScopes(baseline.scopes, draft.scopes)
  )
    return false;
  if (
    data.categories.some((item) => item.id === draft.categoryId && item.retired)
  )
    return true;
  return draft.scopes.some(
    (scope) =>
      (scope.ownership === "store" &&
        data.stores.some(
          (store) =>
            store.enterpriseKey === scope.enterpriseKey &&
            store.name === scope.storeName &&
            (store.retired || store.confirmation === "historical"),
        )) ||
      Object.entries(scope.dimensions).some(([dimensionId, valueId]) => {
        const dimension = data.dimensions.find(
          (item) => item.id === dimensionId,
        );
        return (
          dimension === undefined ||
          dimension.retired ||
          !dimension.values.some(
            (value) => value.id === valueId && !value.retired,
          )
        );
      }),
  );
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

function sameScopes(
  left: readonly DocumentScopeDraft[],
  right: readonly DocumentScopeDraft[],
): boolean {
  if (left.length !== right.length) return false;
  const unmatched = [...right];
  return left.every((scope) => {
    const index = unmatched.findIndex((item) => sameScopeTuple(scope, item));
    if (index < 0) return false;
    unmatched.splice(index, 1);
    return true;
  });
}

/** 文档范围没有持久 ID。两侧都修改时明确选择要保留的完整范围。 */
export function rebaseDocument(
  t: Translate,
  input: RebaseInput<DocumentDraft>,
  data: LabelData,
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

  let scopes = server.scopes;
  const mineChangedScopes = !sameScopes(draft.scopes, baseline.scopes);
  const theirsChangedScopes = !sameScopes(server.scopes, baseline.scopes);
  if (mineChangedScopes && !sameScopes(draft.scopes, server.scopes)) {
    if (!theirsChangedScopes || decisions.scopes === "draft") {
      scopes = draft.scopes;
    } else if (decisions.scopes === undefined) {
      const summarize = (items: readonly DocumentScopeDraft[]) =>
        items.map((item) => describeScope(t, data, item)).join("\n") ||
        t("permissions.none");
      choices.push({
        key: "scopes",
        label: t("permissions.scopes"),
        serverValue: summarize(server.scopes),
        draftValue: summarize(draft.scopes),
      });
    }
  }
  if (choices.length > 0) return { kind: "choice", choices };
  return {
    kind: "merged",
    draft: {
      categoryId,
      fileConfidentialityLevel: level,
      scopes,
      historicalSupplementReason: draft.historicalSupplementReason,
    },
    notes: [],
  };
}
