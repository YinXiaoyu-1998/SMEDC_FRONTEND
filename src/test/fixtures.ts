import type { Session } from "@/api/session";

const baseIdentity = {
  employeeId: "employee-1",
  displayName: "张三",
  email: "zhangsan@example.com",
  orgId: "org-1",
  organizationName: "示例企业",
  role: "admin" as const,
  clearance: 2,
};

export const adminSession: Session = {
  identity: baseIdentity,
  csrfToken: "csrf-token-1",
  canManageSettings: true,
};

export const employeeSession: Session = {
  identity: {
    ...baseIdentity,
    employeeId: "employee-2",
    displayName: "李四",
    email: "lisi@example.com",
    role: "employee",
    clearance: 1,
  },
  csrfToken: "csrf-token-2",
  canManageSettings: false,
};
