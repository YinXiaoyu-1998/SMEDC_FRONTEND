import { Component, Fragment } from "react";
import type { ReactNode } from "react";

import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

import styles from "./ErrorBoundary.module.css";

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly hasError: boolean;
  readonly retryKey: number;
}

function ErrorFallback({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useText();

  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.content} role="alert">
        <h1 className={styles.title}>{t("errors.boundary.title")}</h1>
        <p className={styles.description}>{t("errors.boundary.description")}</p>
        <Button onClick={onRetry}>{t("errors.boundary.retry")}</Button>
      </div>
    </main>
  );
}

// 只有类组件能捕获子树渲染错误；对外只给稳定文案，原始堆栈留在开发者控制台
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Partial<AppErrorBoundaryState> {
    return { hasError: true };
  }

  private readonly handleRetry = () => {
    this.setState((previous) => ({
      hasError: false,
      retryKey: previous.retryKey + 1,
    }));
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}
