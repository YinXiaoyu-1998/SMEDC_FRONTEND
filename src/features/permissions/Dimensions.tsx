import type {
  PermissionDimension,
  PermissionDimensionValue,
  PermissionsDimensionsCreateResponse,
  PermissionsDimensionsUpdateResponse,
  PermissionsDimensionsValueCreateResponse,
  PermissionsDimensionsValueUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { PageSection } from "@/ui/PageSection";

import {
  DraftDialogs,
  DraftFeedback,
  NameField,
  RetireCheckbox,
  SaveButton,
  SectionNote,
} from "./components";
import { useRegisterDraft } from "./useRegisterDraft";
import { createId } from "./ids";
import { changeSummary, type Translate } from "./labels";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";

interface NameDraft {
  readonly name: string;
  readonly retired: boolean;
}

const EMPTY_NAME_DRAFT: NameDraft = { name: "", retired: false };

function nameStateText(t: Translate, retired: boolean): string {
  return t(retired ? "permissions.retired" : "permissions.active");
}

function describeName(t: Translate, draft: NameDraft): string {
  return `${draft.name}${draft.retired ? ` · ${t("permissions.retired")}` : ""}`;
}

export function DimensionsSection() {
  const { t } = useText();
  const scope = usePermissionsScope();

  return (
    <PageSection title={t("permissions.tabs.dimensions")}>
      <SectionNote>{t("permissions.dimensionHelp")}</SectionNote>
      <div className={styles.stack}>
        {scope.bundle.dimensions.map((dimension) => (
          <DimensionCard key={dimension.id} dimension={dimension} />
        ))}
      </div>
      <DimensionCreateForm />
    </PageSection>
  );
}

function DimensionCard({ dimension }: { dimension: PermissionDimension }) {
  const { t } = useText();

  return (
    <div className={styles.card}>
      <DimensionEditForm dimension={dimension} />
      <h4 className={styles.subheading}>{t("permissions.values")}</h4>
      {dimension.values.length === 0 ? (
        <p className={styles.hint}>{t("permissions.empty")}</p>
      ) : (
        <div className={styles.stack}>
          {dimension.values.map((value) => (
            <DimensionValueForm
              key={value.id}
              dimension={dimension}
              value={value}
            />
          ))}
        </div>
      )}
      <DimensionValueCreateForm dimension={dimension} />
    </div>
  );
}

function DimensionEditForm({ dimension }: { dimension: PermissionDimension }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const saved: NameDraft = { name: dimension.name, retired: dimension.retired };
  const save = useDraftSave<NameDraft, PermissionsDimensionsUpdateResponse>({
    saved,
    expectedVersion: scope.bundle.version,
    normalize: (value) => value,
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    describe: (draft) =>
      changeSummary(
        t,
        dimension.name,
        describeName(t, saved),
        describeName(t, draft),
      ),
    submit: (draft, expectedVersion) =>
      scope.writes.updateDimension(dimension.id, {
        expectedVersion,
        name: draft.name,
        retired: draft.retired,
      }),
    draftFromResult: (result) => ({
      name: result.value.name,
      retired: result.value.retired,
    }),
    reload: async () => {
      const next = await scope.reload();
      const latest = next.dimensions.find((item) => item.id === dimension.id);
      return latest === undefined
        ? saved
        : { name: latest.name, retired: latest.retired };
    },
    conflictFields: (draft, current) => [
      {
        key: "name",
        label: t("permissions.name"),
        serverValue: current.name,
        draftValue: draft.name,
      },
      {
        key: "retired",
        label: t("permissions.retired"),
        serverValue: nameStateText(t, current.retired),
        draftValue: nameStateText(t, draft.retired),
      },
    ],
  });
  useRegisterDraft(save.isDirty || save.conflict);

  return (
    <form
      className={styles.subcard}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h3 className={styles.cardTitle}>{dimension.name}</h3>
      <NameField
        label={t("permissions.name")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ ...save.draft, name });
        }}
      />
      <RetireCheckbox
        checked={save.draft.retired}
        disabled={save.saving}
        onChange={(retired) => {
          save.setDraft({ ...save.draft, retired });
        }}
      />
      <div className={styles.actions}>
        <SaveButton save={save} />
      </div>
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}

function DimensionCreateForm() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const save = useDraftSave<NameDraft, PermissionsDimensionsCreateResponse>({
    saved: EMPTY_NAME_DRAFT,
    expectedVersion: scope.bundle.version,
    normalize: (value) => value,
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    describe: (draft) =>
      changeSummary(
        t,
        draft.name.trim() === "" ? t("permissions.addDimension") : draft.name,
        t("permissions.notCreated"),
        describeName(t, draft),
      ),
    submit: (draft, expectedVersion) =>
      scope.writes.createDimension({
        expectedVersion,
        id: createId(),
        name: draft.name,
        retired: draft.retired,
      }),
    draftFromResult: () => EMPTY_NAME_DRAFT,
    reload: async () => {
      await scope.reload();
      return EMPTY_NAME_DRAFT;
    },
    conflictFields: (draft) => [
      {
        key: "name",
        label: t("permissions.name"),
        serverValue: t("permissions.notCreated"),
        draftValue: draft.name,
      },
    ],
  });
  useRegisterDraft(save.isDirty || save.conflict);

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h3 className={styles.cardTitle}>{t("permissions.addDimension")}</h3>
      <NameField
        label={t("permissions.name")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ ...save.draft, name });
        }}
      />
      <div className={styles.actions}>
        <SaveButton save={save} />
      </div>
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}

function DimensionValueForm({
  dimension,
  value,
}: {
  dimension: PermissionDimension;
  value: PermissionDimensionValue;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const saved: NameDraft = { name: value.name, retired: value.retired };
  const save = useDraftSave<
    NameDraft,
    PermissionsDimensionsValueUpdateResponse
  >({
    saved,
    expectedVersion: scope.bundle.version,
    normalize: (item) => item,
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    describe: (draft) =>
      changeSummary(
        t,
        `${dimension.name} · ${value.name}`,
        describeName(t, saved),
        describeName(t, draft),
      ),
    submit: (draft, expectedVersion) =>
      scope.writes.updateDimensionValue(dimension.id, value.id, {
        expectedVersion,
        name: draft.name,
        retired: draft.retired,
      }),
    draftFromResult: (result) => ({
      name: result.value.name,
      retired: result.value.retired,
    }),
    reload: async () => {
      const next = await scope.reload();
      const latest = next.dimensions
        .find((item) => item.id === dimension.id)
        ?.values.find((item) => item.id === value.id);
      return latest === undefined
        ? saved
        : { name: latest.name, retired: latest.retired };
    },
    conflictFields: (draft, current) => [
      {
        key: "name",
        label: t("permissions.name"),
        serverValue: current.name,
        draftValue: draft.name,
      },
      {
        key: "retired",
        label: t("permissions.retired"),
        serverValue: nameStateText(t, current.retired),
        draftValue: nameStateText(t, draft.retired),
      },
    ],
  });
  useRegisterDraft(save.isDirty || save.conflict);

  return (
    <form
      className={styles.subcard}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <NameField
        label={t("permissions.values")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ ...save.draft, name });
        }}
      />
      <RetireCheckbox
        checked={save.draft.retired}
        disabled={save.saving}
        onChange={(retired) => {
          save.setDraft({ ...save.draft, retired });
        }}
      />
      <div className={styles.actions}>
        <SaveButton save={save} />
      </div>
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}

function DimensionValueCreateForm({
  dimension,
}: {
  dimension: PermissionDimension;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const save = useDraftSave<
    NameDraft,
    PermissionsDimensionsValueCreateResponse
  >({
    saved: EMPTY_NAME_DRAFT,
    expectedVersion: scope.bundle.version,
    normalize: (value) => value,
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    describe: (draft) =>
      changeSummary(
        t,
        `${dimension.name} · ${draft.name.trim() === "" ? t("permissions.addValue") : draft.name}`,
        t("permissions.notCreated"),
        describeName(t, draft),
      ),
    submit: (draft, expectedVersion) =>
      scope.writes.createDimensionValue(dimension.id, {
        expectedVersion,
        id: createId(),
        name: draft.name,
        retired: draft.retired,
      }),
    draftFromResult: () => EMPTY_NAME_DRAFT,
    reload: async () => {
      await scope.reload();
      return EMPTY_NAME_DRAFT;
    },
    conflictFields: (draft) => [
      {
        key: "name",
        label: t("permissions.name"),
        serverValue: t("permissions.notCreated"),
        draftValue: draft.name,
      },
    ],
  });
  useRegisterDraft(save.isDirty || save.conflict);

  return (
    <form
      className={styles.subcard}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h4 className={styles.cardTitle}>{t("permissions.addValue")}</h4>
      <NameField
        label={t("permissions.name")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ ...save.draft, name });
        }}
      />
      <div className={styles.actions}>
        <SaveButton save={save} />
      </div>
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}
