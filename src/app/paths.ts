import type { Session } from "@/api/session";

export const appPaths = {
  home: "/",
  login: "/login",
  ledger: "/ledger",
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

export function resolveHomePath(session: Session): string {
  return session.canManageSettings
    ? appPaths.permissions(session.identity.orgId)
    : appPaths.ledger;
}

export function resolveLoginTarget(
  session: Session,
  requestedNext: string | null,
): string {
  return sanitizeNextPath(requestedNext) ?? resolveHomePath(session);
}

export function buildLoginPath(currentPath: string): string {
  return `${appPaths.login}?next=${encodeURIComponent(currentPath)}`;
}
