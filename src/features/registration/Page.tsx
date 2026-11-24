import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { WebApiError } from "@/api/client";
import type { RegistrationSessionResponse } from "@/api/generated/contract";
import { sessionQueryKey } from "@/api/session";
import { Brand } from "@/app/Brand";
import { LanguageSwitch } from "@/app/LanguageSwitch";
import { appPaths } from "@/app/paths";
import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";
import styles from "@/app/LoginPage.module.css";
import { Challenge } from "./Challenge";
import {
  readRegistration,
  sendCode,
  verifyCode,
  createOrganization,
} from "./api";

const errors: Readonly<Record<string, string>> = {
  REGISTRATION_UNAVAILABLE: "registration.unavailable",
  REGISTRATION_HUMAN_CHECK_FAILED: "registration.challengeError",
  REGISTRATION_RATE_LIMITED: "registration.rate",
  REGISTRATION_DELIVERY_FAILED: "registration.delivery",
  REGISTRATION_CODE_INVALID: "registration.invalid",
  REGISTRATION_CODE_EXPIRED: "registration.expired",
  REGISTRATION_ATTEMPTS_EXHAUSTED: "registration.expired",
  REGISTRATION_EMAIL_IN_USE: "registration.existing",
  REGISTRATION_VERIFICATION_REQUIRED: "registration.sessionExpired",
  BROWSER_SECURITY_CHECK_FAILED: "registration.sessionExpired",
  REGISTRATION_PASSWORD_REJECTED: "registration.passwordError",
};
function errorMessage(error: unknown) {
  return (
    (error instanceof WebApiError && errors[error.code]) ||
    "registration.failed"
  );
}

export function RegistrationPage({ verifyPage }: { verifyPage: boolean }) {
  const { t, locale } = useText();
  const navigate = useNavigate();
  const queries = useQueryClient();
  const [session, setSession] = useState<RegistrationSessionResponse | null>(
    null,
  );
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [completeValid, setCompleteValid] = useState(false);
  const [token, setToken] = useState("");
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const [busy, setBusy] = useState<"send" | "verify" | "create" | null>(null);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const controller = new AbortController();
    readRegistration(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setSession(value);
          if (value.status !== "start") setEmail(value.email);
        }
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      });
    return () => controller.abort();
  }, []);

  const deadline =
    session?.status === "sent" ? Date.parse(session.resendAvailableAt) : 0;
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  useEffect(() => {
    if (!deadline || !verifyPage) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, verifyPage]);

  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!session || busy) return;
    setError("");
    setBusy("send");
    try {
      const recipient =
        verifyPage && session.status === "sent" ? session.email : email.trim();
      const sent = await sendCode(
        { email: recipient, ...(token ? { humanChallengeToken: token } : {}) },
        session.status === "start" ? undefined : session.csrfToken,
      );
      if (verifyPage) {
        setSession({
          ...sent,
          status: "sent",
          email: recipient,
          siteKey: session.siteKey,
        });
        setCode("");
        setNow(Date.now());
      } else {
        // Full navigation drops the third-party challenge script before entering any code or password.
        window.location.replace("/register/verify");
      }
    } catch (failure) {
      setError(errorMessage(failure));
      if (!verifyPage) {
        setToken("");
        setChallengeAttempt((value) => value + 1);
      }
    } finally {
      setBusy(null);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session?.status !== "sent" || busy) return;
    setBusy("verify");
    setError("");
    try {
      const result = await verifyCode(code, session.csrfToken);
      setCode("");
      setSession({
        status: result.status,
        email: session.email,
        siteKey: session.siteKey,
        csrfToken: session.csrfToken,
      });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(null);
    }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session?.status !== "verified" || busy) return;
    const data = new FormData(event.currentTarget);
    const organizationName = String(data.get("organizationName") ?? "").trim();
    const displayName = String(data.get("displayName") ?? "").trim();
    if (!organizationName || !displayName) return;
    setBusy("create");
    setError("");
    try {
      const account = await createOrganization(
        {
          organizationName,
          displayName,
          password: String(data.get("password") ?? ""),
        },
        session.csrfToken,
      );
      queries.setQueryData(sessionQueryKey, account);
      navigate(appPaths.permissions(account.identity.orgId), { replace: true });
    } catch (failure) {
      if (
        failure instanceof WebApiError &&
        failure.code === "REGISTRATION_EMAIL_IN_USE"
      ) {
        setSession({ ...session, status: "email_in_use" });
      } else {
        setError(
          failure instanceof WebApiError &&
            failure.code === "REGISTRATION_CODE_EXPIRED"
            ? "registration.sessionExpired"
            : errorMessage(failure),
        );
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="registration-title">
        <div className={styles.topRow}>
          <span className={styles.brand}>
            <Brand />
          </span>
          <LanguageSwitch />
        </div>
        <h1 id="registration-title" className={styles.title}>
          {t(
            verifyPage && session?.status === "sent"
              ? "registration.verify"
              : "registration.title",
          )}
        </h1>
        {error && (
          <p role="alert" className={styles.formError}>
            {t(error)}
          </p>
        )}
        {!session && !error && <p role="status">{t("app.loading")}</p>}
        {session && !verifyPage && (
          <>
            {session.status !== "start" && (
              <a href="/register/verify">{t("registration.resume")}</a>
            )}
            <form onSubmit={send} className={styles.form}>
              <label className={styles.field}>
                {t("login.email")}
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <Challenge
                key={challengeAttempt}
                siteKey={session.siteKey}
                onToken={setToken}
              />
              <Button
                type="submit"
                busy={busy === "send"}
                disabled={!email.trim() || !token}
              >
                {t("registration.send")}
              </Button>
            </form>
            <p>{t("registration.employee")}</p>
          </>
        )}
        {verifyPage && session?.status === "start" && (
          <a href="/register">{t("registration.restart")}</a>
        )}
        {verifyPage && session?.status === "sent" && (
          <>
            <p>{session.email}</p>
            <form onSubmit={verify} className={styles.form}>
              <label className={styles.field}>
                {t("registration.code")}
                <input
                  className={styles.input}
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
              <small>
                {t("registration.expires")}{" "}
                {new Date(session.expiresAt).toLocaleTimeString(
                  locale === "zh" ? "zh-CN" : "en",
                  { hour: "2-digit", minute: "2-digit" },
                )}
              </small>
              <Button
                type="submit"
                busy={busy === "verify"}
                disabled={!!busy || !/^[0-9]{6}$/.test(code)}
              >
                {t("registration.verify")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void send()}
                busy={busy === "send"}
                disabled={!!busy || seconds > 0}
              >
                {t("registration.resend")}
                {seconds > 0 && (
                  <span>
                    {" "}
                    · {seconds} {t("registration.wait")}
                  </span>
                )}
              </Button>
            </form>
            <a href="/register">{t("registration.change")}</a>
          </>
        )}
        {verifyPage && session?.status === "verified" && (
          <>
            <p>
              {t("registration.owner")} <strong>{session.email}</strong>
            </p>
            <form
              onSubmit={complete}
              onChange={(event) =>
                setCompleteValid(event.currentTarget.checkValidity())
              }
              className={styles.form}
            >
              <label className={styles.field}>
                {t("registration.org")}
                <input
                  className={styles.input}
                  name="organizationName"
                  required
                  pattern=".*\S.*"
                  maxLength={255}
                  autoComplete="organization"
                />
              </label>
              <label className={styles.field}>
                {t("registration.name")}
                <input
                  className={styles.input}
                  name="displayName"
                  required
                  pattern=".*\S.*"
                  maxLength={255}
                  autoComplete="name"
                />
              </label>
              <label className={styles.field}>
                {t("login.password")}
                <input
                  className={styles.input}
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <Button
                type="submit"
                busy={busy === "create"}
                disabled={!completeValid}
              >
                {t("registration.create")}
              </Button>
            </form>
          </>
        )}
        {verifyPage && session?.status === "email_in_use" && (
          <p role="status">{t("registration.existing")}</p>
        )}
        {verifyPage &&
          (error === "registration.sessionExpired" ||
            session?.status === "email_in_use") && (
            <a href="/register">{t("registration.restart")}</a>
          )}
        <a href={appPaths.login}>{t("registration.login")}</a>
      </section>
    </main>
  );
}
