import type { WorkflowBundle } from "@/features/workflows/api";
import { StoreChecklist, TextField } from "@/features/workflows/Fields";
import {
  firstConfigurationError,
  validateConfiguration,
} from "@/features/workflows/model";
import type {
  ReportGroup,
  WeeklyReportConfiguration,
  WorkflowStore,
} from "@/features/workflows/model";
import {
  listWorkflowEdit,
  WorkflowEditError,
  type RecordOperation,
  type SubmitWorkflowEdit,
} from "@/features/workflows/recordEdits";
import { useWorkflowText } from "@/features/workflows/text";
import {
  RecordDetails,
  WorkflowRecordList,
} from "@/features/workflows/WorkflowRecordList";

import styles from "@/features/workflows/Page.module.css";

const REPORT_TASK = "weekly-business-report";
const MAX_GROUPS = 100;

function configurationIn(bundle: WorkflowBundle) {
  const configuration = bundle.views[REPORT_TASK]?.configuration;
  return configuration?.type === REPORT_TASK ? configuration : null;
}

function hasValidSetup(configuration: WeeklyReportConfiguration | null) {
  return (
    configuration !== null &&
    firstConfigurationError(
      validateConfiguration({ ...configuration, groups: [] }),
    ) === null
  );
}

function availableStores(
  configuration: WeeklyReportConfiguration | null,
  stores: readonly WorkflowStore[],
  original: ReportGroup | undefined,
) {
  const selected = new Set(configuration?.storeNames ?? []);
  const assigned = new Set(
    configuration?.groups
      .filter((group) => group.name !== original?.name)
      .flatMap((group) => group.storeNames) ?? [],
  );
  return stores.filter(
    (store) =>
      selected.has(store.name) && !assigned.has(store.name) && !store.retired,
  );
}

function validateGroup(
  configuration: WeeklyReportConfiguration | null,
  item: ReportGroup,
  original: ReportGroup | undefined,
  stores: readonly WorkflowStore[],
) {
  if (configuration === null) return "recordSaveTaskFirst";
  if (
    configuration.groups.some(
      (group) => group.name === item.name && group.name !== original?.name,
    )
  ) {
    return "recordDuplicate";
  }

  const selected = new Set(configuration.storeNames);
  const eligible = new Set(
    availableStores(configuration, stores, original).map((store) => store.name),
  );
  for (const name of original?.storeNames ?? []) {
    if (selected.has(name)) eligible.add(name);
  }

  if (
    item.name.trim() === "" ||
    item.name.length > 255 ||
    item.storeNames.length === 0 ||
    new Set(item.storeNames).size !== item.storeNames.length ||
    item.storeNames.some((name) => !eligible.has(name))
  ) {
    return "groupsInvalid";
  }

  return undefined;
}

function groupEdit(
  operation: RecordOperation<ReportGroup>,
  stores: readonly WorkflowStore[],
) {
  return listWorkflowEdit({
    operation,
    keyFor: (group) => group.name,
    itemsFor: (bundle) => configurationIn(bundle)?.groups ?? [],
    changeFor: (bundle, groups) => {
      const configuration = configurationIn(bundle);
      if (configuration === null || !hasValidSetup(configuration)) {
        throw new WorkflowEditError("recordSaveTaskFirst");
      }

      if (operation.kind !== "remove") {
        if (groups.length > MAX_GROUPS)
          throw new WorkflowEditError("recordLimit");
        const original =
          operation.kind === "edit"
            ? configuration.groups.find(
                (group) => group.name === operation.original.name,
              )
            : undefined;
        const error = validateGroup(
          configuration,
          operation.value,
          original,
          stores,
        );
        if (error !== undefined) throw new WorkflowEditError(error);
      }

      return {
        kind: "configuration",
        configuration: { ...configuration, groups },
      };
    },
  });
}

export function ReportGroups({
  configuration,
  stores,
  disabled,
  submitEdit,
}: {
  readonly configuration: WeeklyReportConfiguration | null;
  readonly stores: readonly WorkflowStore[];
  readonly disabled: boolean;
  readonly submitEdit: SubmitWorkflowEdit;
}) {
  const { w } = useWorkflowText();
  const groups = configuration?.groups ?? [];
  const addBlockedReason = !hasValidSetup(configuration)
    ? "recordSaveTaskFirst"
    : groups.length >= MAX_GROUPS
      ? "recordLimit"
      : availableStores(configuration, stores, undefined).length === 0
        ? "reportGroupNoStores"
        : undefined;

  return (
    <div className={styles.stack}>
      <WorkflowRecordList
        title={w("groups")}
        items={groups}
        keyFor={(group) => group.name}
        labelFor={(group) => group.name}
        details={({ name, storeNames }) => (
          <RecordDetails
            fields={[
              { label: w("groupName"), value: name },
              {
                label: w("stores"),
                value: (
                  <ul className={styles.summaryList}>
                    {storeNames.map((storeName) => (
                      <li key={storeName}>{storeName}</li>
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        )}
        create={() => ({ name: "", storeNames: [] })}
        fields={(group, onChange, original) => (
          <>
            <TextField
              label={w("groupName")}
              value={group.name}
              required
              maxLength={255}
              onChange={(name) => onChange({ ...group, name })}
            />
            <StoreChecklist
              legend={w("stores")}
              stores={availableStores(configuration, stores, original)}
              selected={group.storeNames}
              onChange={(storeNames) => onChange({ ...group, storeNames })}
            />
          </>
        )}
        validate={(group, original) => {
          const error = validateGroup(configuration, group, original, stores);
          return error === undefined ? undefined : w(error);
        }}
        editFor={(operation) => groupEdit(operation, stores)}
        submitEdit={submitEdit}
        addBlockedReason={
          addBlockedReason === undefined ? undefined : w(addBlockedReason)
        }
        disabled={disabled}
      />
      <p className={styles.hint}>{w("ungrouped")}</p>
    </div>
  );
}
