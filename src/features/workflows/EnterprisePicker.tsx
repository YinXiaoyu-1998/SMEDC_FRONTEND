import { Link, Navigate, useNavigate } from "react-router";

import type { PermissionsEnterprisesListResponse } from "@/api/generated/contract";
import { appPaths } from "@/app/paths";
import { singleEnterpriseKey } from "@/features/singleEnterpriseKey";
import { PageSection } from "@/ui/PageSection";
import { SelectField } from "@/features/workflows/Fields";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

type Enterprise = PermissionsEnterprisesListResponse["enterprises"][number];

export function EnterprisePicker({
  orgId,
  enterprises,
}: {
  readonly orgId: string;
  readonly enterprises: readonly Enterprise[];
}) {
  const { w } = useWorkflowText();
  const navigate = useNavigate();
  const onlyEnterprise = singleEnterpriseKey(enterprises);
  if (onlyEnterprise) {
    return <Navigate to={appPaths.workflow(orgId, onlyEnterprise)} replace />;
  }

  if (enterprises.length === 0) {
    return (
      <PageSection title={w("enterprise")}>
        <p className={styles.hint}>{w("noEnterprises")}</p>
        <Link to={appPaths.permissions(orgId)}>{w("permissionsLink")}</Link>
      </PageSection>
    );
  }

  return (
    <section aria-label={w("enterprise")} className={styles.pickerField}>
      <SelectField
        label={w("enterprise")}
        value=""
        options={enterprises.map(({ enterpriseKey, enterpriseName }) => ({
          value: enterpriseKey,
          label: enterpriseName,
        }))}
        placeholder={w("choose")}
        onChange={(enterpriseKey) => {
          if (enterpriseKey)
            void navigate(appPaths.workflow(orgId, enterpriseKey));
        }}
      />
    </section>
  );
}
