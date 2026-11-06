// 转换器的类型声明：脚本本身是 node 直接运行的 .mjs。
export interface SchemaCompiler {
  compile(schema: unknown, path?: string): string;
}

export declare class SchemaCompileError extends Error {}

export declare function collectDefinitions(
  rootSchema: unknown,
): Map<string, unknown>;
export declare function orderDefinitions(
  definitions: Map<string, unknown>,
): string[];
export declare function createSchemaCompiler(options: {
  definitions?: Map<string, unknown>;
  nameOfRef?: (name: string) => string;
}): SchemaCompiler;
