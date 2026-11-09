import { requestWebApi } from "@/api/client";
import {
  permissionsEnterprisesListResponseSchema,
  permissionsStoresListResponseSchema,
  webApiRoutes,
  workflowsGetWorkflowStatusResponseSchema,
  workflowsListEnterpriseWorkflowsResponseSchema,
  workflowsPrepareEnterpriseWorkflowChangeResponseSchema,
  workflowsRecordWorkflowActionResponseSchema,
  workflowsSaveEnterpriseWorkflowResponseSchema,
} from "@/api/generated/contract";
import type {
  PermissionsEnterprisesListResponse,
  PermissionsStoresListResponse,
  WorkflowsGetEnterpriseWorkflowResponse,
  WorkflowsListEnterpriseWorkflowsBody,
  WorkflowsGetWorkflowStatusBody,
  WorkflowsGetWorkflowStatusResponse,
  WorkflowsPrepareEnterpriseWorkflowChangeBody,
  WorkflowsPrepareEnterpriseWorkflowChangeResponse,
  WorkflowsRecordWorkflowActionResponse,
  WorkflowsSaveEnterpriseWorkflowBody,
  WorkflowsSaveEnterpriseWorkflowResponse,
  WorkflowsListEnterpriseWorkflowsResponse,
} from "@/api/generated/contract";
import type { WorkflowType } from "@/features/workflows/model";

export const workflowQueryKeys = {
  enterprises: (orgId: string) => ["workflows", "enterprises", orgId] as const,
  stores: (orgId: string) => ["workflows", "stores", orgId] as const,
  bundle: (orgId: string, enterpriseKey: string) =>
    ["workflows", "bundle", orgId, enterpriseKey] as const,
};

export interface WorkflowClient {
  readonly orgId: string;
  readonly csrfToken: string;
}

export interface WorkflowBundle {
  readonly views: Readonly<Partial<Record<WorkflowType, WorkflowView>>>;
  readonly integration: WorkflowView["integration"] | null;
  readonly needsConfiguration: boolean;
}

type WorkflowView = WorkflowsGetEnterpriseWorkflowResponse;

type ActionInventoryResponse = Extract<
  WorkflowsRecordWorkflowActionResponse,
  { readonly actions: readonly unknown[] }
>;
type ActionInventoryEntry = ActionInventoryResponse["actions"][number];
export type ActionIdentity = Extract<
  ActionInventoryEntry,
  { readonly identity: unknown }
>["identity"];

export async function listEnterprises(
  client: WorkflowClient,
): Promise<PermissionsEnterprisesListResponse> {
  return requestWebApi(
    {
      method: "GET",
      path: webApiRoutes["permissions.enterprises.list"].path,
      params: { orgId: client.orgId },
    },
    permissionsEnterprisesListResponseSchema,
  );
}

export async function listStores(
  client: WorkflowClient,
): Promise<PermissionsStoresListResponse> {
  return requestWebApi(
    {
      method: "GET",
      path: webApiRoutes["permissions.stores.list"].path,
      params: { orgId: client.orgId },
    },
    permissionsStoresListResponseSchema,
  );
}

export async function listWorkflowPage(
  client: WorkflowClient,
  body: WorkflowsListEnterpriseWorkflowsBody,
): Promise<WorkflowsListEnterpriseWorkflowsResponse> {
  return requestWebApi(
    {
      method: "POST",
      path: webApiRoutes["workflows.listEnterpriseWorkflows"].path,
      params: { orgId: client.orgId },
      csrfToken: client.csrfToken,
      body,
    },
    workflowsListEnterpriseWorkflowsResponseSchema,
  );
}

/** 旧网页按 100 条游标把整家企业的工作流一次读完，这里保持同样的分页方式。 */
export async function loadEnterpriseWorkflows(
  client: WorkflowClient,
  enterpriseKey: string,
): Promise<WorkflowBundle> {
  const views: Partial<Record<WorkflowType, WorkflowView>> = {};
  let integration: WorkflowView["integration"] | null = null;
  let needsConfiguration = false;
  let cursor: string | undefined;

  do {
    const page = await listWorkflowPage(client, {
      enterpriseKey,
      limit: 100,
      ...(cursor === undefined ? {} : { cursor }),
    });

    needsConfiguration = needsConfiguration || page.needsConfiguration;
    for (const item of page.workflows) {
      // 列表项与单项读取结构一致；显式赋给 WorkflowView 让编译器确认这一点
      const view: WorkflowView = item;
      views[view.workflowType] = view;
      integration ??= view.integration;
    }
    cursor = page.nextCursor ?? undefined;
  } while (cursor !== undefined);

  return { views, integration, needsConfiguration };
}

export async function readWorkflowStatus(
  client: WorkflowClient,
  body: WorkflowsGetWorkflowStatusBody,
): Promise<WorkflowsGetWorkflowStatusResponse> {
  return requestWebApi(
    {
      method: "POST",
      path: webApiRoutes["workflows.getWorkflowStatus"].path,
      params: { orgId: client.orgId },
      csrfToken: client.csrfToken,
      body,
    },
    workflowsGetWorkflowStatusResponseSchema,
  );
}

export async function prepareWorkflowChange(
  client: WorkflowClient,
  body: WorkflowsPrepareEnterpriseWorkflowChangeBody,
): Promise<WorkflowsPrepareEnterpriseWorkflowChangeResponse> {
  return requestWebApi(
    {
      method: "POST",
      path: webApiRoutes["workflows.prepareEnterpriseWorkflowChange"].path,
      params: { orgId: client.orgId },
      csrfToken: client.csrfToken,
      body,
    },
    workflowsPrepareEnterpriseWorkflowChangeResponseSchema,
  );
}

export async function saveWorkflowChange(
  client: WorkflowClient,
  body: WorkflowsSaveEnterpriseWorkflowBody,
): Promise<WorkflowsSaveEnterpriseWorkflowResponse> {
  return requestWebApi(
    {
      method: "POST",
      path: webApiRoutes["workflows.saveEnterpriseWorkflow"].path,
      params: { orgId: client.orgId },
      csrfToken: client.csrfToken,
      body,
    },
    workflowsSaveEnterpriseWorkflowResponseSchema,
  );
}

/** 只读取未解决动作的身份摘要；不登记意图、不写回执。 */
export async function readActionIdentities(
  client: WorkflowClient,
  workflowId: string,
  actionIds: readonly string[],
): Promise<ReadonlyMap<string, ActionIdentity>> {
  const details = new Map<string, ActionIdentity>();
  if (actionIds.length === 0) return details;

  const response = await requestWebApi(
    {
      method: "POST",
      path: webApiRoutes["workflows.recordWorkflowAction"].path,
      params: { orgId: client.orgId },
      csrfToken: client.csrfToken,
      body: {
        workflowId,
        operation: { kind: "get", actionIds: [...actionIds] },
      },
    },
    workflowsRecordWorkflowActionResponseSchema,
  );

  if (!("actions" in response)) return details;
  for (const action of response.actions) {
    if ("identity" in action) details.set(action.actionId, action.identity);
  }
  return details;
}
