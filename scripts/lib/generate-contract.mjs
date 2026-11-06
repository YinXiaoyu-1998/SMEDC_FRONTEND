// 从 contract/contract.json 生成 src/api/generated/contract.ts。
//
// 生成物必须可逐字比较：所有命名与顺序都只由契约内容决定，不读取时间、环境变量
// 或文件系统里除契约之外的内容。

import {
  collectDefinitions,
  createSchemaCompiler,
  orderDefinitions,
  SchemaCompileError,
} from "./json-schema-to-zod.mjs";
import { formatSource } from "./prettier-format.mjs";

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const REQUEST_PARTS = ["body", "params", "query"];
const SCHEMA_PARTS = ["Body", "Params", "Query", "Response"];

const HEADER_LINES = [
  "// 由 npm run contract:sync 生成，禁止手改",
  "// 契约来源：YinXiaoyu-1998/SME_DATA_CENTER packages/web-api-contract/contract.json",
  "// 同步 ref 与内容 hash 见 contract/ref.json；重新生成：npm run contract:sync -- --ref <sha>",
];

const ROUTE_META_TYPES = `export type WebApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface WebApiRouteMeta {
  readonly method: WebApiHttpMethod;
  readonly path: string;
  readonly auth: string;
  readonly errors: readonly string[];
  readonly summary: string;
}`;

export class ContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "ContractError";
  }
}

// 契约是外部输入：先做最小结构校验，失败时给出能定位到具体路由的信息
export function assertContract(contract) {
  if (!isPlainObject(contract)) {
    throw new ContractError("契约根节点必须是对象");
  }
  if (
    !Number.isInteger(contract.contractVersion) ||
    contract.contractVersion < 1
  ) {
    throw new ContractError("contractVersion 必须是正整数");
  }
  if (typeof contract.prefix !== "string" || !contract.prefix.startsWith("/")) {
    throw new ContractError("prefix 必须是以 / 开头的路径");
  }
  if (contract.prefix.endsWith("/")) {
    throw new ContractError("prefix 不能以 / 结尾");
  }
  if (!Array.isArray(contract.routes)) {
    throw new ContractError("routes 必须是数组");
  }

  const ids = new Set();
  contract.routes.forEach((route, index) => {
    const label = `routes[${index}]`;
    if (!isPlainObject(route)) throw new ContractError(`${label} 必须是对象`);
    if (typeof route.id !== "string" || route.id.trim() === "") {
      throw new ContractError(`${label}.id 必须是非空字符串`);
    }
    if (ids.has(route.id))
      throw new ContractError(`路由 id「${route.id}」重复`);
    ids.add(route.id);

    if (typeof route.method !== "string" || !HTTP_METHODS.has(route.method)) {
      throw new ContractError(
        `路由「${route.id}」的 method「${String(route.method)}」不受支持`,
      );
    }
    if (typeof route.path !== "string") {
      throw new ContractError(`路由「${route.id}」缺少 path`);
    }
    if (
      route.path !== contract.prefix &&
      !route.path.startsWith(`${contract.prefix}/`)
    ) {
      throw new ContractError(
        `路由「${route.id}」的 path 必须以 ${contract.prefix} 开头`,
      );
    }
    if (typeof route.auth !== "string" || route.auth === "") {
      throw new ContractError(`路由「${route.id}」缺少 auth`);
    }
    if (typeof route.summary !== "string") {
      throw new ContractError(`路由「${route.id}」缺少 summary`);
    }
    if (
      !Array.isArray(route.errors) ||
      route.errors.some((code) => typeof code !== "string")
    ) {
      throw new ContractError(`路由「${route.id}」的 errors 必须是字符串数组`);
    }

    if (route.request !== undefined) {
      if (!isPlainObject(route.request)) {
        throw new ContractError(`路由「${route.id}」的 request 必须是对象`);
      }
      for (const keyword of Object.keys(route.request)) {
        if (!REQUEST_PARTS.includes(keyword)) {
          throw new ContractError(
            `路由「${route.id}」的 request 含未知字段「${keyword}」，请先扩展生成器`,
          );
        }
      }
    }

    if (!isPlainObject(route.response)) {
      throw new ContractError(`路由「${route.id}」缺少 response schema`);
    }
  });

  return contract;
}

export function normalizeContract(contract) {
  assertContract(contract);
  return JSON.stringify(contract, null, 2);
}

// 生成未格式化的 TypeScript 源码；格式化由 buildGeneratedSource 负责
export function generateContractSource(contract) {
  assertContract(contract);

  const definitions = collectDefinitions(contract);
  const orderedDefinitions = orderDefinitions(definitions);
  const registry = new NameRegistry();

  const routeBindings = contract.routes.map((route) => {
    const camel = toCamel(identifierWords(route.id));
    const pascal = toPascal(camel);
    const schemaNames = {};
    for (const part of SCHEMA_PARTS) {
      schemaNames[part] = registry.claim(
        `${camel}${part}Schema`,
        `路由「${route.id}」`,
      );
    }
    return { route, pascal, schemaNames };
  });

  const definitionNames = new Map();
  for (const name of orderedDefinitions) {
    definitionNames.set(
      name,
      registry.claimWithSuffix(
        `${toCamel(identifierWords(name))}Schema`,
        "Definition",
      ),
    );
  }

  const compiler = createSchemaCompiler({
    definitions,
    nameOfRef: (name) => {
      const generated = definitionNames.get(name);
      if (generated === undefined) {
        throw new ContractError(`$defs「${name}」没有生成名称`);
      }
      return generated;
    },
  });

  const sections = [];

  if (orderedDefinitions.length > 0) {
    const definitionLines = orderedDefinitions.map((name) => {
      const generatedName = definitionNames.get(name);
      const expression = compiler.compile(
        definitions.get(name),
        `$defs.${name}`,
      );
      return `export const ${generatedName} = ${expression};`;
    });
    sections.push(definitionLines.join("\n\n"));
  }

  for (const binding of routeBindings) {
    const { route, pascal, schemaNames } = binding;
    const schemas = {
      Body: route.request?.body,
      Params: route.request?.params,
      Query: route.request?.query,
      Response: route.response,
    };
    const lines = [];
    for (const part of SCHEMA_PARTS) {
      const schema = schemas[part];
      const expression =
        schema === undefined
          ? "z.strictObject({})"
          : compiler.compile(schema, `${route.id}.${part.toLowerCase()}`);
      lines.push(`export const ${schemaNames[part]} = ${expression};`);
      lines.push(
        `export type ${pascal}${part} = z.infer<typeof ${schemaNames[part]}>;`,
      );
    }
    sections.push(lines.join("\n\n"));
  }

  sections.push(renderRouteTable(contract));

  return [
    HEADER_LINES.join("\n"),
    'import { z } from "zod";',
    ROUTE_META_TYPES,
    `export const webApiPrefix = ${JSON.stringify(contract.prefix)};`,
    `export const contractVersion = ${JSON.stringify(contract.contractVersion)};`,
    ...sections,
  ].join("\n\n");
}

export async function buildGeneratedSource(contract, targetPath) {
  const source = generateContractSource(contract);
  return formatSource(source, targetPath, "typescript");
}

function renderRouteTable(contract) {
  const entries = contract.routes.map((route) => {
    const fields = [
      `method: ${JSON.stringify(route.method)}`,
      `path: ${JSON.stringify(route.path)}`,
      `auth: ${JSON.stringify(route.auth)}`,
      `errors: ${JSON.stringify(route.errors)}`,
      `summary: ${JSON.stringify(route.summary)}`,
    ];
    return `${JSON.stringify(route.id)}: {\n${fields.join(",\n")},\n}`;
  });

  return [
    "// route id → 调用方需要的静态元数据；运行时校验以各自的 zod schema 为准",
    `export const webApiRoutes = {\n${entries.join(",\n")},\n} as const satisfies Record<string, WebApiRouteMeta>;`,
    "export type WebApiRouteId = keyof typeof webApiRoutes;",
  ].join("\n\n");
}

class NameRegistry {
  constructor() {
    this.used = new Set();
  }

  claim(name, owner) {
    if (this.used.has(name)) {
      throw new ContractError(`生成的标识符「${name}」重复（来源：${owner}）`);
    }
    this.used.add(name);
    return name;
  }

  claimWithSuffix(base, suffix) {
    let attempt = 0;
    let name = base;
    while (this.used.has(name)) {
      attempt += 1;
      name = attempt === 1 ? `${base}${suffix}` : `${base}${suffix}${attempt}`;
    }
    this.used.add(name);
    return name;
  }
}

function identifierWords(raw) {
  const words = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  if (words.length === 0) {
    throw new ContractError(`「${raw}」无法转换为 TypeScript 标识符`);
  }
  for (const word of words) {
    if (/^[0-9]/.test(word)) {
      throw new ContractError(
        `「${raw}」不能以数字开头，无法转换为 TypeScript 标识符`,
      );
    }
  }
  return words.map((word) => word.toLowerCase());
}

function toCamel(words) {
  const [first, ...rest] = words;
  return first + rest.map(capitalize).join("");
}

function toPascal(camel) {
  return capitalize(camel);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export { SchemaCompileError };
