import {
  buildPath,
  requestWebApi,
  resolveWebApiUrl,
  WebApiError,
} from "@/api/client";
import {
  inspectionsContextResponseSchema,
  inspectionsDayResponseSchema,
  inspectionsPatchesResponseSchema,
  inspectionsPhotosUploadResponseSchema,
  inspectionsSheetsCreateResponseSchema,
  inspectionsSheetsReadResponseSchema,
  inspectionsSheetsReplacementResponseSchema,
  inspectionsSheetsReplaceResponseSchema,
  inspectionsSheetsVoidResponseSchema,
  webApiRoutes,
  type InspectionsContextQuery,
  type InspectionsDayQuery,
  type InspectionsPatchesBody,
  type InspectionsSheetsCreateBody,
  type InspectionsSheetsReadResponse,
  type InspectionsSheetsReplaceBody,
  type InspectionsSheetsVoidBody,
} from "@/api/generated/contract";

export type Scope = Omit<InspectionsDayQuery, "cursor" | "limit">;
export type Sheet = InspectionsSheetsReadResponse;
export type Patch = InspectionsPatchesBody["patches"][number];
export type Change = Patch["changes"][number];

export function context(query: InspectionsContextQuery, signal: AbortSignal) {
  return requestWebApi(
    { ...webApiRoutes["inspections.context"], query, signal },
    inspectionsContextResponseSchema,
  );
}

export function day(
  scope: Scope,
  cursor: string | undefined,
  signal: AbortSignal,
) {
  return requestWebApi(
    { ...webApiRoutes["inspections.day"], query: { ...scope, cursor }, signal },
    inspectionsDayResponseSchema,
  );
}

export function create(body: InspectionsSheetsCreateBody, csrfToken: string) {
  return requestWebApi(
    { ...webApiRoutes["inspections.sheets.create"], body, csrfToken },
    inspectionsSheetsCreateResponseSchema,
  );
}

async function sheetPage(
  sheetId: string,
  signal: AbortSignal,
  cursor?: string,
) {
  return requestWebApi(
    {
      ...webApiRoutes["inspections.sheets.read"],
      params: { sheetId },
      query: { cursor },
      signal,
    },
    inspectionsSheetsReadResponseSchema,
  );
}

export async function readSheet(
  sheetId: string,
  signal: AbortSignal,
): Promise<Sheet> {
  const first = await sheetPage(sheetId, signal);
  const questions = [...first.questions];
  const missingRequired = [...first.missingRequired];
  let cursor = first.nextCursor;
  while (cursor !== null) {
    const page = await sheetPage(sheetId, signal, cursor);
    if (
      page.sheetRevision !== first.sheetRevision ||
      page.templateVersionId !== first.templateVersionId
    ) {
      throw new WebApiError({
        status: 409,
        code: "INSPECTION_CONFLICT",
        message: "Sheet changed",
      });
    }
    questions.push(...page.questions);
    missingRequired.push(...page.missingRequired);
    cursor = page.nextCursor;
  }
  return { ...first, questions, missingRequired, nextCursor: null };
}

export async function save(patch: Patch, csrfToken: string) {
  const response = await requestWebApi(
    {
      ...webApiRoutes["inspections.patches"],
      body: { patches: [patch] },
      csrfToken,
    },
    inspectionsPatchesResponseSchema,
  );
  const result = response.results[0];
  if (!result || result.sheetId !== patch.sheetId) {
    throw new WebApiError({
      status: 200,
      code: "INVALID_RESPONSE",
      message: "Missing patch receipt",
    });
  }
  if (result.status !== "applied") {
    const status =
      result.status === "conflict"
        ? 409
        : result.error.code === "INSPECTION_FORBIDDEN"
          ? 403
          : result.error.code === "INSPECTION_NOT_FOUND"
            ? 404
            : 400;
    throw new WebApiError({
      status,
      code: result.error.code,
      message: result.error.message,
      cause: result.error,
    });
  }
  return result;
}

export function previewReplacement(sheetId: string) {
  return requestWebApi(
    { ...webApiRoutes["inspections.sheets.replacement"], params: { sheetId } },
    inspectionsSheetsReplacementResponseSchema,
  );
}

export function replaceSheet(
  sheetId: string,
  body: InspectionsSheetsReplaceBody,
  csrfToken: string,
) {
  return requestWebApi(
    {
      ...webApiRoutes["inspections.sheets.replace"],
      params: { sheetId },
      body,
      csrfToken,
    },
    inspectionsSheetsReplaceResponseSchema,
  );
}

export function voidSheet(
  sheetId: string,
  body: InspectionsSheetsVoidBody,
  csrfToken: string,
) {
  return requestWebApi(
    {
      ...webApiRoutes["inspections.sheets.void"],
      params: { sheetId },
      body,
      csrfToken,
    },
    inspectionsSheetsVoidResponseSchema,
  );
}

export function photoUrl(photoId: string) {
  return resolveWebApiUrl(
    buildPath(webApiRoutes["inspections.photos.read"].path, { photoId }),
  );
}

export function uploadPhoto(
  scope: Scope,
  requestId: string,
  file: File,
  csrfToken: string,
) {
  const body = new FormData();
  for (const [key, value] of Object.entries({ ...scope, requestId }))
    body.set(key, value);
  body.set("file", file);
  return requestWebApi(
    { ...webApiRoutes["inspections.photos.upload"], body, csrfToken },
    inspectionsPhotosUploadResponseSchema,
  );
}

export function isAccessError(error: unknown) {
  return error instanceof WebApiError && [401, 403, 404].includes(error.status);
}

export function isConflict(error: unknown) {
  return error instanceof WebApiError && error.status === 409;
}

export function isUncertain(error: unknown) {
  return (
    error instanceof WebApiError &&
    (error.status === 0 || error.status === 200 || error.status >= 500)
  );
}

const REPLAY_MS = 24 * 60 * 60 * 1000;

export function beginWrite() {
  return { requestId: crypto.randomUUID(), startedAt: Date.now() };
}

export function canReplay(startedAt: number) {
  return Date.now() - startedAt < REPLAY_MS;
}
