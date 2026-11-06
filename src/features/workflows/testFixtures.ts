import { vi } from "vitest";

import type {
  WorkflowsGetEnterpriseWorkflowResponse,
  WorkflowsGetWorkflowStatusResponse,
  WorkflowsListEnterpriseWorkflowsResponse,
  WorkflowsPrepareEnterpriseWorkflowChangeBody,
  WorkflowsSaveEnterpriseWorkflowBody,
} from "@/api/generated/contract";
import type {
  WorkflowChange,
  WorkflowConfiguration,
  WorkflowView,
} from "@/features/workflows/model";
import { jsonResponse } from "@/test/http";

export const TIMESTAMP = "2026-01-01T00:00:00.000Z";

export function capability(id: string) {
  return {
    id,
    version: "1.0.0",
    configurationSchemaVersion: 1,
    minimumLauncherVersion: "0.1.0",
  };
}

export function dailyConfiguration(
  storeNames: readonly string[] = ["门店A"],
): WorkflowConfiguration {
  return {
    schemaVersion: 1,
    type: "meituan-daily-ingestion",
    storeNames: [...storeNames],
    notificationPolicy: "action_required",
    datasets: ["business"],
    orderScope: "settled_only",
    cleanupPolicy: "confirmed_files_only",
  };
}

export function integrationRecord(): WorkflowView["integration"] {
  return {
    orgId: "org-1",
    enterpriseKey: "enterprise-1",
    version: 3,
    schemaVersion: 1,
    configuration: {
      schemaVersion: 1,
      timezone: "Asia/Shanghai",
      sourceAccounts: [],
      storeMappings: [],
      exclusions: [],
    },
    orderScopeRequired: false,
    updatedBy: "admin",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

export function dailyView(
  overrides: Partial<WorkflowView> = {},
): WorkflowsGetEnterpriseWorkflowResponse {
  return {
    capability: capability("meituan-daily-ingestion"),
    workflowId: "wf-daily-1",
    enterpriseKey: "enterprise-1",
    workflowType: "meituan-daily-ingestion",
    version: 2,
    controlVersion: 1,
    controlState: "paused",
    assignmentEpoch: 0,
    assignedInstallationId: null,
    lease: { runId: null, expiresAt: null },
    configuration: dailyConfiguration(),
    integration: integrationRecord(),
    authorizations: [],
    ...overrides,
  };
}

export function sampleAuthorizations(): WorkflowView["authorizations"] {
  return [
    {
      authorizationId: "auth-1",
      scope: {
        kind: "download",
        datasets: ["business"],
        storeNames: ["门店A"],
      },
      configurationVersion: 1,
      controlVersion: 1,
      grantedBy: "admin",
      grantedAt: TIMESTAMP,
      revokedAt: null,
    },
    {
      authorizationId: "auth-2",
      scope: {
        kind: "email",
        purpose: "weekly_report",
        storeNames: ["门店A"],
        recipients: ["boss@example.com"],
        allowedSender: "robot@example.com",
        deliveryVersion: 1,
      },
      configurationVersion: 1,
      controlVersion: 1,
      grantedBy: "admin",
      grantedAt: TIMESTAMP,
      revokedAt: TIMESTAMP,
    },
  ];
}

export function listResponse(
  workflows: readonly WorkflowView[],
  needsConfiguration = false,
): WorkflowsListEnterpriseWorkflowsResponse {
  return {
    capability: capability("meituan-daily-ingestion"),
    needsConfiguration,
    setupUrl: "/admin/permissions/org-1/workflows/enterprise-1",
    workflows: [...workflows],
    nextCursor: null,
  };
}

export function statusPage(
  overrides: Partial<WorkflowsGetWorkflowStatusResponse> = {},
): WorkflowsGetWorkflowStatusResponse {
  return {
    capability: capability("meituan-daily-ingestion"),
    workflowId: "wf-daily-1",
    enterpriseKey: "enterprise-1",
    workflowType: "meituan-daily-ingestion",
    version: 2,
    controlVersion: 1,
    controlState: "paused",
    assignmentEpoch: 0,
    assignedInstallationId: null,
    lease: { runId: null, expiresAt: null },
    configuration: dailyConfiguration(),
    integration: integrationRecord(),
    authorizations: [],
    observedAt: TIMESTAMP,
    expectedWindow: { startDate: "2026-01-01", endDate: "2026-01-07" },
    possibleMissedWindow: false,
    pendingActions: [],
    nextActionCursor: null,
    migrations: [],
    nextMigrationCursor: null,
    installations: [],
    runs: [],
    nextCursor: null,
    ...overrides,
  };
}

export interface ApiCall {
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
}

export function previewResponse(
  body: WorkflowsPrepareEnterpriseWorkflowChangeBody,
): Response {
  return jsonResponse({
    ...body,
    previewId: "preview-1",
    confirmationDigest: "a".repeat(64),
    expiresAt: TIMESTAMP,
    impact: {
      affectedWorkflows: [
        { workflowType: body.workflowType, storeNames: ["门店A"] },
      ],
    },
  });
}

export interface WorkflowApiOptions {
  readonly enterprises?: readonly {
    enterpriseKey: string;
    enterpriseName: string;
  }[];
  readonly stores?: readonly {
    orgId: string;
    enterpriseKey: string;
    name: string;
    retired: boolean;
  }[];
  readonly views?: readonly WorkflowView[];
  readonly needsConfiguration?: boolean;
  readonly status?: WorkflowsGetWorkflowStatusResponse;
  readonly listFailure?: { readonly status: number; readonly code: string };
  readonly prepare?: (
    body: WorkflowsPrepareEnterpriseWorkflowChangeBody,
  ) => Response | Promise<Response> | undefined;
  readonly save?: (
    body: WorkflowsSaveEnterpriseWorkflowBody,
  ) => Response | Promise<Response> | undefined;
}

export const defaultEnterprises = [
  { enterpriseKey: "enterprise-1", enterpriseName: "示例企业" },
];

export const defaultStores = [
  {
    orgId: "org-1",
    enterpriseKey: "enterprise-1",
    name: "门店A",
    retired: false,
  },
  {
    orgId: "org-1",
    enterpriseKey: "enterprise-1",
    name: "门店B",
    retired: false,
  },
];

function applyChange(view: WorkflowView, change: WorkflowChange): WorkflowView {
  if (change.kind === "configuration") {
    return {
      ...view,
      version: view.version + 1,
      configuration: change.configuration,
    };
  }
  if (change.kind === "integration") {
    return {
      ...view,
      version: view.version + 1,
      integration: {
        ...view.integration,
        version: view.integration.version + 1,
        configuration: change.configuration,
        updatedAt: TIMESTAMP,
      },
    };
  }
  if (change.kind === "control") {
    return {
      ...view,
      controlVersion: view.controlVersion + 1,
      controlState: change.state,
    };
  }
  const revoked = view.authorizations.map((authorization) =>
    change.revokeAuthorizationIds.includes(authorization.authorizationId)
      ? { ...authorization, revokedAt: TIMESTAMP }
      : authorization,
  );
  const grants = change.grant.map((scope, index) => ({
    authorizationId: `auth-${index + 1}`,
    scope,
    configurationVersion: view.version,
    controlVersion: view.controlVersion,
    grantedBy: "admin",
    grantedAt: TIMESTAMP,
    revokedAt: null,
  }));
  return {
    ...view,
    version: view.version + 1,
    authorizations: [...revoked, ...grants],
  };
}

export function createWorkflowApi(options: WorkflowApiOptions = {}) {
  const state = { views: [...(options.views ?? [dailyView()])] };
  const calls: ApiCall[] = [];
  let lastChange: WorkflowChange | null = null;

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const body: unknown =
        init?.body === undefined ? undefined : JSON.parse(String(init.body));
      calls.push({ url, method, body });

      if (method === "GET" && url.endsWith("/permissions/enterprises")) {
        return jsonResponse({
          authorizationVersion: "1",
          enterprises: options.enterprises ?? defaultEnterprises,
        });
      }
      if (method === "GET" && url.endsWith("/permissions/stores")) {
        return jsonResponse({
          authorizationVersion: "1",
          stores: options.stores ?? defaultStores,
        });
      }
      if (url.endsWith("/workflows/list_enterprise_workflows")) {
        if (options.listFailure !== undefined) {
          return jsonResponse(
            {
              error: {
                code: options.listFailure.code,
                message: "mock failure",
              },
            },
            options.listFailure.status,
          );
        }
        return jsonResponse(
          listResponse(state.views, options.needsConfiguration ?? false),
        );
      }
      if (url.endsWith("/workflows/get_workflow_status")) {
        return jsonResponse(options.status ?? statusPage());
      }
      if (url.endsWith("/workflows/get_enterprise_workflow")) {
        const request = body as { workflowType: string };
        const view = state.views.find(
          (item) => item.workflowType === request.workflowType,
        );
        if (view === undefined) {
          return jsonResponse(
            {
              error: {
                code: "WORKFLOW_CONFIGURATION_REQUIRED",
                message: "missing",
              },
            },
            400,
          );
        }
        return jsonResponse(view);
      }
      if (url.endsWith("/workflows/prepare_enterprise_workflow_change")) {
        const request = body as WorkflowsPrepareEnterpriseWorkflowChangeBody;
        if (options.prepare !== undefined) {
          const custom = await options.prepare(request);
          if (custom !== undefined) {
            lastChange = request.change;
            return custom;
          }
        }
        lastChange = request.change;
        return previewResponse(request);
      }
      if (url.endsWith("/workflows/save_enterprise_workflow")) {
        const request = body as WorkflowsSaveEnterpriseWorkflowBody;
        if (options.save !== undefined) {
          const custom = await options.save(request);
          if (custom !== undefined) return custom;
        }
        const index = state.views.findIndex(
          (item) => item.workflowType === request.workflowType,
        );
        const current = state.views[index];
        if (current === undefined || lastChange === null) {
          return jsonResponse(
            { error: { code: "INTERNAL_ERROR", message: "unexpected save" } },
            500,
          );
        }
        const saved = applyChange(current, lastChange);
        state.views = state.views.map((view, position) =>
          position === index ? saved : view,
        );
        if (lastChange.kind === "integration") {
          state.views = state.views.map((view) => ({
            ...view,
            integration: saved.integration,
          }));
        }
        lastChange = null;
        return jsonResponse(saved);
      }
      if (url.endsWith("/workflows/record_workflow_action")) {
        return jsonResponse({ actions: [] });
      }

      return jsonResponse(
        { error: { code: "INTERNAL_ERROR", message: "未预期的请求" } },
        500,
      );
    },
  );

  return {
    state,
    calls,
    fetchMock,
    install() {
      vi.stubGlobal("fetch", fetchMock);
    },
  };
}
