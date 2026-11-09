import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";

import { useLogin, useSession } from "@/api/session";
import { useAuthFeedback } from "@/app/authFeedback";
import { LanguageSwitch } from "@/app/LanguageSwitch";
import { LoadingSkeleton } from "@/app/LoadingSkeleton";
import { appPaths, resolveLoginTarget } from "@/app/paths";
import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

import styles from "./LoginPage.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MAX_LENGTH = 128;

function validateEmail(email: string): string | null {
  if (email === "") return "login.error.emailRequired";
  if (!EMAIL_PATTERN.test(email)) return "login.error.emailInvalid";
  return null;
}

function validatePassword(password: string): string | null {
  if (password === "") return "login.error.passwordRequired";
  if (password.length > PASSWORD_MAX_LENGTH)
    return "login.error.passwordTooLong";
  return null;
}

export function LoginPage() {
  const { t } = useText();
  const sessionQuery = useSession();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const { sessionExpired, clearSessionExpired, clearForbidden } =
    useAuthFeedback();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  // 登录成功时会话缓存先更新，用状态阻止"已登录跳回 /"抢在 next 之前生效
  const [attempting, setAttempting] = useState(false);

  if (sessionQuery.isPending) {
    return <LoadingSkeleton />;
  }

  if (
    sessionQuery.data !== null &&
    sessionQuery.data !== undefined &&
    !attempting
  ) {
    return <Navigate to={appPaths.home} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const nextEmailError = validateEmail(trimmedEmail);
    const nextPasswordError = validatePassword(password);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);

    if (nextEmailError !== null || nextPasswordError !== null) return;

    setAttempting(true);
    try {
      const session = await login.mutateAsync({
        email: trimmedEmail,
        password,
      });
      clearSessionExpired();
      clearForbidden();
      navigate(resolveLoginTarget(session, searchParams.get("next")), {
        replace: true,
      });
    } catch {
      setAttempting(false);
      setFormError("login.error.generic");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.topRow}>
          <span className={styles.brand}>{t("app.brand")}</span>
          <LanguageSwitch />
        </div>

        <h1 id="login-title" className={styles.title}>
          {t("login.title")}
        </h1>

        {sessionExpired ? (
          <p className={styles.notice} role="status">
            {t("login.expired")}
          </p>
        ) : null}

        {formError !== null ? (
          <p className={styles.formError} role="alert">
            {t(formError)}
          </p>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              {t("login.email")}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={emailError !== null ? true : undefined}
              aria-describedby={
                emailError !== null ? "login-email-error" : undefined
              }
            />
            {emailError !== null ? (
              <p
                id="login-email-error"
                className={styles.fieldError}
                role="alert"
              >
                {t(emailError)}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              {t("login.password")}
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={passwordError !== null ? true : undefined}
              aria-describedby={
                passwordError !== null ? "login-password-error" : undefined
              }
            />
            {passwordError !== null ? (
              <p
                id="login-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {t(passwordError)}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            busy={login.isPending}
            className={styles.submit}
          >
            {t("login.submit")}
          </Button>
        </form>
      </section>
    </main>
  );
}
