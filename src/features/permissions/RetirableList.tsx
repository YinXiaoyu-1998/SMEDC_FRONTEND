import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

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

/** 已停用分组：折叠状态、展开入口与停用成功后的焦点恢复。 */
export interface RetiredDisclosure {
  readonly expanded: boolean;
  readonly toggle: () => void;
  readonly reveal: () => void;
  readonly onRetired: () => void;
  readonly onRestored: () => void;
}

/**
 * 停用列表的公共行为。停用成功后「已停用」入口可能刚刚出现，
 * 因此等目录刷新、入口挂载后再把焦点还回去。
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRetiredDisclosure(
  retiredCount: number,
  disclosureRef: RefObject<HTMLButtonElement | null>,
): RetiredDisclosure {
  const [expanded, setExpanded] = useState(false);
  const [retireTick, setRetireTick] = useState(0);
  const pendingFocus = useRef(false);

  useEffect(() => {
    if (!pendingFocus.current || retiredCount === 0) return;
    pendingFocus.current = false;
    const frame = requestAnimationFrame(() => {
      disclosureRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [disclosureRef, retireTick, retiredCount]);

  return {
    expanded,
    toggle: () => {
      setExpanded((current) => !current);
    },
    reveal: () => {
      setExpanded(true);
    },
    onRetired: () => {
      pendingFocus.current = true;
      setRetireTick((tick) => tick + 1);
    },
    onRestored: () => {
      if (retiredCount <= 1) setExpanded(false);
    },
  };
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
  const [retiredSaves, setRetiredSaves] = useState(0);
  const disclosureRef = useRef<HTMLButtonElement | null>(null);
  const disclosure = useRetiredDisclosure(
    items.filter((item) => item.retired).length,
    disclosureRef,
  );
  const active = items.filter((item) => !item.retired);
  const retired = items.filter((item) => item.retired);
  const controls: RetiredControls = {
    reveal: disclosure.reveal,
    onStatusSaved: (isRetired) => {
      if (isRetired) {
        disclosure.onRetired();
        setRetiredSaves((count) => count + 1);
        return;
      }
      disclosure.onRestored();
      setRetiredSaves(0);
    },
  };

  // Keep editors under one React parent so a server-side status change
  // during a version conflict cannot discard the local draft.
  const rows = [
    ...active.map(render),
    retired.length === 0 ? null : (
      <button
        key="retired-disclosure"
        ref={disclosureRef}
        type="button"
        className={styles.retiredDisclosure}
        aria-expanded={disclosure.expanded}
        onClick={() => {
          disclosure.toggle();
          setRetiredSaves(0);
        }}
      >
        <span aria-hidden="true">{disclosure.expanded ? "▾" : "▸"}</span>
        {t("permissions.retired")} ({retired.length})
      </button>
    ),
    ...retired.map(render),
  ];

  function render(item: Item) {
    return (
      <div
        key={`item-${item.id}`}
        hidden={item.retired && !disclosure.expanded}
      >
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
        {retiredSaves > 0 && !disclosure.expanded
          ? t("permissions.saved")
          : null}
      </p>
    </>
  );
}
