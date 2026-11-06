import { useParams } from "react-router";

import { PageFrame } from "@/app/PageFrame";
import { useText } from "@/i18n/useText";

export function PermissionsPage() {
  const { t } = useText();
  const { orgId } = useParams<"orgId">();

  return <PageFrame title={t("pages.permissions.title")} orgId={orgId} />;
}
