import { PageFrame } from "@/app/PageFrame";
import { useText } from "@/i18n/useText";

// 包 14 会在这里接入巡检模板维护；入口独立于管理设置的权限页
export function InspectionTemplatesPage() {
  const { t } = useText();

  return <PageFrame title={t("pages.inspectionTemplates.title")} />;
}
