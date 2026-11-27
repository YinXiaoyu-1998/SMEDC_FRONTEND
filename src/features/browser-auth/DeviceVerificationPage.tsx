import { useState, type FormEvent } from "react";
import { useLoaderData } from "react-router";

import { AuthCard } from "@/app/AuthCard";
import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";
import styles from "@/app/LoginPage.module.css";

import { authErrorCode, signInForDevice } from "./api";
import type { loadDeviceVerification } from "./loaders";
import detailsStyles from "./Details.module.css";

export function DeviceVerificationPage() {
  const { t } = useText();
  const data = useLoaderData<typeof loadDeviceVerification>();
  const [status, setStatus] = useState<"complete" | "expired">();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (status === "complete") {
    return (
      <AuthCard title={t("deviceVerification.complete")}>
        <p role="status">{t("deviceVerification.return")}</p>
      </AuthCard>
    );
  }

  if (!data.device || status === "expired") {
    return (
      <AuthCard title={t("login.title")}>
        <p className={styles.formError} role="alert">
          {t(data.error ?? "deviceVerification.expired")}
        </p>
      </AuthCard>
    );
  }
  const { device, userCode } = data;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    setError(undefined);
    setBusy(true);
    try {
      await signInForDevice({ userCode, email, password }, device.csrfToken);
      setStatus("complete");
    } catch (failure) {
      const code = authErrorCode(failure);
      if (
        code === "DEVICE_VERIFICATION_EXPIRED" ||
        code === "DEVICE_VERIFICATION_SESSION_CHANGED" ||
        code === "BROWSER_SECURITY_CHECK_FAILED"
      ) {
        setStatus("expired");
      } else {
        setError(
          code === "BROWSER_INVALID_CREDENTIALS"
            ? "login.error.generic"
            : "errors.action.generic",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={t("login.title")}>
      <p>{t("deviceVerification.confirm")}</p>
      <dl className={detailsStyles.details}>
        <div>
          <dt>{t("deviceVerification.device")}</dt>
          <dd>{device.instanceName}</dd>
        </div>
        <div>
          <dt>{t("deviceVerification.host")}</dt>
          <dd>{device.instanceHostname}</dd>
        </div>
      </dl>
      <form className={styles.form} method="post" onSubmit={submit}>
        {error && (
          <p className={styles.formError} role="alert">
            {t(error)}
          </p>
        )}
        <label className={styles.field}>
          <span className={styles.label}>{t("login.email")}</span>
          <input
            name="email"
            type="email"
            className={styles.input}
            autoComplete="username"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("login.password")}</span>
          <input
            name="password"
            type="password"
            className={styles.input}
            autoComplete="current-password"
            required
          />
        </label>
        <Button type="submit" busy={busy} className={styles.submit}>
          {t("login.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
