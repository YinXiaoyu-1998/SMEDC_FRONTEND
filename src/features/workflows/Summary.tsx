import { summarySkippedKeys } from "@/features/workflows/model";
import { useWorkflowText } from "@/features/workflows/text";

import styles from "@/features/workflows/Page.module.css";

export interface SummaryProps {
  readonly value: unknown;
}

/**
 * 与旧网页的 summary() 对齐：对象展开为字段列表，数组逐项渲染，
 * 布尔值翻成“是/否”，已知词条翻译，未知字符串（业务名称）原样显示。
 */
export function Summary({ value }: SummaryProps) {
  const { w } = useWorkflowText();

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className={styles.hint}>{w("empty")}</p>;
    }
    return (
      <ul className={styles.summaryList}>
        {value.map((item, index) => (
          <li key={index}>
            <SummaryValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).filter(
      ([key]) => !summarySkippedKeys.has(key),
    );
    if (entries.length === 0) {
      return <p className={styles.hint}>{w("empty")}</p>;
    }
    return (
      <dl className={styles.summary}>
        {entries.map(([key, item]) => (
          <div className={styles.summaryRow} key={key}>
            <dt>{w(key)}</dt>
            <dd>
              <SummaryValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <SummaryValue value={value} />;
}

function SummaryValue({ value }: SummaryProps) {
  const { w } = useWorkflowText();

  if (value === null || value === undefined) {
    return <span>{w("empty")}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span>{w("empty")}</span>;
    return (
      <ul className={styles.summaryList}>
        {value.map((item, index) => (
          <li key={index}>
            <SummaryValue value={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "boolean") {
    return <span>{w(value ? "yes" : "no")}</span>;
  }
  if (typeof value === "object") {
    return <Summary value={value} />;
  }
  if (typeof value === "string") {
    // 已知词条（如 meituan_reviews）翻译，业务名称没有词条时原样返回
    return <span>{w(value)}</span>;
  }
  return <span>{String(value)}</span>;
}
