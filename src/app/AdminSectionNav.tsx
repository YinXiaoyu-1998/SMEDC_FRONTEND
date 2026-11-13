import { NavLink } from "react-router";

import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";

import { AdminIcon } from "@/ui/AdminIcon";

import styles from "./AdminSectionNav.module.css";

export function AdminSectionNav({ orgId }: { readonly orgId: string }) {
  const { t } = useText();

  const linkClassName = ({ isActive }: { readonly isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <nav className={styles.nav} aria-label={t("nav.management")}>
      <NavLink to={appPaths.permissions(orgId)} className={linkClassName}>
        <AdminIcon name="shield" />
        {t("nav.permissions")}
      </NavLink>
      <NavLink to={appPaths.directory(orgId)} className={linkClassName}>
        <AdminIcon name="building" />
        {t("nav.directory")}
      </NavLink>
      <NavLink to={appPaths.workflows(orgId)} className={linkClassName}>
        <AdminIcon name="tasks" />
        {t("nav.workflows")}
      </NavLink>
    </nav>
  );
}
