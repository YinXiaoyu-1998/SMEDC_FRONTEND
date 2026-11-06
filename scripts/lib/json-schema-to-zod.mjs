// JSON Schema（2020-12 子集）到 zod 4 表达式源码的转换器。
//
// 为什么不用 json-schema-to-zod：生成物要求稳定、可读、可逐字比较，而库的输出
// 排版与 zod3 语法由库版本决定；这里只实现契约实际需要的关键字，遇到无法精确
// 表达的结构直接报错，避免悄悄生成错误的运行时校验。

const DEFINITION_KEYWORDS = ["$defs", "definitions"];

const UNSUPPORTED_KEYWORDS = [
  "not",
  "if",
  "then",
  "else",
  "patternProperties",
  "dependentSchemas",
  "dependentRequired",
  "unevaluatedProperties",
  "contains",
];

export class SchemaCompileError extends Error {
  constructor(message) {
    super(message);
    this.name = "SchemaCompileError";
  }
}

// 收集整份 schema 里的 $defs（含嵌套定义），并拒绝同名不同义的定义
export function collectDefinitions(rootSchema) {
  const definitions = new Map();

  const visit = (schema) => {
    if (schema === null || typeof schema !== "object") return;
    if (Array.isArray(schema)) {
      for (const item of schema) visit(item);
      return;
    }

    for (const keyword of DEFINITION_KEYWORDS) {
      const group = schema[keyword];
      if (group === null || typeof group !== "object" || Array.isArray(group))
        continue;
      for (const [name, definition] of Object.entries(group)) {
        const existing = definitions.get(name);
        if (existing !== undefined && existing !== definition) {
          throw new SchemaCompileError(
            `$defs 中存在重复名称「${name}」，无法生成唯一的 schema 标识`,
          );
        }
        definitions.set(name, definition);
        visit(definition);
      }
    }

    for (const [keyword, value] of Object.entries(schema)) {
      if (DEFINITION_KEYWORDS.includes(keyword)) continue;
      if (keyword === "enum" || keyword === "const") continue;
      if (keyword === "default" || keyword === "examples") continue;
      visit(value);
    }
  };

  visit(rootSchema);
  return definitions;
}

// 按依赖顺序排列定义：被引用的定义先声明，保证生成的 const 不会落入 TDZ
export function orderDefinitions(definitions) {
  const ordered = [];
  const state = new Map();

  const visit = (name) => {
    const current = state.get(name);
    if (current === "done") return;
    if (current === "visiting") {
      throw new SchemaCompileError(
        `不支持递归引用的 $defs「${name}」：生成物需要展开为静态 const 声明`,
      );
    }

    state.set(name, "visiting");
    for (const dependency of referencedDefinitions(definitions.get(name))) {
      if (!definitions.has(dependency)) {
        throw new SchemaCompileError(
          `$ref 指向未定义的 $defs「${dependency}」`,
        );
      }
      visit(dependency);
    }
    state.set(name, "done");
    ordered.push(name);
  };

  for (const name of definitions.keys()) visit(name);
  return ordered;
}

export function createSchemaCompiler({
  definitions = new Map(),
  nameOfRef,
} = {}) {
  if (typeof nameOfRef !== "function") {
    throw new SchemaCompileError("createSchemaCompiler 需要 nameOfRef 回调");
  }

  const compileReference = (ref, path) => {
    const name = definitionNameFromRef(ref);
    if (name === undefined) {
      throw new SchemaCompileError(
        `${path}: 只支持指向 #/$defs 或 #/definitions 的 $ref，收到「${ref}」`,
      );
    }
    if (!definitions.has(name)) {
      throw new SchemaCompileError(
        `${path}: $ref 指向未定义的 $defs「${name}」`,
      );
    }
    return nameOfRef(name);
  };

  const compile = (schema, path = "schema") => {
    if (schema === true) return "z.unknown()";
    if (schema === false) return "z.never()";
    if (
      schema === null ||
      typeof schema !== "object" ||
      Array.isArray(schema)
    ) {
      throw new SchemaCompileError(`${path}: 不是合法的 JSON Schema`);
    }

    if (typeof schema.$ref === "string")
      return compileReference(schema.$ref, path);
    if (schema.const !== undefined) return literalExpression(schema.const);
    if (Array.isArray(schema.enum)) return enumExpression(schema.enum);

    if (Array.isArray(schema.anyOf)) {
      return unionExpression(
        schema.anyOf.map((variant, index) =>
          compile(variant, `${path}.anyOf[${index}]`),
        ),
      );
    }
    if (Array.isArray(schema.oneOf)) {
      return unionExpression(
        schema.oneOf.map((variant, index) =>
          compile(variant, `${path}.oneOf[${index}]`),
        ),
      );
    }
    if (Array.isArray(schema.allOf)) {
      const parts = schema.allOf.map((part, index) =>
        compile(part, `${path}.allOf[${index}]`),
      );
      if (parts.length === 0)
        throw new SchemaCompileError(`${path}.allOf 不能为空`);
      return parts.reduce((accumulator, part) => `${accumulator}.and(${part})`);
    }
    if (Array.isArray(schema.type)) {
      const { type: typeList, ...rest } = schema;
      const variants = typeList.map((type, index) =>
        compile({ ...rest, type }, `${path}.type[${index}]`),
      );
      return unionExpression(variants);
    }
    if (schema.nullable === true) {
      const { nullable: _nullable, ...rest } = schema;
      return `${compile(rest, path)}.nullable()`;
    }

    assertSupportedKeywords(schema, path);
    return compileByType(schema, path, compile);
  };

  return { compile };
}

function compileByType(schema, path, compile) {
  const type = schema.type;

  if (type === "object") return compileObject(schema, path, compile);
  if (type === "array") return compileArray(schema, path, compile);
  if (type === "string") return compileString(schema);
  if (type === "integer") return compileNumber(schema, true);
  if (type === "number") return compileNumber(schema, false);
  if (type === "boolean") return "z.boolean()";
  if (type === "null") return "z.null()";
  if (type === undefined) {
    if (
      schema.properties !== undefined ||
      schema.additionalProperties !== undefined
    ) {
      return compileObject(schema, path, compile);
    }
    if (schema.items !== undefined || schema.prefixItems !== undefined) {
      return compileArray(schema, path, compile);
    }
    return "z.unknown()";
  }

  throw new SchemaCompileError(`${path}: 不支持的 type「${String(type)}」`);
}

function compileObject(schema, path, compile) {
  const properties =
    schema.properties !== null &&
    typeof schema.properties === "object" &&
    !Array.isArray(schema.properties)
      ? schema.properties
      : {};
  const required = new Set(
    Array.isArray(schema.required) ? schema.required : [],
  );

  for (const name of required) {
    if (!(name in properties)) {
      throw new SchemaCompileError(
        `${path}: required 中的「${name}」没有对应 properties 定义`,
      );
    }
  }

  const fields = Object.entries(properties).map(([name, propertySchema]) => {
    const expression = compile(propertySchema, `${path}.properties.${name}`);
    const field = required.has(name) ? expression : `${expression}.optional()`;
    return `${JSON.stringify(name)}: ${field}`;
  });

  const body = fields.length === 0 ? "{}" : `{\n${fields.join(",\n")}\n}`;
  const additional = schema.additionalProperties;

  if (additional === false) return `z.strictObject(${body})`;
  if (additional === true) return `z.looseObject(${body})`;
  if (
    additional !== undefined &&
    additional !== null &&
    typeof additional === "object"
  ) {
    return `z.object(${body}).catchall(${compile(additional, `${path}.additionalProperties`)})`;
  }
  return `z.object(${body})`;
}

function compileArray(schema, path, compile) {
  if (schema.prefixItems !== undefined) {
    throw new SchemaCompileError(`${path}: 不支持元组形式的 prefixItems`);
  }

  const items = schema.items;
  let expression;
  if (items === undefined || items === true) {
    expression = "z.array(z.unknown())";
  } else if (items === false) {
    expression = "z.array(z.never())";
  } else if (Array.isArray(items)) {
    throw new SchemaCompileError(`${path}: 不支持数组形式的 items`);
  } else {
    expression = `z.array(${compile(items, `${path}.items`)})`;
  }

  if (typeof schema.minItems === "number")
    expression += `.min(${numberLiteral(schema.minItems)})`;
  if (typeof schema.maxItems === "number")
    expression += `.max(${numberLiteral(schema.maxItems)})`;
  return expression;
}

function compileString(schema) {
  let expression = "z.string()";
  if (typeof schema.minLength === "number") {
    expression += `.min(${numberLiteral(schema.minLength)})`;
  }
  if (typeof schema.maxLength === "number") {
    expression += `.max(${numberLiteral(schema.maxLength)})`;
  }
  if (typeof schema.pattern === "string") {
    expression += `.regex(new RegExp(${JSON.stringify(schema.pattern)}))`;
  }
  return expression;
}

function compileNumber(schema, integer) {
  let expression = integer ? "z.number().int()" : "z.number()";
  if (typeof schema.minimum === "number")
    expression += `.min(${numberLiteral(schema.minimum)})`;
  if (typeof schema.maximum === "number")
    expression += `.max(${numberLiteral(schema.maximum)})`;
  if (typeof schema.exclusiveMinimum === "number") {
    expression += `.gt(${numberLiteral(schema.exclusiveMinimum)})`;
  }
  if (typeof schema.exclusiveMaximum === "number") {
    expression += `.lt(${numberLiteral(schema.exclusiveMaximum)})`;
  }
  if (typeof schema.multipleOf === "number") {
    expression += `.multipleOf(${numberLiteral(schema.multipleOf)})`;
  }
  return expression;
}

function assertSupportedKeywords(schema, path) {
  for (const keyword of UNSUPPORTED_KEYWORDS) {
    if (schema[keyword] !== undefined) {
      throw new SchemaCompileError(`${path}: 暂不支持关键字「${keyword}」`);
    }
  }
  // 对象键在 JSON 里本来只能是字符串；zod 的 z.record(z.string(), X) 会顺带产出
  // propertyNames: { type: "string" }。它没有额外的运行时含义，忽略即可；
  // 一旦出现非字符串键约束就说明契约超出了可表达范围，必须显式失败。
  const propertyNames = schema.propertyNames;
  if (propertyNames !== undefined) {
    const plainString =
      propertyNames !== null &&
      typeof propertyNames === "object" &&
      !Array.isArray(propertyNames) &&
      (propertyNames.type === "string" ||
        (propertyNames.type === undefined &&
          Object.keys(propertyNames).length === 0));
    if (!plainString) {
      throw new SchemaCompileError(`${path}: 暂不支持非字符串 propertyNames`);
    }
  }
}

function enumExpression(values) {
  if (values.length === 0) return "z.never()";
  if (values.every((value) => typeof value === "string")) {
    return `z.enum(${JSON.stringify(values)})`;
  }
  if (values.length === 1) return literalExpression(values[0]);
  return unionExpression(values.map((value) => literalExpression(value)));
}

function unionExpression(expressions) {
  if (expressions.length === 0) return "z.never()";
  if (expressions.length === 1) return expressions[0];
  return `z.union([${expressions.join(", ")}])`;
}

function literalExpression(value) {
  return `z.literal(${JSON.stringify(value)})`;
}

function numberLiteral(value) {
  return String(value);
}

function definitionNameFromRef(ref) {
  const match = /^#\/(?:\$defs|definitions)\/(.+)$/.exec(ref);
  if (match === null) return undefined;
  return decodePointer(match[1]);
}

function decodePointer(token) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function referencedDefinitions(schema) {
  const names = new Set();
  const visit = (value) => {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value.$ref === "string") {
      const name = definitionNameFromRef(value.$ref);
      if (name !== undefined) names.add(name);
    }
    for (const [keyword, child] of Object.entries(value)) {
      if (keyword === "enum" || keyword === "const") continue;
      if (keyword === "default" || keyword === "examples") continue;
      visit(child);
    }
  };
  visit(schema);
  return names;
}
