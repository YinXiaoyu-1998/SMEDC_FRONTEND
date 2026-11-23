import { PageFrame } from "@/app/PageFrame";
import { useText } from "@/i18n/useText";

// 包 13 会在这里接入巡检看卷与填写；包 12 只提供可深链的最小路由入口
export function InspectionsPage() {
  const { t } = useText();

  return <PageFrame title={t("pages.inspections.title")} />;
}
