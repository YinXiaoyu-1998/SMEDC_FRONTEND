import { useEffect, useRef, useState, type ReactNode } from "react";

import { useText } from "@/i18n/useText";

import styles from "./Permissions.module.css";

interface RetirableItem {
  readonly id: string;
  readonly retired: boolean;
}

export interface RetiredControls {
  readonly reveal: () => void;
  readonly onStatusSaved: (retired: boolean) => void;
}

export function RetirableList<Item extends RetirableItem>({
  items,
  renderItem,
  empty,
}: {
  readonly items: readonly Item[];
  readonly renderItem: (item: Item, controls: RetiredControls) => ReactNode;
  readonly empty?: ReactNode;
}) {
  const { t } = useText();
  const [expanded, setExpanded] = useState(false);
  const [retiredSaves, setRetiredSaves] = useState(0);
  const disclosure = useRef<HTMLButtonElement>(null);
  const active = items.filter((item) => !item.retired);
  const retired = items.filter((item) => item.retired);
  const controls: RetiredControls = {
    reveal: () => setExpanded(true),
    onStatusSaved: (isRetired) => {
      if (!isRetired) {
        if (retired.length === 1) setExpanded(false);
        return;
      }
      if (expanded) return;
      setRetiredSaves((count) => count + 1);
    },
  };

  useEffect(() => {
    if (expanded || retiredSaves === 0 || retired.length === 0) return;
    const frame = requestAnimationFrame(() => disclosure.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [expanded, retiredSaves, retired.length]);

  // Keep editors under one React parent so a server-side status change
  // during a version conflict cannot discard the local draft.
  const rows = [
    ...active.map(render),
    retired.length === 0 ? null : (
      <button
        key="retired-disclosure"
        ref={disclosure}
        type="button"
        className={styles.retiredDisclosure}
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(!expanded);
          setRetiredSaves(0);
        }}
      >
        <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
        {t("permissions.retired")} ({retired.length})
      </button>
    ),
    ...retired.map(render),
  ];

  function render(item: Item) {
    return (
      <div key={`item-${item.id}`} hidden={item.retired && !expanded}>
        {renderItem(item, controls)}
      </div>
    );
  }

  return (
    <>
      {active.length === 0 && retired.length > 0 ? (
        <p className={styles.hint}>{t("permissions.noActiveItems")}</p>
      ) : items.length === 0 ? (
        empty
      ) : null}
      <div className={styles.stack}>{rows}</div>
      <p role="status" className={styles.catalogFeedback}>
        {retiredSaves > 0 && !expanded ? t("permissions.saved") : null}
      </p>
    </>
  );
}
