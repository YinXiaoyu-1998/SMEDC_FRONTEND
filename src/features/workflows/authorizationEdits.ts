import type { WorkflowBundle } from "@/features/workflows/api";
import type {
  AuthorizationDraft,
  AuthorizationScope,
  Dataset,
  EmailPurpose,
  ReviewChannel,
  WorkflowAuthorization,
  WorkflowStore,
  WorkflowType,
  WorkflowView,
} from "@/features/workflows/model";
import {
  authorizationActions,
  buildAuthorizationScope,
  defaultAuthorizationDraft,
  isActiveAuthorization,
  WEEKLY_DOWNLOAD_DATASETS,
  workflowEmailPurpose,
} from "@/features/workflows/model";
import {
  WorkflowEditError,
  type RecordOperation,
  type WorkflowEdit,
} from "@/features/workflows/recordEdits";

const uploadDatasets: readonly Dataset[] = [
  "business",
  "dishes",
  "in_store_orders",
  "takeaway_orders",
  "delivery_ledger",
];
export const reviewChannels: readonly ReviewChannel[] = ["meituan", "dianping"];
export const maximumDeliveryVersion = 4_294_967_295;

export interface AuthorizationRecord {
  readonly saved: WorkflowAuthorization | null;
  readonly draft: AuthorizationDraft;
  readonly purpose: EmailPurpose | null;
}

export function authorizationRecord(
  type: WorkflowType,
  saved: WorkflowAuthorization | null = null,
): AuthorizationRecord {
  const defaults = defaultAuthorizationDraft(type);
  if (saved === null) {
    return { saved, draft: defaults, purpose: workflowEmailPurpose(type) };
  }

  const { scope } = saved;
  const draft = { ...defaults, kind: scope.kind, storeNames: scope.storeNames };
  if (scope.kind === "email") {
    return {
      saved,
      purpose: scope.purpose,
      draft: {
        ...draft,
        recipients: scope.recipients,
        allowedSender: scope.allowedSender,
        deliveryVersion: scope.deliveryVersion,
      },
    };
  }

  return {
    saved,
    purpose: workflowEmailPurpose(type),
    draft:
      "datasets" in scope
        ? { ...draft, datasets: scope.datasets }
        : { ...draft, channels: scope.channels },
  };
}

export function allowedAuthorizationStores(
  view: WorkflowView | undefined,
  stores: readonly WorkflowStore[],
): readonly string[] {
  // A configured name can be an official name that is absent from the catalog.
  const retired = new Set(
    stores.filter((store) => store.retired).map((store) => store.name),
  );
  return (view?.configuration?.storeNames ?? []).filter(
    (name) => !retired.has(name),
  );
}

export function authorizationDatasets(
  kind: AuthorizationDraft["kind"],
): readonly Dataset[] {
  return kind === "download" ? WEEKLY_DOWNLOAD_DATASETS : uploadDatasets;
}

export function authorizationScopeAllowed(
  type: WorkflowType,
  allowedStores: readonly string[],
  { draft, purpose }: AuthorizationRecord,
): boolean {
  if (
    !authorizationActions(type).includes(draft.kind) ||
    draft.storeNames.some((name) => !allowedStores.includes(name))
  ) {
    return false;
  }
  if (draft.kind === "email") {
    return purpose === workflowEmailPurpose(type);
  }
  if (draft.kind === "download" || draft.kind === "upload") {
    return draft.datasets.every((name) =>
      authorizationDatasets(draft.kind).includes(name),
    );
  }
  return draft.channels.every((channel) => reviewChannels.includes(channel));
}

export function authorizationRecordEdit(
  type: WorkflowType,
  stores: readonly WorkflowStore[],
  operation: RecordOperation<AuthorizationRecord>,
): WorkflowEdit {
  const original = operation.kind === "add" ? null : operation.original.saved;
  const targetId = original?.authorizationId;
  const value = operation.kind === "remove" ? null : operation.value;
  const scope: AuthorizationScope | null =
    value === null ? null : buildAuthorizationScope(type, value.draft);

  const current = (bundle: WorkflowBundle): WorkflowAuthorization | null =>
    bundle.views[type]?.authorizations.find(
      (authorization) => authorization.authorizationId === targetId,
    ) ?? null;

  return {
    before: original,
    after: scope === null ? null : { scope },
    current,
    change: (bundle) => {
      if (operation.kind !== "add") {
        const target = current(bundle);
        if (target === null || !isActiveAuthorization(target)) {
          throw new WorkflowEditError("recordMissing");
        }
      }
      if (
        value !== null &&
        (scope === null ||
          (value.draft.kind === "email" &&
            value.draft.deliveryVersion > maximumDeliveryVersion) ||
          !authorizationScopeAllowed(
            type,
            allowedAuthorizationStores(bundle.views[type], stores),
            value,
          ))
      ) {
        throw new WorkflowEditError("authorizationScopeChanged");
      }

      return {
        kind: "authorization",
        grant: scope === null ? [] : [scope],
        revokeAuthorizationIds: targetId === undefined ? [] : [targetId],
      };
    },
  };
}
