import styles from "./AdminIcon.module.css";

const glyphs = {
  archive: "\uf10d",
  arrow: "\uf138",
  building: "\uf1dd",
  chevron: "\uf285",
  close: "\uf659",
  condition: "\uf2ee",
  document: "\uf38b",
  edit: "\uf4cb",
  grid: "\uf3fb",
  journal: "\uf43d",
  person: "\uf4e1",
  plus: "\uf64d",
  search: "\uf52a",
  shield: "\uf538",
  status: "\uf52f",
  tasks: "\uf46d",
  store: "\uf543",
} as const;

export function AdminIcon({ name }: { readonly name: keyof typeof glyphs }) {
  return (
    <span className={styles.icon} aria-hidden="true">
      {glyphs[name]}
    </span>
  );
}
