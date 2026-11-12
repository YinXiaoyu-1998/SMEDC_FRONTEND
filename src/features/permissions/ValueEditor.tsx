import type { RefObject } from "react";

import type {
  PermissionDimension,
  PermissionDimensionValue,
  PermissionsDimensionsValueCreateResponse,
  PermissionsDimensionsValueUpdateResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { InlineError } from "@/ui/InlineError";
import { useConfirmFlow } from "@/ui/useConfirmFlow";

import { DraftFeedback, NameField } from "./components";
import { diffField } from "./diff";
import { createId } from "./ids";
import { DraftConflict, Panel, PermissionConfirmDialog } from "./panel";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";
import { useRegisterDraft } from "./useRegisterDraft";

interface ValueDraft {
  readonly name: string;
}

/**
 * 单个取值的写操作：新建与改名各走独立的写接口与版本，
 * 成功后只把结果回写到条件目录，不重写条件本身。
 */
export function ValueEditor({
  open,
  dimension,
  value,
  onClose,
  returnFocusRef,
}: {
  readonly open: boolean;
  readonly dimension: PermissionDimension;
  readonly value: PermissionDimensionValue | null;
  readonly onClose: () => void;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const isNew = value === null;
  const baseline = {
    snapshot: { name: value?.name ?? "" } satisfies ValueDraft,
    version: scope.bundle.version,
  };

  const save = useDraftSave<
    ValueDraft,
    | PermissionsDimensionsValueCreateResponse
    | PermissionsDimensionsValueUpdateResponse
  >({
    baseline,
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    confirmation: (draft, base) => ({
      subject: `${dimension.name} · ${draft.name.trim() === "" ? t("permissions.addValue") : draft.name.trim()}`,
      diff: isNew
        ? [
            {
              kind: "added" as const,
              label: t("permissions.valueName"),
              after: draft.name.trim(),
            },
          ]
        : diffField(t("permissions.valueName"), base.name, draft.name.trim()),
      impact: t("permissions.valueWriteImpact"),
      fullBefore: base.name,
      fullAfter: draft.name.trim(),
    }),
    submit: (draft, expectedVersion) => {
      const name = draft.name.trim();
      if (value === null) {
        return scope.writes.createDimensionValue(dimension.id, {
          expectedVersion,
          id: createId(),
          name,
          retired: false,
        });
      }
      return scope.writes.updateDimensionValue(dimension.id, value.id, {
        expectedVersion,
        name,
        retired: value.retired,
      });
    },
    nextBaseline: (result) => ({ name: result.value.name }),
    reload: async () => {
      const next = await scope.reload();
      const latest = next.dimensions
        .find((item) => item.id === dimension.id)
        ?.values.find((item) => item.id === value?.id);
      return {
        snapshot: { name: latest?.name ?? value?.name ?? "" },
        version: next.version,
      };
    },
    onSaved: () => {
      scope.setNotice("permissions.valueWritten");
      onClose();
    },
  });
  useRegisterDraft(save.isDirty || save.conflict);

  const discardFlow = useConfirmFlow<void, void>({
    prepare: () => undefined,
    submit: () => {
      save.reset();
      onClose();
    },
  });
  const requestClose = () => {
    if (save.isDirty || save.conflict) {
      void discardFlow.request();
      return;
    }
    onClose();
  };

  return (
    <Panel
      open={open}
      variant="modal"
      title={isNew ? t("permissions.addValue") : t("permissions.editValue")}
      subtitle={dimension.name}
      onRequestClose={requestClose}
      {...(returnFocusRef === undefined ? {} : { returnFocusRef })}
      footer={
        <>
          <ActionButton
            label={t("permissions.cancel")}
            variant="secondary"
            onRun={requestClose}
          />
          <ActionButton
            label={t("permissions.save")}
            busy={save.saving}
            disabled={!save.canSave || scope.busy}
            {...(save.disabledReason === undefined
              ? {}
              : { disabledReason: save.disabledReason })}
            onRun={save.requestSave}
          />
        </>
      }
    >
      <NameField
        label={t("permissions.valueName")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ name });
        }}
      />
      {save.conflict && save.conflictConfirmation !== null ? (
        <DraftConflict
          confirmation={save.conflictConfirmation}
          choices={save.conflictChoices}
          selected={save.conflictDecisions}
          onSelect={save.chooseConflict}
          canApply={save.conflictCanApply}
          {...(save.conflictApplyReason === undefined
            ? {}
            : { applyReason: save.conflictApplyReason })}
          onLoadServer={save.loadServer}
          onApplyMine={save.applyMine}
          reloading={save.conflictReloading}
          error={save.conflictError}
        />
      ) : null}
      {save.conflict && save.conflictConfirmation === null ? (
        <div className={styles.conflict} role="alert">
          <h3 className={styles.conflictTitle}>{t("ui.conflict.title")}</h3>
          <InlineError error={save.conflictError} />
          <div className={styles.actions}>
            <ActionButton
              label={t("permissions.reload")}
              busy={save.conflictReloading}
              onRun={save.retryConflict}
            />
          </div>
        </div>
      ) : null}
      <DraftFeedback save={save} />
      <PermissionConfirmDialog
        flow={save.flow}
        title={t("permissions.confirm.title")}
        confirmLabel={t("permissions.confirm.action")}
        cancelLabel={t("permissions.cancel")}
      />
      <ConfirmDialog
        flow={discardFlow}
        title={t("permissions.discardTitle")}
        description={t("permissions.discardDescription")}
        confirmLabel={t("permissions.discardChanges")}
        cancelLabel={t("permissions.discard.keep")}
      />
    </Panel>
  );
}
