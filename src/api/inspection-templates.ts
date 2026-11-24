import { requestWebApi, WebApiError } from "@/api/client";
import {
  inspectionsContextResponseSchema,
  inspectionsTemplatesActivateResponseSchema,
  inspectionsTemplatesCreateBodySchema,
  inspectionsTemplatesCreateActiveResponseSchema,
  inspectionsTemplatesCreateResponseSchema,
  inspectionsTemplatesDeactivateResponseSchema,
  inspectionsTemplatesListResponseSchema,
  inspectionsTemplatesPreviewResponseSchema,
  inspectionsTemplatesSaveBodySchema,
  inspectionsTemplatesSaveResponseSchema,
  webApiRoutes,
  type InspectionsContextResponse,
  type InspectionsTemplatesCreateBody,
  type InspectionsTemplatesPreviewResponse,
} from "@/api/generated/contract";

export type TemplateDefinition = InspectionsTemplatesCreateBody["definition"];
export type TemplatePreview = InspectionsTemplatesPreviewResponse;
export type ContextItem = InspectionsContextResponse["items"][number];

export function isTemplateConflict(error: unknown) {
  return error instanceof WebApiError && error.status === 409;
}

export async function templateContext(signal: AbortSignal) {
  const route = webApiRoutes["inspections.context"];
  const items: ContextItem[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const page: InspectionsContextResponse = await requestWebApi(
      {
        ...route,
        query: { cursor, limit: 50 },
        signal,
        handleForbiddenLocally: true,
      },
      inspectionsContextResponseSchema,
    );
    items.push(
      ...page.items.filter((item) => item.canManageInspectionTemplates),
    );
    cursor = nextPage(page.nextCursor, seen);
  } while (cursor !== null);
  return items;
}

function nextPage(cursor: string | null, seen: Set<string>) {
  if (cursor !== null) {
    if (seen.has(cursor)) {
      throw new WebApiError({
        status: 0,
        code: "INVALID_RESPONSE",
        message: "Repeated inspection cursor.",
      });
    }
    seen.add(cursor);
  }
  return cursor;
}

export function listTemplates(
  enterpriseKey: string,
  cursor: string | null,
  signal: AbortSignal,
) {
  return requestWebApi(
    {
      ...webApiRoutes["inspections.templates.list"],
      handleForbiddenLocally: true,
      query: { enterpriseKey, cursor, limit: 20 },
      signal,
    },
    inspectionsTemplatesListResponseSchema,
  );
}

export async function previewTemplate(
  enterpriseKey: string,
  templateId: string,
  signal?: AbortSignal,
): Promise<TemplatePreview> {
  const route = webApiRoutes["inspections.templates.preview"];
  const fetchPage = (cursor: string | null) =>
    requestWebApi(
      {
        ...route,
        handleForbiddenLocally: true,
        params: { templateId },
        query: { enterpriseKey, cursor, limit: 50 },
        ...(signal ? { signal } : {}),
      },
      inspectionsTemplatesPreviewResponseSchema,
    );
  const first = await fetchPage(null);
  const seen = new Set<string>();
  let cursor = nextPage(first.nextCursor, seen);
  const questions = [...first.draft.questions];
  while (cursor !== null) {
    const page = await fetchPage(cursor);
    if (page.draftRevision !== first.draftRevision) {
      throw new WebApiError({
        status: 409,
        code: "INSPECTION_CONFLICT",
        message: "Inspection draft revision changed.",
      });
    }
    questions.push(...page.draft.questions);
    cursor = nextPage(page.nextCursor, seen);
  }
  return { ...first, draft: { ...first.draft, questions }, nextCursor: null };
}

export function writeTemplate(
  enterpriseKey: string,
  templateId: string,
  definition: TemplateDefinition,
  expectedDraftRevision: number | null,
  csrfToken: string,
  activateOnCreate = false,
) {
  if (expectedDraftRevision === null) {
    return requestWebApi(
      {
        ...webApiRoutes[
          activateOnCreate
            ? "inspections.templates.createActive"
            : "inspections.templates.create"
        ],
        handleForbiddenLocally: true,
        body: inspectionsTemplatesCreateBodySchema.parse({
          enterpriseKey,
          templateId,
          definition,
        }),
        csrfToken,
      },
      activateOnCreate
        ? inspectionsTemplatesCreateActiveResponseSchema
        : inspectionsTemplatesCreateResponseSchema,
    );
  }
  return requestWebApi(
    {
      ...webApiRoutes["inspections.templates.save"],
      handleForbiddenLocally: true,
      params: { templateId },
      body: inspectionsTemplatesSaveBodySchema.parse({
        enterpriseKey,
        definition,
        expectedDraftRevision,
      }),
      csrfToken,
    },
    inspectionsTemplatesSaveResponseSchema,
  );
}

export function setTemplateActivation(
  enterpriseKey: string,
  templateId: string,
  expectedDraftRevision: number,
  activate: boolean,
  csrfToken: string,
) {
  return requestWebApi(
    {
      ...webApiRoutes[
        activate
          ? "inspections.templates.activate"
          : "inspections.templates.deactivate"
      ],
      params: { templateId },
      handleForbiddenLocally: true,
      body: { enterpriseKey, expectedDraftRevision },
      csrfToken,
    },
    activate
      ? inspectionsTemplatesActivateResponseSchema
      : inspectionsTemplatesDeactivateResponseSchema,
  );
}
