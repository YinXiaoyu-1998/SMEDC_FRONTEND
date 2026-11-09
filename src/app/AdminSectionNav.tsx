import { NavLink } from "react-router";

import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";

import styles from "./AdminSectionNav.module.css";

interface AdminSectionNavProps {
  readonly orgId: string;
}

export function AdminSectionNav({ orgId }: AdminSectionNavProps) {
  const { t } = useText();

  const linkClassName = ({ isActive }: { readonly isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <nav className={styles.nav} aria-label={t("nav.management")}>
      <NavLink to={appPaths.permissions(orgId)} className={linkClassName}>
        {t("nav.permissions")}
      </NavLink>
      <NavLink to={appPaths.workflows(orgId)} className={linkClassName}>
        {t("nav.workflows")}
      </NavLink>
    </nav>
  );
}
