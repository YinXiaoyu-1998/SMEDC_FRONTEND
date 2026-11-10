import { requestWebApi } from "@/api/client";
import {
  webApiRoutes,
  directoryListDirectoryResponseSchema,
  directoryListEmployeesResponseSchema,
  directoryCreateEmployeeResponseSchema,
  directoryUpdateEmployeeResponseSchema,
  directoryManageStoreResponseSchema,
  directoryManageDepartmentResponseSchema,
} from "@/api/generated/contract";
import type {
  DirectoryListDirectoryBody,
  DirectoryListEmployeesBody,
  DirectoryCreateEmployeeBody,
  DirectoryUpdateEmployeeBody,
  DirectoryManageStoreBody,
  DirectoryManageDepartmentBody,
} from "@/api/generated/contract";

type Client = { orgId: string; csrfToken: string };
function post<T>(
  client: Client,
  route: { path: string },
  body: unknown,
  schema: import("zod").ZodType<T>,
) {
  return requestWebApi(
    {
      method: "POST",
      path: route.path,
      params: { orgId: client.orgId },
      csrfToken: client.csrfToken,
      body,
    },
    schema,
  );
}
export const directoryApi = {
  directory: (c: Client, b: DirectoryListDirectoryBody) =>
    post(
      c,
      webApiRoutes["directory.listDirectory"],
      b,
      directoryListDirectoryResponseSchema,
    ),
  employees: (c: Client, b: DirectoryListEmployeesBody) =>
    post(
      c,
      webApiRoutes["directory.listEmployees"],
      b,
      directoryListEmployeesResponseSchema,
    ),
  create: (c: Client, b: DirectoryCreateEmployeeBody) =>
    post(
      c,
      webApiRoutes["directory.createEmployee"],
      b,
      directoryCreateEmployeeResponseSchema,
    ),
  update: (c: Client, b: DirectoryUpdateEmployeeBody) =>
    post(
      c,
      webApiRoutes["directory.updateEmployee"],
      b,
      directoryUpdateEmployeeResponseSchema,
    ),
  store: (c: Client, b: DirectoryManageStoreBody) =>
    post(
      c,
      webApiRoutes["directory.manageStore"],
      b,
      directoryManageStoreResponseSchema,
    ),
  department: (c: Client, b: DirectoryManageDepartmentBody) =>
    post(
      c,
      webApiRoutes["directory.manageDepartment"],
      b,
      directoryManageDepartmentResponseSchema,
    ),
};
