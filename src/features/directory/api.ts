import { requestWebApi } from "@/api/client";
import {
  webApiRoutes,
  directoryListDirectoryResponseSchema,
  directoryListEmployeesResponseSchema,
  directoryCreateEmployeeResponseSchema,
  directoryUpdateEmployeeResponseSchema,
  directoryManageStoreResponseSchema,
  directoryManageDepartmentResponseSchema,
  directoryCheckDepartmentNameResponseSchema,
} from "@/api/generated/contract";
import type {
  DirectoryListDirectoryBody,
  DirectoryListEmployeesBody,
  DirectoryCreateEmployeeBody,
  DirectoryUpdateEmployeeBody,
  DirectoryManageStoreBody,
  DirectoryManageDepartmentBody,
  DirectoryCheckDepartmentNameBody,
} from "@/api/generated/contract";

export type DirectoryApiClient = { orgId: string; csrfToken: string };
function post<T>(
  client: DirectoryApiClient,
  route: { path: string },
  body: unknown,
  schema: import("zod").ZodType<T>,
  signal?: AbortSignal,
) {
  return requestWebApi(
    {
      method: "POST",
      path: route.path,
      params: { orgId: client.orgId },
      csrfToken: client.csrfToken,
      body,
      ...(signal ? { signal } : {}),
    },
    schema,
  );
}
export const directoryApi = {
  checkDepartmentName: (
    c: DirectoryApiClient,
    b: DirectoryCheckDepartmentNameBody,
    signal: AbortSignal,
  ) =>
    post(
      c,
      webApiRoutes["directory.checkDepartmentName"],
      b,
      directoryCheckDepartmentNameResponseSchema,
      signal,
    ),
  directory: (c: DirectoryApiClient, b: DirectoryListDirectoryBody) =>
    post(
      c,
      webApiRoutes["directory.listDirectory"],
      b,
      directoryListDirectoryResponseSchema,
    ),
  employees: (c: DirectoryApiClient, b: DirectoryListEmployeesBody) =>
    post(
      c,
      webApiRoutes["directory.listEmployees"],
      b,
      directoryListEmployeesResponseSchema,
    ),
  create: (c: DirectoryApiClient, b: DirectoryCreateEmployeeBody) =>
    post(
      c,
      webApiRoutes["directory.createEmployee"],
      b,
      directoryCreateEmployeeResponseSchema,
    ),
  update: (c: DirectoryApiClient, b: DirectoryUpdateEmployeeBody) =>
    post(
      c,
      webApiRoutes["directory.updateEmployee"],
      b,
      directoryUpdateEmployeeResponseSchema,
    ),
  store: (c: DirectoryApiClient, b: DirectoryManageStoreBody) =>
    post(
      c,
      webApiRoutes["directory.manageStore"],
      b,
      directoryManageStoreResponseSchema,
    ),
  department: (c: DirectoryApiClient, b: DirectoryManageDepartmentBody) =>
    post(
      c,
      webApiRoutes["directory.manageDepartment"],
      b,
      directoryManageDepartmentResponseSchema,
    ),
};
