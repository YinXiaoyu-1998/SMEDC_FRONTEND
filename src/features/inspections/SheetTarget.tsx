import type { Sheet } from "./employeeApi";
import { useEmployeeText } from "./employeeText";
import styles from "./Employee.module.css";

export function SheetTarget({
  sheet,
}: {
  sheet: Pick<Sheet, "targetType" | "targetName" | "targetId">;
}) {
  const t = useEmployeeText();
  return (
    <>
      <p>
        {t(sheet.targetType)} · {sheet.targetName}
      </p>
      <p className={styles.identifier}>
        {t("targetId")} <code>{sheet.targetId}</code>
      </p>
    </>
  );
}
