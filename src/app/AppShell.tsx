import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router";

import type { Session } from "@/api/session";
import { useLogout } from "@/api/session";
import { AdminSectionNav } from "@/app/AdminSectionNav";
import { LanguageSwitch } from "@/app/LanguageSwitch";
import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";
import theme from "@/styles/AdminTheme.module.css";
import { AdminIcon } from "@/ui/AdminIcon";
import { Button } from "@/ui/Button";

import styles from "./AppShell.module.css";

interface AppShellProps {
  readonly session: Session;
  readonly children: ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  const { t } = useText();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  // 用 location.key 派生展开状态：导航后 key 变化，菜单自动收起，无需在 effect 里同步
  const [openKey, setOpenKey] = useState<string | null>(null);
  const menuOpen = openKey === location.key;
  const [logoutFailed, setLogoutFailed] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenKey(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const isAdminSection = location.pathname.startsWith("/admin/");
  const permissionsMatch = useMatch("/admin/:orgId/permissions");
  const directoryMatch = useMatch("/admin/:orgId/directory");
  const workflowsMatch = useMatch("/admin/:orgId/workflows/:enterpriseKey?");
  const consoleOrg = session.canManageSettings
    ? (permissionsMatch ?? directoryMatch ?? workflowsMatch)?.params.orgId
    : undefined;
  const consolePage =
    directoryMatch !== null
      ? "nav.directory"
      : workflowsMatch !== null
        ? "nav.workflows"
        : "nav.permissions";
  const managementPath = appPaths.permissions(session.identity.orgId);

  const handleLogout = () => {
    setLogoutFailed(false);
    logout.mutate(session.csrfToken, {
      onSuccess: () => {
        navigate(appPaths.login, { replace: true });
      },
      onError: () => {
        setLogoutFailed(true);
      },
    });
  };

  return (
    <div
      className={
        consoleOrg === undefined
          ? styles.shell
          : `${styles.shell} ${styles.consoleShell} ${theme.theme}`
      }
    >
      <a className={styles.skipLink} href="#main-content">
        {t("app.skipToContent")}
      </a>

      {consoleOrg === undefined ? null : (
        <aside className={styles.consoleSidebar}>
          <Link className={styles.consoleBrand} to={appPaths.home}>
            <span className={styles.consoleMark}>
              <AdminIcon name="grid" />
            </span>
            <span>{t("app.brand")}</span>
          </Link>
          <AdminSectionNav orgId={consoleOrg} />
          <div className={styles.consoleOrganization}>
            <span className={styles.avatar} aria-hidden="true">
              {Array.from(session.identity.organizationName)[0]}
            </span>
            <strong>{session.identity.organizationName}</strong>
          </div>
        </aside>
      )}

      <header className={styles.header}>
        {consoleOrg === undefined ? (
          <Link className={styles.brand} to={appPaths.home}>
            {t("app.brand")}
          </Link>
        ) : (
          <div className={styles.consoleBreadcrumb}>
            <span>{t("nav.management")}</span>
            <AdminIcon name="chevron" />
            <strong>{t(consolePage)}</strong>
          </div>
        )}

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setOpenKey(menuOpen ? null : location.key)}
        >
          {t(menuOpen ? "nav.closeMenu" : "nav.openMenu")}
        </button>

        <nav
          id="primary-navigation"
          className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}
          aria-label={t("nav.primary")}
        >
          <ul className={styles.navList}>
            {session.canManageSettings && consoleOrg === undefined ? (
              <li>
                <Link
                  to={managementPath}
                  className={
                    isAdminSection
                      ? `${styles.navLink} ${styles.navLinkActive}`
                      : styles.navLink
                  }
                  {...(isAdminSection
                    ? { "aria-current": "page" as const }
                    : {})}
                >
                  {t("nav.management")}
                </Link>
              </li>
            ) : null}
            <li>
              <NavLink
                to={appPaths.ledger}
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.navLinkActive}`
                    : styles.navLink
                }
              >
                {t("nav.ledger")}
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className={styles.meta}>
          <LanguageSwitch />
          <span className={styles.identity}>
            <span className="visually-hidden">{t("session.identity")}</span>
            {consoleOrg === undefined ? (
              <>
                {session.identity.organizationName} ·{" "}
                {session.identity.displayName}
              </>
            ) : (
              <>
                <span className={styles.avatar} aria-hidden="true">
                  {Array.from(session.identity.displayName)[0]}
                </span>
                {session.identity.displayName}
              </>
            )}
          </span>
          <Button
            variant="secondary"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {t("nav.logout")}
          </Button>
        </div>
      </header>

      {logoutFailed ? (
        <p className={styles.logoutError} role="alert">
          {t("nav.logoutFailed")}
        </p>
      ) : null}

      <main id="main-content" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}
