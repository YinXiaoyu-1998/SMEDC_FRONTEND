import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { TextProvider } from "@/i18n/TextProvider";

export function renderWithText(ui: ReactElement) {
  return render(<TextProvider>{ui}</TextProvider>);
}
