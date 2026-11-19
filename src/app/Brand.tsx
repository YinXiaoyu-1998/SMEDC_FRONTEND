import logo from "@/assets/smedc-seahorse.png";
import { useText } from "@/i18n/useText";
import styles from "./Brand.module.css";

export function Brand() {
  const { t } = useText();
  return (
    <span className={styles.brand}>
      <img src={logo} width={28} height={40} alt="" />
      {t("app.brand")}
    </span>
  );
}
