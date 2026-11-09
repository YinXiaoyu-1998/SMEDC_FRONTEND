import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  collectDefinitions,
  createSchemaCompiler,
  orderDefinitions,
} from "../../../scripts/lib/json-schema-to-zod.mjs";

function identifier(name: string): string {
  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return words
    .map((word, index) => {
      const normalized = word.toLowerCase();
      return index === 0
        ? normalized
        : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");
}

// 把转换结果真正交给 zod 执行，断言行为而不是字符串拼接
function compileSchema(schema: unknown): z.ZodType {
  const definitions = collectDefinitions(schema);
  const names = new Map<string, string>();
  for (const name of definitions.keys()) {
    names.set(name, `${identifier(name)}Schema`);
  }

  const compiler = createSchemaCompiler({
    definitions,
    nameOfRef: (name) => {
      const generated = names.get(name);
      if (generated === undefined) throw new Error(`未定义的 $defs：${name}`);
      return generated;
    },
  });

  const declarations = orderDefinitions(definitions).map((name) => {
    const generated = names.get(name);
    const definition = definitions.get(name);
    return `const ${generated} = ${compiler.compile(definition, name)};`;
  });
  const expression = compiler.compile(schema, "root");
  const factory = new Function(
    "z",
    `${declarations.join("\n")}\nreturn ${expression};`,
  );

  return (factory as (input: typeof z) => z.ZodType)(z);
}

describe("JSON Schema 转 zod", () => {
  it("object：区分必填与可选，additionalProperties:false 拒绝多余字段", () => {
    const schema = compileSchema({
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        nickname: { type: "string" },
      },
      required: ["name"],
      additionalProperties: false,
    });

    expect(schema.safeParse({ name: "a" }).success).toBe(true);
    expect(schema.safeParse({ name: "a", nickname: "b" }).success).toBe(true);
    expect(schema.safeParse({ name: "a", extra: 1 }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ name: "" }).success).toBe(false);
  });

  it("array：校验元素类型与长度", () => {
    const schema = compileSchema({
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 2,
    });

    expect(schema.safeParse(["a"]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse(["a", "b", "c"]).success).toBe(false);
    expect(schema.safeParse([1]).success).toBe(false);
  });

  it("string enum", () => {
    const schema = compileSchema({
      type: "string",
      enum: ["admin", "employee"],
    });

    expect(schema.safeParse("admin").success).toBe(true);
    expect(schema.safeParse("owner").success).toBe(false);
  });

  it("number / integer 的范围", () => {
    const integer = compileSchema({ type: "integer", minimum: 0, maximum: 3 });

    expect(integer.safeParse(2).success).toBe(true);
    expect(integer.safeParse(4).success).toBe(false);
    expect(integer.safeParse(1.5).success).toBe(false);
    expect(compileSchema({ type: "number" }).safeParse(1.5).success).toBe(true);
  });

  it("boolean", () => {
    const schema = compileSchema({ type: "boolean" });

    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse("true").success).toBe(false);
  });

  it("nullable：type 数组与 OpenAPI 的 nullable 都支持", () => {
    const union = compileSchema({ type: ["string", "null"] });
    expect(union.safeParse("a").success).toBe(true);
    expect(union.safeParse(null).success).toBe(true);
    expect(union.safeParse(1).success).toBe(false);

    const flag = compileSchema({ type: "string", nullable: true });
    expect(flag.safeParse(null).success).toBe(true);
  });

  it("nested $defs：按依赖顺序声明并正确展开引用", () => {
    const schema = compileSchema({
      type: "object",
      $defs: {
        contact: {
          type: "object",
          properties: { email: { type: "string", minLength: 1 } },
          required: ["email"],
          additionalProperties: false,
        },
        profile: {
          type: "object",
          properties: { contact: { $ref: "#/$defs/contact" } },
          required: ["contact"],
          additionalProperties: false,
        },
      },
      properties: { profile: { $ref: "#/$defs/profile" } },
      required: ["profile"],
      additionalProperties: false,
    });

    expect(
      schema.safeParse({ profile: { contact: { email: "a@b.c" } } }).success,
    ).toBe(true);
    expect(schema.safeParse({ profile: { contact: {} } }).success).toBe(false);
    expect(schema.safeParse({ profile: {} }).success).toBe(false);
  });

  it("anyOf 与 const", () => {
    const union = compileSchema({
      anyOf: [{ type: "string" }, { type: "number" }],
    });
    expect(union.safeParse("a").success).toBe(true);
    expect(union.safeParse(1).success).toBe(true);
    expect(union.safeParse(true).success).toBe(false);

    const constant = compileSchema({ const: "signed-out" });
    expect(constant.safeParse("signed-out").success).toBe(true);
    expect(constant.safeParse("other").success).toBe(false);
  });

  it("递归 $defs 会给出可读错误而不是生成坏代码", () => {
    const definitions = new Map<string, unknown>([
      [
        "node",
        { type: "object", properties: { next: { $ref: "#/$defs/node" } } },
      ],
    ]);

    expect(() => orderDefinitions(definitions)).toThrow(/递归/);
  });
});
