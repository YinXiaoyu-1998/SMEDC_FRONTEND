import { useEffect, useRef, useState } from "react";
import { useText } from "@/i18n/useText";

interface Turnstile {
  ready(fn: () => void): void;
  render(element: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function Challenge({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { t, locale } = useText();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let widget: string | undefined;
    const failedChallenge = () => {
      if (active) {
        setFailed(true);
        onToken("");
      }
    };
    const mount = () =>
      window.turnstile?.ready(() => {
        if (!active || !container.current) return;
        widget = window.turnstile!.render(container.current, {
          sitekey: siteKey,
          action: "registration",
          language: locale === "zh" ? "zh-cn" : "en",
          size: "flexible",
          callback: (token: string) => {
            if (active) {
              setFailed(false);
              onToken(token);
            }
          },
          "expired-callback": () => {
            if (active) onToken("");
          },
          "error-callback": failedChallenge,
        });
      });
    const script = document.createElement("script");
    if (window.turnstile) mount();
    else {
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = mount;
      script.onerror = failedChallenge;
      document.head.append(script);
    }
    return () => {
      active = false;
      if (widget !== undefined) window.turnstile?.remove(widget);
      script.remove();
      onToken("");
    };
  }, [siteKey, onToken, locale]);
  return (
    <>
      <div ref={container} />
      {failed && <p role="alert">{t("registration.challengeError")}</p>}
    </>
  );
}
