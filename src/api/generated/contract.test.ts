import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import * as generated from "@/api/generated/contract";
import contract from "../../../contract/contract.json";
import { buildGeneratedSource } from "../../../scripts/lib/generate-contract.mjs";

const SCHEMA_PARTS = ["Body", "Params", "Query", "Response"] as const;
const GENERATED_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "contract.ts",
);

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// 与生成器相同的命名推导，用来断言"每个 route id 都有对应导出"
function routeIdentifier(routeId: string): string {
  const words = routeId
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  return words
    .map((word, index) => (index === 0 ? word : capitalize(word)))
    .join("");
}

const routes = contract.routes as ReadonlyArray<{
  id: string;
  method: string;
  path: string;
  auth: string;
  summary: string;
  errors: readonly string[];
}>;

describe("生成的契约代码", () => {
  it("文件顶部带有禁止手改的标记", () => {
    expect(readFileSync(GENERATED_FILE, "utf8")).toContain(
      "// 由 npm run contract:sync 生成，禁止手改",
    );
  });

  it("webApiRoutes 的条数与 contract.json 完全一致", () => {
    expect(Object.keys(generated.webApiRoutes)).toHaveLength(routes.length);
    expect(Object.keys(generated.webApiRoutes).sort()).toEqual(
      routes.map((route) => route.id).sort(),
    );
  });

  it("每条路由都导出了 body/params/query/response 的 schema", () => {
    for (const route of routes) {
      const base = routeIdentifier(route.id);
      for (const part of SCHEMA_PARTS) {
        expect(generated).toHaveProperty(`${base}${part}Schema`);
      }
    }
  });

  it("webApiRoutes 的元数据与契约一致", () => {
    const byId = new Map<string, generated.WebApiRouteMeta>(
      Object.entries(generated.webApiRoutes),
    );

    for (const route of routes) {
      expect(byId.get(route.id)).toEqual({
        method: route.method,
        path: route.path,
        auth: route.auth,
        errors: route.errors,
        summary: route.summary,
      });
    }
    expect(generated.webApiPrefix).toBe(contract.prefix);
  });

  it("生成是确定性的：连续两次结果字节一致，且与仓库文件一致", async () => {
    const first = await buildGeneratedSource(contract, GENERATED_FILE);
    const second = await buildGeneratedSource(contract, GENERATED_FILE);

    expect(second).toBe(first);
    expect(readFileSync(GENERATED_FILE, "utf8")).toBe(first);
  });

  it("生成的 zod schema 能按契约校验登录响应", () => {
    const parsed = generated.sessionLoginResponseSchema.safeParse({
      identity: {
        employeeId: "employee-1",
        displayName: "张三",
        email: "zhangsan@example.com",
        orgId: "org-1",
        organizationName: "示例企业",
        role: "admin",
        clearance: 2,
      },
      csrfToken: "token",
      canManageSettings: false,
    });

    expect(parsed.success).toBe(true);
    expect(
      generated.sessionReadResponseSchema.safeParse({
        identity: {},
        csrfToken: "",
      }).success,
    ).toBe(false);
  });
});
