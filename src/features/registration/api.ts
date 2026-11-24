import { requestWebApi } from "@/api/client";
import {
  registrationCompleteResponseSchema,
  registrationSendCodeResponseSchema,
  registrationSessionResponseSchema,
  registrationVerifyCodeResponseSchema,
  webApiRoutes,
  type RegistrationSendCodeBody,
  type RegistrationCompleteBody,
} from "@/api/generated/contract";

export function readRegistration(signal?: AbortSignal) {
  return requestWebApi(
    {
      ...webApiRoutes["registration.session"],
      method: "GET",
      signal,
      handleForbiddenLocally: true,
    },
    registrationSessionResponseSchema,
  );
}
export function sendCode(body: RegistrationSendCodeBody, csrfToken?: string) {
  return requestWebApi(
    {
      ...webApiRoutes["registration.sendCode"],
      method: "POST",
      body,
      ...(csrfToken ? { csrfToken } : {}),
      handleForbiddenLocally: true,
    },
    registrationSendCodeResponseSchema,
  );
}
export function verifyCode(code: string, csrfToken: string) {
  return requestWebApi(
    {
      ...webApiRoutes["registration.verifyCode"],
      method: "POST",
      body: { code },
      csrfToken,
      handleForbiddenLocally: true,
    },
    registrationVerifyCodeResponseSchema,
  );
}
export function createOrganization(
  body: RegistrationCompleteBody,
  csrfToken: string,
) {
  return requestWebApi(
    {
      ...webApiRoutes["registration.complete"],
      method: "POST",
      body,
      csrfToken,
      handleForbiddenLocally: true,
    },
    registrationCompleteResponseSchema,
  );
}
