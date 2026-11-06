import { useParams } from "react-router";

import { PageFrame } from "@/app/PageFrame";
import { useText } from "@/i18n/useText";

export function WorkflowsPage() {
  const { t } = useText();
  const { orgId } = useParams<"orgId">();

  return <PageFrame title={t("pages.workflows.title")} orgId={orgId} />;
}
