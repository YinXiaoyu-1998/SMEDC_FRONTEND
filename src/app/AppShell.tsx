import { Outlet } from "react-router";

import styles from "./AppShell.module.css";

// 应用外壳只负责结构与留白，导航与角色跳转由后续批次补齐
export function AppShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>SMEDC</span>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
