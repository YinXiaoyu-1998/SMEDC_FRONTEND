/**
 * 稳定序列化：对象键排序后再输出，字段顺序变化不产生差异。
 * normalize 负责把业务上无意义的数组顺序等归一化；这里只做确定性序列化。
 */
export function stableSerialize(value: unknown): string {
  return serialize(value, new WeakSet<object>());
}

function serialize(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "undefined":
      return "undefined";
    case "string":
      return JSON.stringify(value);
    case "number":
      return Object.is(value, -0) ? "-0" : String(value);
    case "boolean":
      return value ? "true" : "false";
    case "bigint":
      return `${value.toString()}n`;
    case "symbol":
      return `Symbol(${value.description ?? ""})`;
    case "function":
      return `Function(${value.name})`;
    default:
      break;
  }

  if (seen.has(value)) {
    // 循环引用无法判断是否相等，直接抛出比悄悄给出错误结果更容易定位
    throw new Error("normalize 结果不能包含循环引用");
  }
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => serialize(item, seen)).join(",")}]`;
    }
    if (value instanceof Date) {
      return `Date(${value.toISOString()})`;
    }
    if (value instanceof Map) {
      const entries = [...value.entries()].map(
        ([key, item]) => `${serialize(key, seen)}=>${serialize(item, seen)}`,
      );
      return `Map(${entries.join(",")})`;
    }
    if (value instanceof Set) {
      return `Set(${[...value].map((item) => serialize(item, seen)).join(",")})`;
    }

    const record = value as Record<string, unknown>;
    const fields = Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${serialize(record[key], seen)}`);
    return `{${fields.join(",")}}`;
  } finally {
    seen.delete(value);
  }
}
