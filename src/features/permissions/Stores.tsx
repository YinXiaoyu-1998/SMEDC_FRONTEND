import { useState } from "react";
import { Link } from "react-router";
import { appPaths } from "@/app/paths";

import type { PermissionsEnterprisesDeclareResponse } from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { DataTable } from "@/ui/DataTable";
import { PageSection } from "@/ui/PageSection";

import {
  DraftDialogs,
  DraftFeedback,
  NameField,
  SaveButton,
  SectionNote,
} from "./components";
import { useRegisterDraft } from "./useRegisterDraft";
import { permissionsErrorKey } from "./errorKeys";

import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";

interface EnterpriseDraft {
  readonly name: string;
}

const EMPTY_ENTERPRISE: EnterpriseDraft = { name: "" };

export function StoresSection() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const enterprises = scope.bundle.enterprises;

  return (
    <PageSection title={t("permissions.tabs.stores")}>
      <SectionNote>{t("permissions.enterpriseHelp")}</SectionNote>
      <SectionNote>{t("permissions.storeHelp")}</SectionNote>

      <h3 className={styles.subheading}>{t("permissions.enterpriseList")}</h3>
      <DataTable
        columns={[
          {
            id: "name",
            header: t("permissions.enterpriseName"),
            cell: (enterprise: { readonly enterpriseName: string }) =>
              enterprise.enterpriseName,
          },
          {
            id: "key",
            header: t("permissions.enterpriseKey"),
            cell: (enterprise: { readonly enterpriseKey: string }) =>
              enterprise.enterpriseKey,
          },
        ]}
        rows={enterprises}
        getRowId={(enterprise) => enterprise.enterpriseKey}
        label={t("permissions.enterpriseList")}
        emptyLabel={t("permissions.empty")}
      />

      <DeclareEnterpriseForm />
      <p>
        <Link to={appPaths.directory(scope.orgId)}>{t("nav.directory")}</Link>
      </p>
    </PageSection>
  );
}

function DeclareEnterpriseForm() {
  const { t } = useText();
  const scope = usePermissionsScope();
  const [preview, setPreview] = useState<{
    readonly enterpriseKey: string;
    readonly enterpriseName: string;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<unknown>(null);

  const save = useDraftSave<
    EnterpriseDraft,
    PermissionsEnterprisesDeclareResponse
  >({
    saved: EMPTY_ENTERPRISE,
    expectedVersion: scope.bundle.version,
    normalize: (draft) => ({ name: draft.name.trim() }),
    validate: (draft) =>
      draft.name.trim() === "" ? "permissions.required" : null,
    describe: (draft) =>
      `${draft.name}\n${t("permissions.enterpriseDeclared")}`,
    submit: (draft) => scope.writes.declareEnterprise(draft.name),
    draftFromResult: () => EMPTY_ENTERPRISE,
    reload: async () => {
      await scope.reload();
      return EMPTY_ENTERPRISE;
    },
    conflictFields: (draft) => [
      {
        key: "name",
        label: t("permissions.enterpriseName"),
        serverValue: t("permissions.notCreated"),
        draftValue: draft.name,
      },
    ],
  });
  useRegisterDraft(save.isDirty || save.conflict);

  const runPreview = () => {
    setPreviewing(true);
    setPreviewError(null);
    setPreview(null);
    void scope.writes
      .previewEnterprise(save.draft.name)
      .then((identity) => {
        setPreview(identity);
      })
      .catch((caught: unknown) => {
        setPreviewError(caught);
      })
      .finally(() => {
        setPreviewing(false);
      });
  };

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        save.requestSave();
      }}
    >
      <h3 className={styles.cardTitle}>{t("permissions.declareEnterprise")}</h3>
      <NameField
        label={t("permissions.enterpriseName")}
        required
        value={save.draft.name}
        disabled={save.saving}
        onChange={(name) => {
          save.setDraft({ name });
        }}
      />
      <SectionNote>{t("permissions.enterpriseDeclared")}</SectionNote>
      <div className={styles.actions}>
        <ActionButton
          label={t("permissions.previewEnterprise")}
          variant="secondary"
          busy={previewing}
          disabled={save.draft.name.trim() === ""}
          onRun={runPreview}
        />
        <SaveButton save={save} />
      </div>
      {preview === null ? null : (
        <p className={styles.status} role="status">
          {t("permissions.previewResult")}: {preview.enterpriseName} ·{" "}
          {preview.enterpriseKey}
        </p>
      )}
      {previewError === null ? null : (
        <p className={styles.error} role="alert">
          {t(permissionsErrorKey(previewError))}
        </p>
      )}
      <DraftFeedback save={save} />
      <DraftDialogs save={save} />
    </form>
  );
}
