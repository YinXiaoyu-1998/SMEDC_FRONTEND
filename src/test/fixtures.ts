import type { Session } from "@/api/session";

const baseIdentity = {
  userAccountId: "employee-1",
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
    userAccountId: "employee-2",
    displayName: "李四",
    email: "lisi@example.com",
    role: "employee",
    clearance: 1,
  },
  csrfToken: "csrf-token-2",
  canManageSettings: false,
};

// 巡检能力是服务端按账号下发的可选字段：旧会话没有这些字段时保持原有导航和首页
export const inspectionViewerSession: Session = {
  ...employeeSession,
  canReadInspections: true,
  canFillInspections: false,
};

export const inspectingEmployeeSession: Session = {
  ...employeeSession,
  canReadInspections: true,
  canFillInspections: true,
};

export const templateMaintainerSession: Session = {
  ...employeeSession,
  canManageInspectionTemplates: true,
};

export const inspectionLeadSession: Session = {
  ...inspectingEmployeeSession,
  canManageInspectionTemplates: true,
};
