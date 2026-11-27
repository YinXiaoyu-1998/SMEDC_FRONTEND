import { replace, type LoaderFunctionArgs } from "react-router";

import {
  authErrorCode,
  exchangePasswordSetupToken,
  passwordSetupFormPath,
  readDeviceVerification,
  readPasswordSetupSession,
} from "./api";

export async function loadPasswordSetupLink({ request }: LoaderFunctionArgs) {
  const { hash, pathname } = window.location;
  const token = new URLSearchParams(hash.slice(1)).get("token");
  if (hash) window.history.replaceState(window.history.state, "", pathname);
  if (!token) return { error: "passwordSetup.expired" };

  try {
    await exchangePasswordSetupToken(token, request.signal);
    return replace(passwordSetupFormPath);
  } catch (error) {
    const code = authErrorCode(error);
    return {
      error:
        code === "PASSWORD_SETUP_EXPIRED" || code === "WEB_API_INVALID_REQUEST"
          ? "passwordSetup.expired"
          : "passwordSetup.exchangeFailed",
    };
  }
}

export async function loadPasswordSetupForm({ request }: LoaderFunctionArgs) {
  try {
    const session = await readPasswordSetupSession(request.signal);
    return { session };
  } catch (error) {
    return {
      error:
        authErrorCode(error) === "PASSWORD_SETUP_EXPIRED"
          ? "passwordSetup.expired"
          : "errors.action.generic",
    };
  }
}

export async function loadDeviceVerification({ request }: LoaderFunctionArgs) {
  const userCode = new URL(request.url).searchParams.get("user_code");
  if (!userCode) return { error: "deviceVerification.expired" };
  try {
    const device = await readDeviceVerification(userCode, request.signal);
    return { device, userCode };
  } catch (error) {
    return {
      error:
        authErrorCode(error) === "DEVICE_VERIFICATION_EXPIRED"
          ? "deviceVerification.expired"
          : "errors.action.generic",
    };
  }
}
