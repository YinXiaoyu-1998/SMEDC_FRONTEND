import { NavLink } from "react-router";

import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";

import { AdminIcon } from "@/ui/AdminIcon";

import styles from "./AdminSectionNav.module.css";

interface AdminSectionNavProps {
  readonly orgId: string;
  readonly consoleLayout?: boolean;
}

export function AdminSectionNav({
  orgId,
  consoleLayout = false,
}: AdminSectionNavProps) {
  const { t } = useText();

  const linkClassName = ({ isActive }: { readonly isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <nav
      className={
        consoleLayout ? `${styles.nav} ${styles.consoleNav}` : styles.nav
      }
      aria-label={t("nav.management")}
    >
      <NavLink to={appPaths.permissions(orgId)} className={linkClassName}>
        {consoleLayout ? <AdminIcon name="shield" /> : null}
        {t("nav.permissions")}
      </NavLink>
      <NavLink to={appPaths.directory(orgId)} className={linkClassName}>
        {consoleLayout ? <AdminIcon name="building" /> : null}
        {t("nav.directory")}
      </NavLink>
      <NavLink to={appPaths.workflows(orgId)} className={linkClassName}>
        {consoleLayout ? <AdminIcon name="tasks" /> : null}
        {t("nav.workflows")}
      </NavLink>
    </nav>
  );
}
