import { createContext, useContext } from "react";

import type { PermissionsBundle } from "@/api/permissions";
import type { PermissionsCutoverReadResponse } from "@/api/generated/contract";

import type { SectionKey } from "./constants";
import type { PermissionsWrites } from "./writes";

export interface PermissionsScopeValue {
  readonly orgId: string;
  readonly bundle: PermissionsBundle;
  readonly busy: boolean;
  readonly hasDrafts: boolean;
  readonly writes: PermissionsWrites;
  readonly reload: () => Promise<PermissionsBundle>;
  readonly readCutover: () => Promise<PermissionsCutoverReadResponse>;
  readonly registerDraft: (id: string, dirty: boolean) => void;
  readonly setNotice: (key: string | null) => void;
  readonly navigate: (section: SectionKey) => void;
}

export const PermissionsScopeContext =
  createContext<PermissionsScopeValue | null>(null);

export function usePermissionsScope(): PermissionsScopeValue {
  const value = useContext(PermissionsScopeContext);
  if (value === null) {
    throw new Error("权限页组件必须在 PermissionsScopeContext 内使用");
  }
  return value;
}
