import { useState, type FormEvent } from "react";
import { useLoaderData } from "react-router";

import { AuthCard } from "@/app/AuthCard";
import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";
import styles from "@/app/LoginPage.module.css";

import { authErrorCode, completePasswordSetup } from "./api";
import type { loadPasswordSetupForm, loadPasswordSetupLink } from "./loaders";
import detailsStyles from "./Details.module.css";

export function PasswordSetupLinkPage() {
  const { t } = useText();
  const { error } = useLoaderData<typeof loadPasswordSetupLink>();
  return (
    <AuthCard title={t("passwordSetup.title")}>
      <p className={styles.formError} role="alert">
        {t(error)}
      </p>
    </AuthCard>
  );
}

export function PasswordSetupPage() {
  const { t } = useText();
  const data = useLoaderData<typeof loadPasswordSetupForm>();
  const [status, setStatus] = useState<"saved" | "expired">();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (status === "saved") {
    return (
      <AuthCard title={t("passwordSetup.saved")}>
        <a href={appPaths.login}>{t("passwordSetup.login")}</a>
      </AuthCard>
    );
  }

  if (!data.session || status === "expired") {
    return (
      <AuthCard title={t("passwordSetup.title")}>
        <p className={styles.formError} role="alert">
          {t(data.error ?? "passwordSetup.expired")}
        </p>
      </AuthCard>
    );
  }

  const { account, csrfToken } = data.session;
  const accountDetails = [
    ["passwordSetup.displayName", account.displayName],
    ["login.email", account.email],
    ["passwordSetup.organization", account.organizationName],
    ["passwordSetup.role", t(`passwordSetup.${account.role}`)],
  ] as const;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") ?? "");
    const passwordConfirmation = String(
      fields.get("passwordConfirmation") ?? "",
    );
    if (password !== passwordConfirmation) {
      setError("passwordSetup.mismatch");
      return;
    }
    const length = Array.from(password.normalize("NFC")).length;
    if (length < 8 || length > 128) {
      setError("passwordSetup.rejected");
      return;
    }

    setError(undefined);
    setBusy(true);
    try {
      await completePasswordSetup(
        { password, passwordConfirmation },
        csrfToken,
      );
      setStatus("saved");
    } catch (failure) {
      const code = authErrorCode(failure);
      if (
        code === "PASSWORD_SETUP_EXPIRED" ||
        code === "BROWSER_SECURITY_CHECK_FAILED"
      ) {
        setStatus("expired");
      } else {
        setError(
          code === "PASSWORD_SETUP_REJECTED"
            ? "passwordSetup.rejected"
            : code === "PASSWORD_SETUP_MISMATCH"
              ? "passwordSetup.mismatch"
              : "errors.action.generic",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={t("passwordSetup.title")}>
      <section aria-labelledby="setup-account">
        <h2 className={detailsStyles.heading} id="setup-account">
          {t("passwordSetup.account")}
        </h2>
        <dl className={detailsStyles.details}>
          {accountDetails.map(([label, value]) => (
            <div key={label}>
              <dt>{t(label)}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <form className={styles.form} method="post" onSubmit={submit}>
        <p id="password-requirements">{t("passwordSetup.requirements")}</p>
        {error && (
          <p className={styles.formError} role="alert">
            {t(error)}
          </p>
        )}
        <label className={styles.field}>
          <span className={styles.label}>{t("passwordSetup.newPassword")}</span>
          <input
            name="password"
            type="password"
            className={styles.input}
            autoComplete="new-password"
            aria-describedby="password-requirements"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>
            {t("passwordSetup.confirmPassword")}
          </span>
          <input
            name="passwordConfirmation"
            type="password"
            className={styles.input}
            autoComplete="new-password"
            required
          />
        </label>
        <Button type="submit" busy={busy} className={styles.submit}>
          {t("passwordSetup.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
