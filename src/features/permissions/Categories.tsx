import { useState } from "react";

import type {
  PermissionCategory,
  PermissionsCategoriesUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { InlineError } from "@/ui/InlineError";
import { PageSection } from "@/ui/PageSection";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import {
  Checklist,
  DraftDialogs,
  DraftFeedback,
  LevelSelect,
  NameField,
  RetireCheckbox,
  SaveButton,
  SectionNote,
} from "./components";
import { useRegisterDraft } from "./useRegisterDraft";
import {
  FIXED_BUSINESS_CATEGORY_KEYS,
  INTERNAL_CATEGORY_KEY,
} from "./constants";
import { createId } from "./ids";
import {
  categoryLabel,
  changeSummary,
  dimensionName,
  itemLabel,
  type Translate,
} from "./labels";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";

interface EvidenceDraft {
  readonly name: string;
  readonly ownerships: readonly ("group" | "store")[];
  readonly requiredDimensionIds: readonly string[];
  readonly retired: boolean;
}

const EMPTY_EVIDENCE: EvidenceDraft = {
  name: "",
  ownerships: [],
  requiredDimensionIds: [],
  retired: false,
};

function evidenceFromCategory(category: PermissionCategory): EvidenceDraft {
  return {
    name: category.name,
    ownerships: [
      ...(category.allowStore ? (["store"] as const) : []),
      ...(category.allowGroup ? (["group"] as const) : []),
    ],
    requiredDimensionIds: category.dimensions.map((item) => item.dimensionId),
    retired: category.retired,
  };
}

function levelText(t: Translate, value: number | null): string {
  return value === null ? t("permissions.unset") : String(value);
}

function describeEvidence(
  t: Translate,
  draft: EvidenceDraft,
  dimensionNames: readonly string[],
): string {
  const ownerships =
    draft.ownerships.length === 0
      ? t("permissions.choose")
      : draft.ownerships
          .map((value) =>
            t(value === "store" ? "permissions.store" : "permissions.group"),
          )
          .join(", ");
  const dimensions =
    dimensionNames.length === 0
      ? t("permissions.choose")
      : dimensionNames.join(", ");
  return `${draft.name} · ${ownerships} · ${dimensions}${draft.retired ? ` · ${t("permissions.retired")}` : ""}`;
}

export function CategoriesSection() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const categories = scope.bundle.categories;
  const fixed = categories.filter(
    (category) =>
      category.kind === "fixed" && category.key !== INTERNAL_CATEGORY_KEY,
  );
  const evidence = categories.filter(
    (category) => category.kind === "evidence",
  );
  const missingFixed = FIXED_BUSINESS_CATEGORY_KEYS.some(
    (key) =>
      !categories.some(
        (category) => category.kind === "fixed" && category.key === key,
      ),
  );

  return (
    <PageSection title={t("permissions.tabs.categories")}>
      <SectionNote>{t("permissions.fixedHelp")}</SectionNote>
      <SectionNote>{t("permissions.levelHelp")}</SectionNote>
      {missingFixed ? <InitializeCategories /> : null}
      <div className={styles.stack}>
        {fixed.map((category) => (
          <FixedCategoryForm key={category.id} category={category} />
        ))}
      </div>

      <h3 className={styles.subheading}>{t("permissions.documentCategory")}</h3>
      <SectionNote>{t("permissions.evidenceHelp")}</SectionNote>
      {evidence.length === 0 ? (
        <p className={styles.hint}>{t("permissions.empty")}</p>
      ) : (
        <div className={styles.stack}>
          {evidence.map((category) => (
            <EvidenceCategoryForm key={category.id} category={category} />
          ))}
        </div>
      )}
      <EvidenceCategoryForm key="new-evidence-category" category={null} />
    </PageSection>
  );
}

function InitializeCategories() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [error, setError] = useState<unknown>(null);
  const flow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: async () => {
      setError(null);
      try {
        await scope.writes.initializeCategories();
        await scope.reload();
      } catch (caught) {
        setError(caught);
      }
    },
  });
  const blocked = scope.busy || scope.hasDrafts;
  const reason = scope.hasDrafts
    ? t("permissions.initializeDrafts")
    : t("permissions.noChange");

  return (
    <div className={styles.card}>
      <SectionNote>{t("permissions.initializeCategoriesHelp")}</SectionNote>
      <ActionButton
        label={t("permissions.initializeCategories")}
        variant="secondary"
        disabled={blocked}
        {...(blocked ? { disabledReason: reason } : {})}
        onRun={() => {
          void flow.request();
        }}
      />
      <InlineError error={error} />
      <ConfirmDialog
        flow={flow}
        title={t("permissions.initializeCategories")}
        description={t("permissions.initializeCategoriesHelp")}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
    </div>
  );
}

function FixedCategoryForm({ category }: { category: PermissionCategory }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const baseline = category.confidentialityLevel;
  const save = useDraftSave<number | null, PermissionsCategoriesUpdateResponse>(
    {
      saved: baseline,
      expectedVersion: scope.bundle.version,
      normalize: (value) => value,
      validate: (value) => (value === null ? "permissions.required" : null),
      describe: (value) =>
        changeSummary(
          t,
          categoryLabel(t, category),
          levelText(t, baseline),
          levelText(t, value),
        ),
      submit: (value, expectedVersion) => {
        if (value === null) {
          throw new Error("密级不能为空");
        }
        return scope.writes.updateCategory(category.id, {
          expectedVersion,
          name: category.name,
          confidentialityLevel: value,
        });
      },
      draftFromResult: (result) => result.value.confidentialityLevel,
      reload: async () => {
        const next = await scope.reload();
        return (
          next.categories.find((item) => item.id === category.id)
            ?.confidentialityLevel ?? baseline
        );
      },
      conflictFields: (draft, saved) => [
        {
          key: "level",
          label: t("permissions.level"),
          serverValue: levelText(t, saved),
          draftValue: levelText(t, draft),
        },
      ],
    },
  );
  useRegisterDraft(save.isDirty || save.conflict);

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h3 className={styles.cardTitle}>{categoryLabel(t, category)}</h3>
      <Field label={t("permissions.level")}>
        <LevelSelect
          value={save.draft}
          onChange={save.setDraft}
          disabled={save.saving}
        />
      </Field>
      <div className={styles.actions}>
        <SaveButton save={save} />
      </div>
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}

function EvidenceCategoryForm({
  category,
}: {
  category: PermissionCategory | null;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const isNew = category === null;
  const saved =
    category === null ? EMPTY_EVIDENCE : evidenceFromCategory(category);
  const dimensions = scope.bundle.dimensions;
  const save = useDraftSave<EvidenceDraft, PermissionsCategoriesUpdateResponse>(
    {
      saved,
      expectedVersion: scope.bundle.version,
      normalize: (value) => ({
        ...value,
        requiredDimensionIds: [...value.requiredDimensionIds].sort(),
      }),
      validate: (draft) => {
        if (draft.name.trim() === "") return "permissions.required";
        if (draft.ownerships.length === 0) return "permissions.required";
        const unavailable = draft.requiredDimensionIds.some((id) => {
          const dimension = dimensions.find((item) => item.id === id);
          if (dimension === undefined) return true;
          return dimension.retired && !saved.requiredDimensionIds.includes(id);
        });
        return unavailable ? "permissions.dimensionUnavailable" : null;
      },
      describe: (draft) => {
        const dimensionNames = draft.requiredDimensionIds.map((id) =>
          dimensionName(
            t,
            { ...scope.bundle, categories: scope.bundle.categories },
            id,
          ),
        );
        const after = describeEvidence(t, draft, dimensionNames);
        const before = isNew
          ? t("permissions.empty")
          : describeEvidence(
              t,
              saved,
              saved.requiredDimensionIds.map((id) =>
                dimensionName(t, scope.bundle, id),
              ),
            );
        return changeSummary(
          t,
          draft.name.trim() === "" ? t("permissions.addCategory") : draft.name,
          before,
          after,
        );
      },
      submit: (draft, expectedVersion) => {
        if (isNew) {
          return scope.writes.createCategory({
            expectedVersion,
            id: createId(),
            name: draft.name,
            kind: "evidence",
            ownerships: [...draft.ownerships],
            requiredDimensionIds: [...draft.requiredDimensionIds],
            retired: draft.retired,
          });
        }
        if (category === null) {
          throw new Error("缺少类别标识");
        }
        return scope.writes.updateCategory(category.id, {
          expectedVersion,
          name: draft.name,
          ownerships: [...draft.ownerships],
          requiredDimensionIds: [...draft.requiredDimensionIds],
          retired: draft.retired,
        });
      },
      draftFromResult: (result) =>
        isNew ? EMPTY_EVIDENCE : evidenceFromCategory(result.value),
      reload: async () => {
        const next = await scope.reload();
        if (category === null) return EMPTY_EVIDENCE;
        const latest = next.categories.find((item) => item.id === category.id);
        return latest === undefined ? saved : evidenceFromCategory(latest);
      },
      conflictFields: (draft, current) => [
        {
          key: "name",
          label: t("permissions.name"),
          serverValue: current.name,
          draftValue: draft.name,
        },
        {
          key: "ownerships",
          label: t("permissions.ownership"),
          serverValue: describeEvidence(t, { ...current, name: "" }, []),
          draftValue: describeEvidence(t, { ...draft, name: "" }, []),
        },
        {
          key: "retired",
          label: t("permissions.retired"),
          serverValue: t(
            current.retired ? "permissions.retired" : "permissions.active",
          ),
          draftValue: t(
            draft.retired ? "permissions.retired" : "permissions.active",
          ),
        },
      ],
    },
  );
  useRegisterDraft(save.isDirty || save.conflict);

  const dimensionOptions = dimensions.map((dimension) => ({
    value: dimension.id,
    label: itemLabel(t, dimension.name, dimension.retired),
    disabled:
      dimension.retired &&
      !save.draft.requiredDimensionIds.includes(dimension.id),
  }));
  for (const id of save.draft.requiredDimensionIds) {
    if (!dimensionOptions.some((option) => option.value === id)) {
      dimensionOptions.push({
        value: id,
        label: t("permissions.preserved"),
        disabled: false,
      });
    }
  }

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h3 className={styles.cardTitle}>
        {isNew ? t("permissions.addCategory") : category.name}
      </h3>
      <NameField
        label={t("permissions.categoryName")}
        hint={t("permissions.categoryNameHelp")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ ...save.draft, name });
        }}
      />
      <Checklist
        legend={t("permissions.ownership")}
        options={[
          { value: "store", label: t("permissions.store") },
          { value: "group", label: t("permissions.group") },
        ]}
        selected={save.draft.ownerships}
        disabled={save.saving}
        onChange={(ownerships) => {
          save.setDraft({
            ...save.draft,
            ownerships: ownerships.filter(
              (value): value is "group" | "store" =>
                value === "group" || value === "store",
            ),
          });
        }}
      />
      <Checklist
        legend={t("permissions.requiredConditions")}
        options={dimensionOptions}
        selected={save.draft.requiredDimensionIds}
        disabled={save.saving}
        onChange={(requiredDimensionIds) => {
          save.setDraft({ ...save.draft, requiredDimensionIds });
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
