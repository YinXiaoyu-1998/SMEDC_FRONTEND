import { useState } from "react";

import { WebApiError } from "@/api/client";
import type {
  PermissionStore,
  PermissionsEnterprisesDeclareResponse,
  PermissionsStoresUpsertResponse,
} from "@/api/permissions";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { DataTable } from "@/ui/DataTable";
import { Field } from "@/ui/Field";
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
import { permissionsErrorKey } from "./errorKeys";
import { changeSummary, enterpriseName, itemLabel } from "./labels";
import styles from "./Permissions.module.css";
import { usePermissionsScope } from "./scope";
import { useDraftSave } from "./useDraftSave";

interface EnterpriseDraft {
  readonly name: string;
}

const EMPTY_ENTERPRISE: EnterpriseDraft = { name: "" };

interface StoreDraft {
  readonly enterprise: string;
  readonly newEnterpriseName: string;
  readonly name: string;
  readonly retired: boolean;
}

const BLANK_STORE: StoreDraft = {
  enterprise: "",
  newEnterpriseName: "",
  name: "",
  retired: false,
};

const NEW_ENTERPRISE_STORE: StoreDraft = {
  enterprise: "new",
  newEnterpriseName: "",
  name: "",
  retired: false,
};

function duplicateStoreError(): WebApiError {
  return new WebApiError({
    status: 0,
    code: "INVALID_PERMISSION_CONFIGURATION",
    message: "门店已存在",
  });
}

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
      <StoreCreateForm defaultEnterprise={enterprises.length === 0} />

      <h3 className={styles.subheading}>{t("permissions.tabs.stores")}</h3>
      {scope.bundle.stores.length === 0 ? (
        <p className={styles.hint}>{t("permissions.empty")}</p>
      ) : (
        <div className={styles.stack}>
          {scope.bundle.stores.map((store) => (
            <StoreEditForm
              key={`${store.enterpriseKey}/${store.name}`}
              store={store}
            />
          ))}
        </div>
      )}
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

function StoreCreateForm({
  defaultEnterprise,
}: {
  defaultEnterprise: boolean;
}) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const saved = defaultEnterprise ? NEW_ENTERPRISE_STORE : BLANK_STORE;
  const enterprises = scope.bundle.enterprises;

  const save = useDraftSave<StoreDraft, PermissionsStoresUpsertResponse>({
    saved,
    expectedVersion: scope.bundle.version,
    normalize: (draft) => ({
      enterprise: draft.enterprise,
      newEnterpriseName: draft.newEnterpriseName.trim(),
      name: draft.name.trim(),
    }),
    validate: (draft) => {
      if (draft.enterprise === "" || draft.name.trim() === "") {
        return "permissions.required";
      }
      if (draft.enterprise === "new" && draft.newEnterpriseName.trim() === "") {
        return "permissions.required";
      }
      if (
        draft.enterprise !== "new" &&
        !enterprises.some((item) => item.enterpriseKey === draft.enterprise)
      ) {
        return "permissions.enterpriseNameRequired";
      }
      if (
        draft.enterprise !== "new" &&
        scope.bundle.stores.some(
          (store) =>
            store.enterpriseKey === draft.enterprise &&
            store.name === draft.name.trim(),
        )
      ) {
        return "permissions.error.invalid";
      }
      return null;
    },
    describe: (draft) => {
      const business =
        draft.enterprise === "new"
          ? draft.newEnterpriseName
          : enterpriseName(t, scope.bundle, draft.enterprise);
      return `${business} · ${draft.name}\n${t("permissions.automaticEnterpriseHelp")}`;
    },
    submit: async (draft, expectedVersion) => {
      const name = draft.name.trim();
      if (draft.enterprise === "new") {
        const identity = await scope.writes.previewEnterprise(
          draft.newEnterpriseName,
        );
        if (
          scope.bundle.stores.some(
            (store) =>
              store.enterpriseKey === identity.enterpriseKey &&
              store.name === name,
          )
        ) {
          throw duplicateStoreError();
        }
        return scope.writes.upsertStore({
          expectedVersion,
          enterpriseKey: identity.enterpriseKey,
          enterpriseName: identity.enterpriseName,
          name,
          retired: false,
        });
      }
      return scope.writes.upsertStore({
        expectedVersion,
        enterpriseKey: draft.enterprise,
        name,
        retired: false,
      });
    },
    draftFromResult: () => saved,
    reload: async () => {
      await scope.reload();
      return saved;
    },
    conflictFields: (draft) => [
      {
        key: "enterprise",
        label: t("permissions.enterprise"),
        serverValue: t("permissions.notCreated"),
        draftValue:
          draft.enterprise === "new"
            ? draft.newEnterpriseName
            : enterpriseName(t, scope.bundle, draft.enterprise),
      },
      {
        key: "name",
        label: t("permissions.storeName"),
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
      <h3 className={styles.cardTitle}>{t("permissions.addStore")}</h3>
      <Field label={t("permissions.enterprise")}>
        <select
          value={save.draft.enterprise}
          disabled={save.saving}
          onChange={(event) => {
            save.setDraft({
              ...save.draft,
              enterprise: event.target.value,
            });
          }}
        >
          <option value="">{t("permissions.choose")}</option>
          {enterprises.map((enterprise) => (
            <option
              key={enterprise.enterpriseKey}
              value={enterprise.enterpriseKey}
            >
              {enterprise.enterpriseName}
            </option>
          ))}
          <option value="new">{t("permissions.newEnterprise")}</option>
        </select>
      </Field>
      {save.draft.enterprise === "new" ? (
        <NameField
          label={t("permissions.enterpriseName")}
          required
          value={save.draft.newEnterpriseName}
          disabled={save.saving}
          onChange={(newEnterpriseName) => {
            save.setDraft({ ...save.draft, newEnterpriseName });
          }}
        />
      ) : null}
      <SectionNote>{t("permissions.automaticEnterpriseHelp")}</SectionNote>
      <NameField
        label={t("permissions.storeName")}
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

function StoreEditForm({ store }: { store: PermissionStore }) {
  const { t } = useText();
  const scope = usePermissionsScope();
  const saved = { name: store.name, retired: store.retired };

  const save = useDraftSave<
    { readonly name: string; readonly retired: boolean },
    PermissionsStoresUpsertResponse
  >({
    saved,
    expectedVersion: scope.bundle.version,
    normalize: (draft) => ({ name: draft.name.trim(), retired: draft.retired }),
    validate: (draft) => {
      if (draft.name.trim() === "") return "permissions.required";
      const duplicate = scope.bundle.stores.some(
        (item) =>
          item.enterpriseKey === store.enterpriseKey &&
          item.name === draft.name.trim() &&
          item.name !== store.name,
      );
      return duplicate ? "permissions.error.invalid" : null;
    },
    describe: (draft) =>
      changeSummary(
        t,
        store.name,
        `${saved.name} · ${t(saved.retired ? "permissions.retired" : "permissions.active")}`,
        `${draft.name} · ${t(draft.retired ? "permissions.retired" : "permissions.active")}`,
      ),
    submit: (draft, expectedVersion) =>
      scope.writes.upsertStore({
        expectedVersion,
        enterpriseKey: store.enterpriseKey,
        name: draft.name.trim(),
        retired: draft.retired,
      }),
    draftFromResult: (result) => ({
      name: result.value.name,
      retired: result.value.retired,
    }),
    reload: async () => {
      const next = await scope.reload();
      const latest = next.stores.find(
        (item) =>
          item.enterpriseKey === store.enterpriseKey &&
          item.name === store.name,
      );
      return latest === undefined
        ? saved
        : { name: latest.name, retired: latest.retired };
    },
    conflictFields: (draft, current) => [
      {
        key: "name",
        label: t("permissions.storeName"),
        serverValue: current.name,
        draftValue: draft.name,
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
      <h3 className={styles.cardTitle}>
        {itemLabel(t, store.name, store.retired)}
      </h3>
      <p className={styles.hint}>
        {enterpriseName(t, scope.bundle, store.enterpriseKey)}
      </p>
      <NameField
        label={t("permissions.storeName")}
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
