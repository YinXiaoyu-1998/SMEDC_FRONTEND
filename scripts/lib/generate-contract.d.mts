// 生成器的类型声明：脚本本身是 node 直接运行的 .mjs，测试与类型检查通过这里消费。
export declare class ContractError extends Error {}
export declare class SchemaCompileError extends Error {}

export declare function assertContract(contract: unknown): void;
export declare function normalizeContract(contract: unknown): string;
export declare function generateContractSource(contract: unknown): string;
export declare function buildGeneratedSource(
  contract: unknown,
  targetPath: string,
): Promise<string>;
