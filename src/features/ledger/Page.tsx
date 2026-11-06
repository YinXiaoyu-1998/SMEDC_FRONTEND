import { PageFrame } from "@/app/PageFrame";
import { useText } from "@/i18n/useText";

export function LedgerPage() {
  const { t } = useText();

  return <PageFrame title={t("pages.ledger.title")} />;
}
