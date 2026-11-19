import { useEffect, useId, useRef, useState } from "react";
import { useText } from "@/i18n/useText";
import { formatMessage } from "./messages";
import styles from "./Page.module.css";

interface StorePickerProps {
  stores: readonly string[];
  selected: readonly string[];
  onChange: (names: readonly string[]) => void;
}

export function StorePicker({ stores, selected, onChange }: StorePickerProps) {
  const { t } = useText();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const all = useRef<HTMLInputElement>(null);
  const selectedSet = new Set(selected);
  const allChecked =
    stores.length > 0 && stores.every((name) => selectedSet.has(name));
  const shown = stores.filter((name) =>
    name.toLowerCase().includes(keyword.trim().toLowerCase()),
  );
  const summary =
    selected.length === 1
      ? selected[0]
      : selected.length
        ? formatMessage(t("ledger.picked"), { count: selected.length })
        : t(stores.length ? "ledger.pickStores" : "ledger.noStores");

  useEffect(() => {
    if (all.current)
      all.current.indeterminate = selected.length > 0 && !allChecked;
  }, [open, selected.length, allChecked]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div
      className={styles.picker}
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
        if (event.key === "Enter" && event.target instanceof HTMLInputElement)
          event.preventDefault();
      }}
    >
      <label htmlFor={id}>{t("ledger.store")}</label>
      <button
        id={id}
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id + "-choices" : undefined}
        disabled={!stores.length}
        onClick={() => {
          setKeyword("");
          setOpen(!open);
        }}
      >
        <span className={styles.storeSummary} title={summary}>
          {summary}
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          id={id + "-choices"}
          className={styles.storeMenu}
          role="group"
          aria-label={t("ledger.store")}
        >
          <input
            type="search"
            value={keyword}
            placeholder={t("ledger.searchStores")}
            aria-label={t("ledger.searchStores")}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <label>
            <input
              type="checkbox"
              ref={all}
              checked={allChecked}
              onChange={() => onChange(allChecked ? [] : stores)}
            />
            {t("ledger.selectAllStores")}
          </label>
          <div className={styles.storeList}>
            {shown.map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  checked={selectedSet.has(name)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selected, name]
                        : selected.filter((item) => item !== name),
                    )
                  }
                />
                {name}
              </label>
            ))}
            {!shown.length && (
              <p className={styles.muted}>{t("ledger.noMatch")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
