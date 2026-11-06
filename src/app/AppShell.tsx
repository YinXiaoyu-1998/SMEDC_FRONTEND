import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";

import type { Session } from "@/api/session";
import { useLogout } from "@/api/session";
import { LanguageSwitch } from "@/app/LanguageSwitch";
import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";
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
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        {t("app.skipToContent")}
      </a>

      <header className={styles.header}>
        <Link className={styles.brand} to={appPaths.home}>
          {t("app.brand")}
        </Link>

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
            {session.canManageSettings ? (
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
            {session.identity.organizationName} · {session.identity.displayName}
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
