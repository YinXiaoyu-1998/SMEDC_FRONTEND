import { requestWebApi, WebApiError } from "@/api/client";
import {
  deviceVerificationReadResponseSchema,
  deviceVerificationSignInResponseSchema,
  passwordSetupCompleteResponseSchema,
  passwordSetupExchangeResponseSchema,
  passwordSetupSessionResponseSchema,
  webApiRoutes,
  type DeviceVerificationSignInBody,
  type PasswordSetupCompleteBody,
} from "@/api/generated/contract";

export const passwordSetupPath = "/auth/password/setup";
export const passwordSetupFormPath = "/auth/password/setup/form";
export const deviceVerificationPath = "/oauth/device/verify";

export function exchangePasswordSetupToken(token: string, signal: AbortSignal) {
  return requestWebApi(
    {
      ...webApiRoutes["passwordSetup.exchange"],
      method: "POST",
      body: { token },
      signal,
      handleForbiddenLocally: true,
    },
    passwordSetupExchangeResponseSchema,
  );
}

export function readPasswordSetupSession(signal: AbortSignal) {
  return requestWebApi(
    {
      ...webApiRoutes["passwordSetup.session"],
      method: "GET",
      signal,
      handleForbiddenLocally: true,
    },
    passwordSetupSessionResponseSchema,
  );
}

export function completePasswordSetup(
  body: PasswordSetupCompleteBody,
  csrfToken: string,
) {
  return requestWebApi(
    {
      ...webApiRoutes["passwordSetup.complete"],
      method: "POST",
      body,
      csrfToken,
      handleForbiddenLocally: true,
    },
    passwordSetupCompleteResponseSchema,
  );
}

export function readDeviceVerification(userCode: string, signal: AbortSignal) {
  return requestWebApi(
    {
      ...webApiRoutes["deviceVerification.read"],
      method: "GET",
      query: { userCode },
      signal,
      handleForbiddenLocally: true,
    },
    deviceVerificationReadResponseSchema,
  );
}

export function signInForDevice(
  body: DeviceVerificationSignInBody,
  csrfToken: string,
) {
  return requestWebApi(
    {
      ...webApiRoutes["deviceVerification.signIn"],
      method: "POST",
      body,
      csrfToken,
      handleForbiddenLocally: true,
      handleUnauthorizedLocally: true,
    },
    deviceVerificationSignInResponseSchema,
  );
}

export function authErrorCode(error: unknown) {
  return error instanceof WebApiError ? error.code : "INTERNAL_ERROR";
}
