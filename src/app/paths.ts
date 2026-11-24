import type { Session } from "@/api/session";

export const appPaths = {
  home: "/",
  login: "/login",
  ledger: "/ledger",
  inspections: "/inspections",
  inspectionTemplates: "/inspections/templates",
  directory: (orgId: string) => `/admin/${encodeURIComponent(orgId)}/directory`,
  permissions: (orgId: string) =>
    `/admin/${encodeURIComponent(orgId)}/permissions`,
  workflows: (orgId: string) => `/admin/${encodeURIComponent(orgId)}/workflows`,
  workflow: (orgId: string, enterpriseKey: string) =>
    `/admin/${encodeURIComponent(orgId)}/workflows/${encodeURIComponent(enterpriseKey)}`,
} as const;

const internalOrigin = "http://smedc.local";

const knownPathPatterns: readonly RegExp[] = [
  /^\/$/,
  /^\/ledger$/,
  /^\/inspections$/,
  /^\/inspections\/templates$/,
  /^\/admin\/[^/]+\/permissions$/,
  /^\/admin\/[^/]+\/directory$/,
  /^\/admin\/[^/]+\/workflows$/,
  /^\/admin\/[^/]+\/workflows\/[^/]+$/,
];

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * next 只接受可枚举的站内路径，否则登录后可能被带到站外（开放重定向）。
 */
export function sanitizeNextPath(rawNext: string | null): string | null {
  if (rawNext === null || rawNext === "") return null;
  if (
    !rawNext.startsWith("/") ||
    rawNext.startsWith("//") ||
    rawNext.includes("\\")
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rawNext, internalOrigin);
  } catch {
    return null;
  }
  if (url.origin !== internalOrigin) return null;

  const pathname = normalizePath(url.pathname);
  if (!knownPathPatterns.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  return `${pathname}${url.search}`;
}

/** 看卷与填写共用同一入口；具体按钮差异由巡检页按 canFillInspections 处理。 */
export function canAccessInspections(session: Session): boolean {
  return (
    session.canReadInspections === true || session.canFillInspections === true
  );
}

export function canMaintainInspectionTemplates(session: Session): boolean {
  return session.canManageInspectionTemplates === true;
}

export function resolveInspectionPath(session: Session): string | null {
  if (canAccessInspections(session)) {
    return appPaths.inspections;
  }
  return canMaintainInspectionTemplates(session)
    ? appPaths.inspectionTemplates
    : null;
}

export function resolveHomePath(session: Session): string {
  if (session.canManageSettings) {
    return appPaths.permissions(session.identity.orgId);
  }
  return resolveInspectionPath(session) ?? appPaths.ledger;
}

export function resolveLoginTarget(
  session: Session,
  requestedNext: string | null,
): string {
  const next = sanitizeNextPath(requestedNext);
  if (
    next?.startsWith("/admin/") &&
    (!session.canManageSettings ||
      !next.startsWith(`/admin/${encodeURIComponent(session.identity.orgId)}/`))
  ) {
    return resolveHomePath(session);
  }
  return next ?? resolveHomePath(session);
}

export function buildLoginPath(currentPath: string): string {
  return `${appPaths.login}?next=${encodeURIComponent(currentPath)}`;
}
