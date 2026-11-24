import { useEffect, useEffectEvent, useId, useState } from "react";

import { useText } from "@/i18n/useText";
import { Button } from "@/ui/Button";

const sdkUrl =
  "https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js";

export type CaptchaResult = { captchaResult: boolean; bizResult: boolean };

type CaptchaOptions = {
  SceneId: string;
  mode: "popup";
  element: string;
  button: string;
  language: "cn" | "en";
  captchaVerifyCallback: (parameter: string) => Promise<CaptchaResult>;
  onBizResultCallback: (success: boolean) => void;
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
  disabled,
  busy,
  onVerify,
  onSuccess,
}: {
  prefix: string;
  sceneId: string;
  disabled: boolean;
  busy: boolean;
  onVerify: (parameter: string) => Promise<CaptchaResult>;
  onSuccess: () => void;
}) {
  const id = useId().replace(/[^\w-]/g, "");
  const { t, locale } = useText();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const verifyLatest = useEffectEvent(onVerify);
  const completeLatest = useEffectEvent(onSuccess);

  useEffect(() => {
    let active = true;
    let pending = false;
    let sent = false;
    let instance: { destroy?: () => void } | undefined;
    const failure = () => {
      if (active) setFailed(true);
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
          async captchaVerifyCallback(parameter) {
            if (!active || pending || sent || !parameter)
              return { captchaResult: false, bizResult: false };
            pending = true;
            try {
              const result = await verifyLatest(parameter);
              sent = result.captchaResult && result.bizResult;
              return result;
            } finally {
              pending = false;
            }
          },
          onBizResultCallback(success) {
            if (active && sent && success) completeLatest();
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
    };
  }, [id, locale, prefix, sceneId]);

  return (
    <>
      <div id={`registration-captcha-${id}`} />
      <Button
        id={`registration-captcha-button-${id}`}
        disabled={!ready || disabled}
        busy={busy}
      >
        {t("registration.send")}
      </Button>
      {failed && <p role="alert">{t("registration.challengeError")}</p>}
    </>
  );
}
