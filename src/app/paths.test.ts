import { describe, expect, it } from "vitest";

import { buildLoginPath, resolveHomePath, sanitizeNextPath } from "@/app/paths";
import { adminSession, employeeSession } from "@/test/fixtures";

describe("next 参数校验", () => {
  it("接受已知站内路径", () => {
    expect(sanitizeNextPath("/ledger")).toBe("/ledger");
    expect(sanitizeNextPath("/admin/org-1/permissions")).toBe(
      "/admin/org-1/permissions",
    );
    expect(sanitizeNextPath("/admin/org-1/workflows")).toBe(
      "/admin/org-1/workflows",
    );
    expect(sanitizeNextPath("/admin/org-1/workflows/ent-1")).toBe(
      "/admin/org-1/workflows/ent-1",
    );
    expect(sanitizeNextPath("/ledger?page=2")).toBe("/ledger?page=2");
    expect(sanitizeNextPath("/ledger/")).toBe("/ledger");
  });

  it("拒绝站外与未知路径", () => {
    expect(sanitizeNextPath(null)).toBeNull();
    expect(sanitizeNextPath("")).toBeNull();
    expect(sanitizeNextPath("https://example.com")).toBeNull();
    expect(sanitizeNextPath("//example.com/ledger")).toBeNull();
    expect(sanitizeNextPath("/\\example.com")).toBeNull();
    expect(sanitizeNextPath("/login")).toBeNull();
    expect(sanitizeNextPath("/nope")).toBeNull();
    expect(sanitizeNextPath("javascript:alert(1)")).toBeNull();
    expect(sanitizeNextPath("/admin/x/workflows/ent/extra")).toBeNull();
  });

  it("把当前路径编码进登录地址", () => {
    expect(buildLoginPath("/admin/org-1/workflows")).toBe(
      "/login?next=%2Fadmin%2Forg-1%2Fworkflows",
    );
  });
});

describe("角色首页", () => {
  it("管理员进入权限设置", () => {
    expect(resolveHomePath(adminSession)).toBe("/admin/org-1/permissions");
  });

  it("员工进入台账下载中心", () => {
    expect(resolveHomePath(employeeSession)).toBe("/ledger");
  });
});
