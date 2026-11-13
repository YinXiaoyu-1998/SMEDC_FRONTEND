import { useState } from "react";
import { Link, useNavigate } from "react-router";

import type { PermissionsEnterprisesListResponse } from "@/api/generated/contract";
import { appPaths } from "@/app/paths";
import { ActionButton } from "@/ui/ActionButton";
import { PageSection } from "@/ui/PageSection";
import { ErrorNotice } from "@/features/workflows/ErrorNotice";
import { SelectField } from "@/features/workflows/Fields";
import {
  listWorkflowPage,
  type WorkflowClient,
} from "@/features/workflows/api";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

type Enterprise = PermissionsEnterprisesListResponse["enterprises"][number];

export interface EnterprisePickerProps {
  readonly client: WorkflowClient;
  readonly enterprises: readonly Enterprise[];
}

export function EnterprisePicker({
  client,
  enterprises,
}: EnterprisePickerProps) {
  const { w } = useWorkflowText();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleSubmit = async () => {
    if (selected === "") {
      setFieldError(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // 只做一次最小读取确认入口可用，真正的深链由站内路由承接
      await listWorkflowPage(client, { enterpriseKey: selected, limit: 1 });
      navigate(appPaths.workflow(client.orgId, selected));
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageSection title={w("title")} description={w("enterpriseHint")}>
      <div className={styles.pickerField}>
        <SelectField
          label={w("enterprise")}
          value={selected}
          options={enterprises.map((enterprise) => ({
            value: enterprise.enterpriseKey,
            label: enterprise.enterpriseName,
          }))}
          placeholder={w("choose")}
          disabled={busy}
          error={fieldError ? w("selectEnterpriseRequired") : undefined}
          onChange={(value) => {
            setSelected(value);
            if (value !== "") setFieldError(false);
          }}
        />
      </div>

      {enterprises.length === 0 ? (
        <div className={styles.stack}>
          <p className={styles.hint}>{w("noEnterprises")}</p>
          <p className={styles.hint}>{w("createGuide")}</p>
          <Link to={appPaths.permissions(client.orgId)}>
            {w("permissionsLink")}
          </Link>
        </div>
      ) : null}

      <ErrorNotice error={error} />

      <div className={styles.actionsRow}>
        <ActionButton
          label={w("title")}
          busy={busy}
          disabled={enterprises.length === 0}
          onRun={() => void handleSubmit()}
        />
      </div>
    </PageSection>
  );
}
