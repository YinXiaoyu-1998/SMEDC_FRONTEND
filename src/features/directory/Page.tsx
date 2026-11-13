import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { WebApiError } from "@/api/client";
import { useSession } from "@/api/session";
import { PageFrame } from "@/app/PageFrame";
import { listEnterprises } from "@/features/workflows/api";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { AdminIcon } from "@/ui/AdminIcon";
import { Button } from "@/ui/Button";
import { directoryApi, type DirectoryApiClient } from "./api";
import styles from "./Page.module.css";
import type {
  DirectoryListEmployeesResponse,
  DirectoryManageStoreBody,
  DirectoryManageDepartmentBody,
} from "@/api/generated/contract";

type Employee = DirectoryListEmployeesResponse["employees"][number];
type Draft = {
  name: string;
  departmentId: string;
  ownership: "" | "group" | "store";
  storeId: string;
  status: "active" | "departed";
};
const blank: Draft = {
  name: "",
  departmentId: "",
  ownership: "",
  storeId: "",
  status: "active",
};
type Tab = "employees" | "stores" | "departments";
type DepartmentNameIssue = "empty" | "whitespace" | "tooLong" | "duplicate";

type DepartmentNameConflict = {
  orgId: string;
  enterprise: string;
  departmentId: string | null;
  name: string;
};

function departmentNameInputIssue(name: string): DepartmentNameIssue | null {
  const trimmed = name.trim();
  if (!trimmed) return "empty";
  if (name !== trimmed) return "whitespace";
  if (name.length > 255) return "tooLong";
  return null;
}

function useDepartmentNameCheck(
  client: DirectoryApiClient,
  enterprise: string,
  name: string | null,
  directoryUpdatedAt: number,
  excludeDepartmentId?: string,
) {
  const [settledName, setSettledName] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSettledName(name), 200);
    return () => clearTimeout(timer);
  }, [name]);

  const enabled = !!enterprise && name !== null && name === settledName;
  const check = useQuery({
    queryKey: [
      "department-name-check",
      client.orgId,
      enterprise,
      name,
      excludeDepartmentId,
      directoryUpdatedAt,
    ],
    queryFn: ({ signal }) =>
      directoryApi.checkDepartmentName(
        client,
        {
          enterpriseKey: enterprise,
          name: name!,
          ...(excludeDepartmentId ? { excludeDepartmentId } : {}),
        },
        signal,
      ),
    enabled,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  return {
    available:
      enabled && check.isSuccess && !check.isFetching && !check.data.duplicate,
    duplicate: enabled && check.isSuccess && check.data.duplicate,
    checking: name !== null && (!enabled || check.isFetching),
    error: enabled && check.isError,
    retry: check.refetch,
  };
}

export function DirectoryPage() {
  const { orgId = "" } = useParams<"orgId">();
  const session = useSession().data;
  const { locale } = useText();
  const L = ([zh, en]: readonly [string, string]) =>
    locale === "en" ? en : zh;
  const client = useMemo(
    () => ({ orgId, csrfToken: session?.csrfToken ?? "" }),
    [orgId, session?.csrfToken],
  );
  const enterprises = useQuery({
    queryKey: ["directory-enterprises", orgId],
    queryFn: () => listEnterprises(client),
    enabled: !!session,
    retry: false,
  });
  const [selected, setSelected] = useState("");
  const enterprise =
    selected || enterprises.data?.enterprises[0]?.enterpriseKey || "";
  const [tab, setTab] = useState<Tab>("employees");
  const [status, setStatus] = useState<"active" | "departed">("active");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [cursor, setCursor] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const employeeHeading = useRef<HTMLHeadingElement>(null);
  const employeeEditorOpen = draft !== null && tab === "employees";
  useEffect(() => {
    if (employeeEditorOpen) employeeHeading.current?.focus();
  }, [editing?.employeeUid, employeeEditorOpen]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const busy = pendingAction !== null;
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [conflict, setConflict] = useState(false);
  const [duplicateNameError, setDuplicateNameError] =
    useState<DepartmentNameConflict | null>(null);
  const [storeNameDraft, setStoreNameDraft] = useState("");
  const [departmentNameDraft, setDepartmentNameDraft] = useState("");
  const newName = tab === "stores" ? storeNameDraft : departmentNameDraft;
  const setNewName =
    tab === "stores" ? setStoreNameDraft : setDepartmentNameDraft;
  const [createdUid, setCreatedUid] = useState("");
  const [rename, setRename] = useState<{
    kind: "store" | "department";
    id: string;
    name: string;
    original: string;
    version: string;
  } | null>(null);
  const [storeStatus, setStoreStatus] = useState<
    "confirmed" | "pending" | "retired" | "historical"
  >("confirmed");
  const directory = useQuery({
    queryKey: ["directory", orgId, enterprise],
    queryFn: () =>
      directoryApi.directory(client, {
        enterpriseKey: enterprise,
        management: true,
      }),
    enabled: !!session && !!enterprise,
    retry: false,
  });
  const employees = useQuery({
    queryKey: [
      "directory-employees",
      orgId,
      enterprise,
      status,
      search,
      departmentFilter,
      storeFilter,
      cursor,
    ],
    queryFn: () =>
      directoryApi.employees(client, {
        enterpriseKey: enterprise,
        status,
        ...(search ? { search } : {}),
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
        ...(storeFilter ? { storeId: storeFilter } : {}),
        ...(cursor ? { cursor } : {}),
        limit: 100,
      }),
    enabled: !!session && !!enterprise && tab === "employees",
    retry: false,
  });
  const createInputIssue = departmentNameInputIssue(departmentNameDraft);
  const createNameCheck = useDepartmentNameCheck(
    client,
    enterprise,
    session && enterprise && tab === "departments" && createInputIssue === null
      ? departmentNameDraft
      : null,
    directory.dataUpdatedAt,
  );
  const renameInputIssue =
    rename?.kind === "department"
      ? departmentNameInputIssue(rename.name)
      : null;
  const renameNameCheck = useDepartmentNameCheck(
    client,
    enterprise,
    session &&
      enterprise &&
      rename?.kind === "department" &&
      rename.name !== rename.original &&
      renameInputIssue === null
      ? rename.name
      : null,
    directory.dataUpdatedAt,
    rename?.kind === "department" ? rename.id : undefined,
  );
  if (!session) return null;
  const reload = async () => {
    await Promise.all([directory.refetch(), employees.refetch()]);
  };
  const run = async (
    action: () => Promise<unknown>,
    after?: (result: unknown) => void,
    actionKey = "employee-save",
    departmentNameSubmission?: Pick<
      DepartmentNameConflict,
      "name" | "departmentId"
    >,
  ) => {
    setPendingAction(actionKey);
    setError(null);
    setSuccess("");
    setCreatedUid("");
    try {
      const result = await action();
      setSuccess(L(["操作已完成", "Operation completed"]));
      after?.(result);
      await reload();
    } catch (e) {
      if (
        departmentNameSubmission &&
        e instanceof WebApiError &&
        e.code === "DIRECTORY_DUPLICATE_NAME"
      ) {
        setDuplicateNameError({
          orgId,
          enterprise,
          ...departmentNameSubmission,
        });
        await reload();
        return;
      }
      setError(e);
      if (
        e instanceof WebApiError &&
        (e.status === 409 || e.code === "DIRECTORY_CONFLICT")
      ) {
        setConflict(true);
        await reload();
      }
    } finally {
      setPendingAction(null);
    }
  };
  const startEdit = (e: Employee) => {
    if (
      draft &&
      !window.confirm(
        L([
          "放弃当前草稿并编辑另一条记录？",
          "Discard the current draft and edit another record?",
        ]),
      )
    )
      return;
    setEditing(e);
    setDraft({
      name: e.name,
      departmentId: e.departmentId,
      ownership: e.scope.ownership,
      storeId: e.scope.storeId ?? "",
      status: e.status,
    });
    setConflict(false);
    setError(null);
  };
  const departureAssignmentChanged = !!(
    editing &&
    draft &&
    draft.status === "departed" &&
    (draft.departmentId !== editing.departmentId ||
      draft.ownership !== editing.scope.ownership ||
      draft.storeId !== (editing.scope.storeId ?? ""))
  );
  const save = () => {
    if (!draft || !draft.ownership || departureAssignmentChanged) return;
    const scope =
      draft.ownership === "group"
        ? { ownership: "group" as const, storeId: null }
        : { ownership: "store" as const, storeId: draft.storeId };
    if (
      editing &&
      (editing.scope.ownership !== scope.ownership ||
        editing.scope.storeId !== scope.storeId) &&
      !window.confirm(
        L([
          `确认调动：${editing.scope.storeName ?? "集团直属"} → ${scope.ownership === "group" ? "集团直属" : directory.data?.stores.find((s) => s.storeId === scope.storeId)?.name}`,
          `Confirm transfer from ${editing.scope.storeName ?? "Group"} to ${scope.ownership === "group" ? "Group" : directory.data?.stores.find((s) => s.storeId === scope.storeId)?.name}`,
        ]),
      )
    )
      return;
    if (
      editing &&
      editing.status === "active" &&
      draft.status === "departed" &&
      !window.confirm(
        L([
          "标记离职后，员工档案会保留，并从默认在职名单移除。SMEDC 登录账号和访问权限不会因此改变。",
          "The record remains and leaves the active list. SMEDC account access is unchanged.",
        ]),
      )
    )
      return;
    const base = {
      enterpriseKey: enterprise,
      name: draft.name,
      departmentId: draft.departmentId,
      scope,
    };
    void run(
      () =>
        editing
          ? directoryApi.update(client, {
              ...base,
              employeeUid: editing.employeeUid,
              expectedVersion: editing.version,
              status: draft.status,
            })
          : directoryApi.create(client, base),
      (result) => {
        if (
          !editing &&
          result &&
          typeof result === "object" &&
          "employeeUid" in result
        )
          setCreatedUid(String(result.employeeUid));
        setDraft(null);
        setEditing(null);
      },
    );
  };
  const current =
    editing &&
    employees.data?.employees.find(
      (e) => e.employeeUid === editing.employeeUid,
    );
  const departments = directory.data?.departments ?? [];
  const departmentNameMessage = (issue: DepartmentNameIssue) => {
    switch (issue) {
      case "empty":
        return L(["请输入部门名称", "Enter a department name"]);
      case "whitespace":
        return L([
          "部门名称不能以空白开头或结尾",
          "Department name cannot start or end with whitespace",
        ]);
      case "tooLong":
        return L([
          "部门名称不能超过 255 个字符",
          "Department name cannot exceed 255 characters",
        ]);
      case "duplicate":
        return L(["该部门名称已存在", "This department name already exists"]);
    }
  };
  const nameConflict = (name: string, departmentId: string | null) =>
    duplicateNameError?.orgId === orgId &&
    duplicateNameError.enterprise === enterprise &&
    duplicateNameError.name === name &&
    duplicateNameError.departmentId === departmentId;
  const isDuplicateName = (
    name: string,
    departmentId: string | null,
    check: ReturnType<typeof useDepartmentNameCheck>,
  ) =>
    nameConflict(name, departmentId) ||
    check.duplicate ||
    (!check.available &&
      departments.some(
        (d) => d.departmentId !== departmentId && d.name === name,
      ));
  const createNameIssue =
    createInputIssue ??
    (isDuplicateName(departmentNameDraft, null, createNameCheck)
      ? "duplicate"
      : null);
  const renameNameIssue =
    rename?.kind === "department"
      ? (renameInputIssue ??
        (isDuplicateName(rename.name, rename.id, renameNameCheck)
          ? "duplicate"
          : null))
      : null;
  const createNameError =
    departmentNameDraft && createNameIssue
      ? departmentNameMessage(createNameIssue)
      : null;
  const renameNameError = renameNameIssue
    ? departmentNameMessage(renameNameIssue)
    : null;
  const canCreateDepartment =
    createNameIssue === null && createNameCheck.available;
  const canRenameDepartment =
    renameNameIssue === null && renameNameCheck.available;
  const nameCheckFailure = (check: ReturnType<typeof useDepartmentNameCheck>) =>
    check.error && (
      <div>
        <p role="alert" className={styles.error}>
          {L(["无法检查部门名称。", "Unable to check the department name."])}
        </p>
        <button type="button" onClick={() => void check.retry()}>
          {L(["重试检查", "Retry name check"])}
        </button>
      </div>
    );
  const changeStore = (operation: DirectoryManageStoreBody["operation"]) =>
    void run(
      () =>
        directoryApi.store(client, { enterpriseKey: enterprise, operation }),
      undefined,
      `store:${"storeId" in operation ? operation.storeId : "new"}:${operation.kind}`,
    );
  const changeDepartment = (
    operation: DirectoryManageDepartmentBody["operation"],
  ) =>
    void run(
      () =>
        directoryApi.department(client, {
          enterpriseKey: enterprise,
          operation,
        }),
      undefined,
      `department:${"departmentId" in operation ? operation.departmentId : "new"}:${operation.kind}`,
    );
  return (
    <PageFrame title={L(["企业资料", "Enterprise directory"])} icon="building">
      <div className={styles.stack}>
        <label className={styles.field}>
          {L(["当前业务企业", "Current enterprise"])}
          <select
            value={enterprise}
            onChange={(e) => {
              if (
                (draft || rename || storeNameDraft || departmentNameDraft) &&
                !window.confirm(
                  L([
                    "切换企业会放弃当前草稿，继续吗？",
                    "Switching enterprise discards the current draft. Continue?",
                  ]),
                )
              )
                return;
              setSelected(e.target.value);
              setDraft(null);
              setEditing(null);
              setRename(null);
              setStoreNameDraft("");
              setDepartmentNameDraft("");
              setDuplicateNameError(null);
              setCursor("");
            }}
          >
            {(enterprises.data?.enterprises ?? []).map((e) => (
              <option key={e.enterpriseKey} value={e.enterpriseKey}>
                {e.enterpriseName}
              </option>
            ))}
          </select>
        </label>
        {enterprises.isError && (
          <p role="alert" className={styles.error}>
            {L(["无法读取业务企业", "Unable to load enterprises"])}
          </p>
        )}
        {!enterprise && (
          <p>{L(["请先登记业务企业。", "Register an enterprise first."])}</p>
        )}
        <div
          className={styles.tabs}
          role="group"
          aria-label={L(["企业资料", "Enterprise directory"])}
        >
          {(["employees", "stores", "departments"] as const).map((key, i) => (
            <button
              type="button"
              key={key}
              aria-pressed={tab === key}
              onClick={() => {
                setTab(key);
                setDuplicateNameError(null);
              }}
            >
              {
                [
                  L(["员工档案", "Employees"]),
                  L(["门店目录", "Stores"]),
                  L(["部门目录", "Departments"]),
                ][i]
              }
            </button>
          ))}
        </div>
        {(directory.isError || error !== null) && (
          <p role="alert" className={styles.error}>
            {error instanceof WebApiError && error.code === "DIRECTORY_IN_USE"
              ? L([
                  "仍有在职员工归属，请联系有权限的人员处理。",
                  "Active employees remain assigned. Contact an authorized administrator.",
                ])
              : conflict
                ? L([
                    "数据已变化，草稿保留。请比较最新数据并确认后继续。",
                    "The record changed. Your draft is retained; compare and confirm before continuing.",
                  ])
                : L([
                    "操作失败，请检查权限或重试。",
                    "Operation failed. Check access or retry.",
                  ])}
          </p>
        )}
        {success && <p role="status">{success}</p>}
        {createdUid && (
          <p>
            {L(["员工档案标识", "Employee ID"])}: <code>{createdUid}</code>{" "}
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(createdUid)}
            >
              {L(["复制标识", "Copy ID"])}
            </button>
          </p>
        )}
        {rename &&
          tab === (rename.kind === "store" ? "stores" : "departments") &&
          (() => {
            const latest =
              rename.kind === "store"
                ? directory.data?.stores.find((s) => s.storeId === rename.id)
                : directory.data?.departments.find(
                    (d) => d.departmentId === rename.id,
                  );
            return (
              <section className={`${styles.panel} ${styles.stack}`}>
                <h2>{L(["修改名称", "Rename"])}</h2>
                <label className={styles.field}>
                  {L(["新名称", "New name"])}
                  <input
                    value={rename.name}
                    aria-invalid={renameNameError !== null}
                    onChange={(e) => {
                      setRename({ ...rename, name: e.target.value });
                      setDuplicateNameError(null);
                    }}
                  />
                </label>
                {renameNameError !== null && (
                  <p role="alert" className={styles.error}>
                    {renameNameError}
                  </p>
                )}
                {rename.kind === "department" &&
                  nameCheckFailure(renameNameCheck)}
                {conflict && (
                  <div>
                    <p>
                      {L(["最新名称", "Latest name"])}:{" "}
                      {latest?.name ?? L(["不可读取", "Unavailable"])}
                    </p>
                    {latest && (
                      <button
                        type="button"
                        onClick={() => {
                          setRename({
                            ...rename,
                            original: latest.name,
                            version: latest.version,
                          });
                          setConflict(false);
                        }}
                      >
                        {L([
                          "已比较，使用最新版本继续",
                          "Compared; continue with latest version",
                        ])}
                      </button>
                    )}
                  </div>
                )}
                <div className={styles.row}>
                  <ActionButton
                    label={L(["保存", "Save"])}
                    busy={
                      pendingAction === "rename-save" ||
                      renameNameCheck.checking
                    }
                    disabled={
                      busy ||
                      conflict ||
                      (rename.kind === "department"
                        ? !canRenameDepartment
                        : !rename.name.trim()) ||
                      rename.name === rename.original
                    }
                    onRun={() => {
                      if (rename.kind === "department" && !canRenameDepartment)
                        return;
                      setDuplicateNameError(null);
                      const operation =
                        rename.kind === "store"
                          ? () =>
                              directoryApi.store(client, {
                                enterpriseKey: enterprise,
                                operation: {
                                  kind: "rename",
                                  storeId: rename.id,
                                  expectedVersion: rename.version,
                                  name: rename.name,
                                },
                              })
                          : () =>
                              directoryApi.department(client, {
                                enterpriseKey: enterprise,
                                operation: {
                                  kind: "rename",
                                  departmentId: rename.id,
                                  expectedVersion: rename.version,
                                  name: rename.name,
                                },
                              });
                      void run(
                        operation,
                        () => setRename(null),
                        "rename-save",
                        rename.kind === "department"
                          ? { departmentId: rename.id, name: rename.name }
                          : undefined,
                      );
                    }}
                  />
                  <button type="button" onClick={() => setRename(null)}>
                    {L(["取消", "Cancel"])}
                  </button>
                </div>
              </section>
            );
          })()}
        {enterprise && tab === "employees" && (
          <div className={styles.catalog}>
            <p className={styles.scopeHint}>
              {employees.data?.access === "none"
                ? L([
                    "当前没有员工档案读取权限。仍可尝试新增。",
                    "No employee read access. You may still create a record.",
                  ])
                : employees.data?.access === "partial"
                  ? L([
                      "仅显示当前获准范围内的员工。",
                      "Showing only your authorized scope.",
                    ])
                  : L([
                      "显示当前获准范围内的员工。",
                      "Showing your authorized scope.",
                    ])}
            </p>
            <div className={styles.employeeFilters}>
              <label className={styles.field}>
                {L(["姓名", "Name"])}
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCursor("");
                  }}
                />
              </label>
              <label className={styles.field}>
                {L(["状态", "Status"])}
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as "active" | "departed");
                    setCursor("");
                  }}
                >
                  <option value="active">{L(["在职", "Active"])}</option>
                  <option value="departed">{L(["离职", "Departed"])}</option>
                </select>
              </label>
              <label className={styles.field}>
                {L(["部门", "Department"])}
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setCursor("");
                  }}
                >
                  <option value="">{L(["全部", "All"])}</option>
                  {directory.data?.departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                {L(["门店", "Store"])}
                <select
                  value={storeFilter}
                  onChange={(e) => {
                    setStoreFilter(e.target.value);
                    setCursor("");
                  }}
                >
                  <option value="">{L(["全部", "All"])}</option>
                  {directory.data?.stores.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <ActionButton
                icon={<AdminIcon name="plus" />}
                label={L(["新增员工", "Add employee"])}
                onRun={() => {
                  if (
                    draft &&
                    !window.confirm(
                      L([
                        "放弃当前草稿并新增？",
                        "Discard the current draft and add a record?",
                      ]),
                    )
                  )
                    return;
                  setEditing(null);
                  setDraft(blank);
                  setConflict(false);
                }}
              />
            </div>
            {employees.isError && (
              <p role="alert">
                {L(["无法读取员工档案。", "Unable to load employees."])}
              </p>
            )}
            {employees.data?.access !== "none" &&
              employees.data?.employees.length === 0 && (
                <p>
                  {L(["当前筛选没有结果。", "No records match these filters."])}
                </p>
              )}
            {draft && (
              <section className={`${styles.stack} ${styles.panel}`}>
                <h2 ref={employeeHeading} tabIndex={-1}>
                  {editing
                    ? L(["编辑员工", "Edit employee"])
                    : L(["新增员工", "Add employee"])}
                </h2>
                <label className={styles.field}>
                  {L(["姓名", "Name"])}
                  <input
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </label>
                <label className={styles.field}>
                  {L(["部门", "Department"])}
                  <select
                    value={draft.departmentId}
                    onChange={(e) =>
                      setDraft({ ...draft, departmentId: e.target.value })
                    }
                  >
                    <option value="">{L(["请选择", "Choose"])}</option>
                    {directory.data?.departments
                      .filter((d) => d.status === "active")
                      .map((d) => (
                        <option key={d.departmentId} value={d.departmentId}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className={styles.field}>
                  {L(["归属", "Assignment"])}
                  <select
                    value={draft.ownership}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ownership: e.target.value as Draft["ownership"],
                        storeId: "",
                      })
                    }
                  >
                    <option value="">{L(["请选择", "Choose"])}</option>
                    <option value="group">{L(["集团直属", "Group"])}</option>
                    <option value="store">{L(["门店", "Store"])}</option>
                  </select>
                </label>
                {draft.ownership === "store" && (
                  <label className={styles.field}>
                    {L(["门店", "Store"])}
                    <select
                      value={draft.storeId}
                      onChange={(e) =>
                        setDraft({ ...draft, storeId: e.target.value })
                      }
                    >
                      <option value="">{L(["请选择", "Choose"])}</option>
                      {directory.data?.stores
                        .filter((s) => s.status === "confirmed")
                        .map((s) => (
                          <option key={s.storeId} value={s.storeId}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {editing && (
                  <label className={styles.field}>
                    {L(["状态", "Status"])}
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          status: e.target.value as Draft["status"],
                        })
                      }
                    >
                      <option value="active">{L(["在职", "Active"])}</option>
                      <option value="departed">
                        {L(["离职", "Departed"])}
                      </option>
                    </select>
                  </label>
                )}
                {departureAssignmentChanged && (
                  <p>
                    {L([
                      "离职时保留原归属；请先单独保存调动，或恢复原归属。",
                      "Departure retains the original assignment; save the transfer separately or restore the original assignment.",
                    ])}
                  </p>
                )}
                {conflict && (
                  <div>
                    <p>
                      {L(["最新记录", "Latest record"])}:{" "}
                      {current
                        ? `${current.name} / ${current.departmentName} / ${current.scope.storeName ?? L(["集团直属", "Group"])} / ${current.status}`
                        : L([
                            "无法在当前范围读取",
                            "Not visible in current scope",
                          ])}
                    </p>
                    {current && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(current);
                          setConflict(false);
                        }}
                      >
                        {L([
                          "已比较，使用最新版本继续",
                          "Compared; continue with latest version",
                        ])}
                      </button>
                    )}
                  </div>
                )}
                <div className={styles.row}>
                  <ActionButton
                    label={L(["保存", "Save"])}
                    busy={pendingAction === "employee-save"}
                    disabled={
                      busy ||
                      conflict ||
                      departureAssignmentChanged ||
                      (editing !== null &&
                        draft.name === editing.name &&
                        draft.departmentId === editing.departmentId &&
                        draft.ownership === editing.scope.ownership &&
                        draft.storeId === (editing.scope.storeId ?? "") &&
                        draft.status === editing.status) ||
                      !draft.name.trim() ||
                      !draft.departmentId ||
                      !draft.ownership ||
                      (draft.ownership === "store" && !draft.storeId)
                    }
                    onRun={save}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setEditing(null);
                    }}
                  >
                    {L(["取消", "Cancel"])}
                  </button>
                </div>
              </section>
            )}
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{L(["姓名", "Name"])}</th>
                    <th>{L(["归属", "Assignment"])}</th>
                    <th>{L(["部门", "Department"])}</th>
                    <th>{L(["状态", "Status"])}</th>
                    <th>{L(["操作", "Actions"])}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.data?.employees.map((e) => (
                    <tr key={e.employeeUid}>
                      <td>
                        <span className={styles.employeeName}>
                          <span className={styles.employeeIcon}>
                            <AdminIcon name="person" />
                          </span>
                          {e.name}
                        </span>
                      </td>
                      <td>{e.scope.storeName ?? L(["集团直属", "Group"])}</td>
                      <td>{e.departmentName}</td>
                      <td>
                        <span
                          className={
                            e.status === "active"
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }
                        >
                          {e.status === "active"
                            ? L(["在职", "Active"])
                            : L(["离职", "Departed"])}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          className={styles.rowAction}
                          onClick={() => startEdit(e)}
                        >
                          <AdminIcon name="edit" />
                          {L(["编辑", "Edit"])}
                        </Button>
                        <Button
                          variant="ghost"
                          className={styles.rowAction}
                          onClick={() =>
                            void navigator.clipboard.writeText(e.employeeUid)
                          }
                        >
                          {L(["复制标识", "Copy ID"])}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {employees.data?.nextCursor && (
              <button
                type="button"
                onClick={() => setCursor(employees.data!.nextCursor!)}
              >
                {L(["下一页", "Next page"])}
              </button>
            )}
            {cursor && (
              <button type="button" onClick={() => setCursor("")}>
                {L(["返回首页", "First page"])}
              </button>
            )}
          </div>
        )}
        {enterprise && tab === "stores" && (
          <div className={styles.catalog}>
            <div className={styles.row}>
              {(["confirmed", "pending", "retired", "historical"] as const).map(
                (s) => (
                  <button
                    type="button"
                    key={s}
                    aria-pressed={storeStatus === s}
                    onClick={() => setStoreStatus(s)}
                  >
                    {s === "confirmed"
                      ? L(["正式门店", "Confirmed"])
                      : s === "pending"
                        ? L(["待确认", "Pending"])
                        : s === "retired"
                          ? L(["已停用", "Retired"])
                          : L(["历史记录", "Historical"])}
                  </button>
                ),
              )}
            </div>
            <div className={styles.createRow}>
              <label className={styles.field}>
                {L(["新门店名称", "New store name"])}
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <ActionButton
                icon={<AdminIcon name="plus" />}
                label={L(["新增门店", "Add store"])}
                busy={pendingAction === "store-create"}
                disabled={busy || !newName.trim()}
                onRun={() => {
                  const name = newName;
                  void run(
                    () =>
                      directoryApi.store(client, {
                        enterpriseKey: enterprise,
                        operation: { kind: "create", name },
                      }),
                    () => setNewName(""),
                    "store-create",
                  );
                }}
              />
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{L(["名称", "Name"])}</th>
                    <th>{L(["操作", "Actions"])}</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.data?.stores
                    .filter((s) => s.status === storeStatus)
                    .map((s) => (
                      <tr key={s.storeId}>
                        <td>{s.name}</td>
                        <td>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setConflict(false);
                              setRename({
                                kind: "store",
                                id: s.storeId,
                                name: s.name,
                                original: s.name,
                                version: s.version,
                              });
                            }}
                          >
                            {L(["改名", "Rename"])}
                          </button>
                          {s.status === "pending" && (
                            <>
                              <ActionButton
                                label={L(["确认", "Confirm"])}
                                busy={
                                  pendingAction === `store:${s.storeId}:confirm`
                                }
                                disabled={busy}
                                onRun={() =>
                                  changeStore({
                                    kind: "confirm",
                                    storeId: s.storeId,
                                    expectedVersion: s.version,
                                  })
                                }
                              />
                              <ActionButton
                                label={L(["保留历史", "Keep historical"])}
                                busy={
                                  pendingAction ===
                                  `store:${s.storeId}:historical`
                                }
                                disabled={busy}
                                onRun={() => {
                                  if (
                                    window.confirm(
                                      L([
                                        "保留为历史记录？",
                                        "Keep as historical?",
                                      ]),
                                    )
                                  )
                                    changeStore({
                                      kind: "historical",
                                      storeId: s.storeId,
                                      expectedVersion: s.version,
                                    });
                                }}
                              />
                            </>
                          )}
                          {(s.status === "confirmed" ||
                            s.status === "retired") && (
                            <ActionButton
                              label={
                                s.status === "retired"
                                  ? L(["恢复", "Restore"])
                                  : L(["停用", "Retire"])
                              }
                              busy={
                                pendingAction ===
                                `store:${s.storeId}:${s.status === "retired" ? "restore" : "retire"}`
                              }
                              disabled={busy}
                              onRun={() => {
                                const kind =
                                  s.status === "retired" ? "restore" : "retire";
                                if (
                                  window.confirm(
                                    kind === "retire"
                                      ? L([
                                          "确定停用门店？",
                                          "Retire this store?",
                                        ])
                                      : L([
                                          "确定恢复门店？",
                                          "Restore this store?",
                                        ]),
                                  )
                                )
                                  changeStore({
                                    kind,
                                    storeId: s.storeId,
                                    expectedVersion: s.version,
                                  });
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {enterprise && tab === "departments" && (
          <div className={styles.catalog}>
            <div className={styles.createRow}>
              <label className={styles.field}>
                {L(["新部门名称", "New department name"])}
                <input
                  value={newName}
                  aria-invalid={createNameError !== null}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setDuplicateNameError(null);
                  }}
                />
              </label>
              <ActionButton
                icon={<AdminIcon name="plus" />}
                label={L(["新增部门", "Add department"])}
                busy={
                  pendingAction === "department-create" ||
                  createNameCheck.checking
                }
                disabled={busy || !canCreateDepartment}
                onRun={() => {
                  if (!canCreateDepartment) return;
                  setDuplicateNameError(null);
                  const name = newName;
                  void run(
                    () =>
                      directoryApi.department(client, {
                        enterpriseKey: enterprise,
                        operation: { kind: "create", name },
                      }),
                    () => setNewName(""),
                    "department-create",
                    { departmentId: null, name },
                  );
                }}
              />
            </div>
            {createNameError !== null && (
              <p role="alert" className={styles.error}>
                {createNameError}
              </p>
            )}
            {nameCheckFailure(createNameCheck)}
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{L(["名称", "Name"])}</th>
                    <th>{L(["状态", "Status"])}</th>
                    <th>{L(["操作", "Actions"])}</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.data?.departments.map((d) => (
                    <tr key={d.departmentId}>
                      <td>{d.name}</td>
                      <td>
                        {d.status === "active"
                          ? L(["有效", "Active"])
                          : L(["已停用", "Retired"])}
                      </td>
                      <td>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setConflict(false);
                            setDuplicateNameError(null);
                            setRename({
                              kind: "department",
                              id: d.departmentId,
                              name: d.name,
                              original: d.name,
                              version: d.version,
                            });
                          }}
                        >
                          {L(["改名", "Rename"])}
                        </button>
                        <ActionButton
                          label={
                            d.status === "active"
                              ? L(["停用", "Retire"])
                              : L(["恢复", "Restore"])
                          }
                          busy={
                            pendingAction ===
                            `department:${d.departmentId}:${d.status === "active" ? "retire" : "restore"}`
                          }
                          disabled={busy}
                          onRun={() => {
                            const kind =
                              d.status === "active" ? "retire" : "restore";
                            if (
                              window.confirm(
                                kind === "retire"
                                  ? L([
                                      "确定停用部门？",
                                      "Retire this department?",
                                    ])
                                  : L([
                                      "确定恢复部门？",
                                      "Restore this department?",
                                    ]),
                              )
                            )
                              changeDepartment({
                                kind,
                                departmentId: d.departmentId,
                                expectedVersion: d.version,
                              });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
