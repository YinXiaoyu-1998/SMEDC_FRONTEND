import { useEffect, useId, useState } from "react";

import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

const sdkUrl =
  "https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js";

type CaptchaOptions = {
  SceneId: string;
  mode: "popup";
  element: string;
  button: string;
  language: "cn" | "en";
  success: (parameter: string) => void;
  fail: () => void;
  getInstance: (instance: { destroy?: () => void }) => void;
  onError: () => void;
};

declare global {
  interface Window {
    AliyunCaptchaConfig?: { region: "cn"; prefix: string };
    initAliyunCaptcha?: (options: CaptchaOptions) => void;
  }
}

let sdkLoad: Promise<void> | undefined;
function loadCaptchaSdk(prefix: string): Promise<void> {
  window.AliyunCaptchaConfig = { region: "cn", prefix };
  if (window.initAliyunCaptcha) return Promise.resolve();
  sdkLoad ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error("Captcha script unavailable"));
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    sdkLoad = undefined;
    throw error;
  });
  return sdkLoad;
}

export function Challenge({
  prefix,
  sceneId,
  onToken,
}: {
  prefix: string;
  sceneId: string;
  onToken: (token: string) => void;
}) {
  const id = useId().replace(/[^\w-]/g, "");
  const { t, locale } = useText();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let active = true;
    let instance: { destroy?: () => void } | undefined;
    const failure = () => {
      if (!active) return;
      setFailed(true);
      setVerified(false);
      onToken("");
    };
    void loadCaptchaSdk(prefix)
      .then(() => {
        if (!active) return;
        if (!window.initAliyunCaptcha) return failure();
        window.initAliyunCaptcha({
          SceneId: sceneId,
          mode: "popup",
          element: `#registration-captcha-${id}`,
          button: `#registration-captcha-button-${id}`,
          language: locale === "zh" ? "cn" : "en",
          success(parameter) {
            if (!active) return;
            setFailed(false);
            setVerified(true);
            onToken(parameter);
          },
          fail() {
            if (!active) return;
            setVerified(false);
            onToken("");
          },
          getInstance(nextInstance) {
            if (!active) {
              nextInstance.destroy?.();
              return;
            }
            instance = nextInstance;
            setReady(true);
          },
          onError: failure,
        });
      })
      .catch(failure);
    return () => {
      active = false;
      instance?.destroy?.();
      onToken("");
    };
  }, [id, locale, onToken, prefix, sceneId]);

  return (
    <>
      <div id={`registration-captcha-${id}`} />
      <Button
        id={`registration-captcha-button-${id}`}
        variant="secondary"
        disabled={!ready || verified}
      >
        {t(verified ? "registration.humanVerified" : "registration.humanCheck")}
      </Button>
      {failed && <p role="alert">{t("registration.challengeError")}</p>}
    </>
  );
}
