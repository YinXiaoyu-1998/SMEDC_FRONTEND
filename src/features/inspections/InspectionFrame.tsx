import type { ReactNode } from "react";
import { NavLink } from "react-router";

import { useSession } from "@/api/session";
import { PageFrame } from "@/app/PageFrame";
import {
  appPaths,
  canAccessInspections,
  canMaintainInspectionTemplates,
} from "@/app/paths";
import { useText } from "@/i18n/useText";

import styles from "./InspectionFrame.module.css";

export function InspectionFrame({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  const { t } = useText();
  const session = useSession().data;
  const showSheets = !!session && canAccessInspections(session);
  const showTemplates = !!session && canMaintainInspectionTemplates(session);

  const navigation =
    showSheets || showTemplates ? (
      <nav aria-label={t("nav.inspectionSections")} className={styles.tabs}>
        {showSheets ? (
          <NavLink end to={appPaths.inspections} className={() => styles.tab}>
            {t("nav.inspectionSheets")}
          </NavLink>
        ) : null}
        {showTemplates ? (
          <NavLink
            end
            to={appPaths.inspectionTemplates}
            className={() => styles.tab}
          >
            {t("nav.inspectionTemplates")}
          </NavLink>
        ) : null}
      </nav>
    ) : null;

  return (
    <PageFrame title={title} navigation={navigation}>
      {children}
    </PageFrame>
  );
}
