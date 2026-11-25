import { useInfiniteQuery } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";

import { WebApiError } from "@/api/client";
import type {
  InspectionsDayResponse,
  InspectionsSheetsCreateBody,
} from "@/api/generated/contract";
import {
  directoryApi,
  type DirectoryApiClient,
} from "@/features/directory/api";
import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";

import {
  beginWrite,
  canReplay,
  create,
  isAccessError,
  isConflict,
  isUncertain,
  type Scope,
} from "./employeeApi";
import {
  errorText,
  useEmployeeText,
  type EmployeeTextKey,
} from "./employeeText";
import styles from "./Employee.module.css";

type Template = Extract<
  InspectionsDayResponse["items"][number],
  { kind: "template" }
>;

export function TemplateEntry({
  template,
  scope,
  client,
  identityKey,
  allowWrite,
  uncreated,
  existingStoreSheetId,
  selectedId,
  onSelect,
  busy,
  disabled,
  onBusy,
  onOpen,
  onCreate,
  onRefresh,
}: {
  template: Template;
  scope: Scope;
  client: DirectoryApiClient;
  identityKey: string;
  allowWrite: boolean;
  uncreated: boolean;
  existingStoreSheetId: string | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
  busy: boolean;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onOpen: (sheetId: string) => void;
  onCreate: (sheetId: string) => void;
  onRefresh: () => void;
}) {
  const t = useEmployeeText();
  const live = useRef(false);
  useLayoutEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const [problem, setProblem] = useState<EmployeeTextKey>();
  const [attempt, setAttempt] = useState<{
    body: InspectionsSheetsCreateBody;
    startedAt: number;
  }>();
  const { targetType } = template;
  const { enterpriseKey, storeId } = scope;
  const isEmployee = targetType === "employee";
  const isDirectoryTarget = targetType !== "store";

  const directory = useInfiniteQuery({
    queryKey: [
      "inspection-targets",
      identityKey,
      targetType,
      enterpriseKey,
      ...(isEmployee ? [storeId] : []),
    ],
    enabled: allowWrite && isDirectoryTarget,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }) => {
      if (isEmployee) {
        const { access, employees, nextCursor } = await directoryApi.employees(
          client,
          { enterpriseKey, storeId, status: "active", cursor: pageParam },
          signal,
        );
        return {
          access,
          nextCursor,
          candidates: employees
            .filter(
              ({ status, scope }) =>
                status === "active" && scope.storeId === storeId,
            )
            .map(({ employeeUid, name, departmentName }) => ({
              id: employeeUid,
              label: `${name} · ${departmentName} · ${employeeUid}`,
            })),
        };
      }
      const { departments } = await directoryApi.directory(
        client,
        { enterpriseKey },
        signal,
      );
      return {
        access: "all" as const,
        nextCursor: null,
        candidates: departments
          .filter(({ status }) => status === "active")
          .map(({ departmentId, name }) => ({ id: departmentId, label: name })),
      };
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    gcTime: 0,
    retry: false,
  });
  const directoryAccess = directory.data?.pages.at(-1)?.access;
  const directoryDenied =
    isAccessError(directory.error) || directoryAccess === "none";
  const candidates = directoryDenied
    ? []
    : (directory.data?.pages.flatMap(({ candidates }) => candidates) ?? []);
  const targetId = candidates.some(({ id }) => id === selectedId)
    ? selectedId
    : "";
  const moreEmployees = isEmployee && directory.hasNextPage && !directoryDenied;
  const uncertain =
    problem === "uncertainCreate" &&
    (!isDirectoryTarget ||
      selectedId === (attempt?.body.employeeUid ?? attempt?.body.departmentId));
  const canSubmit =
    allowWrite &&
    !busy &&
    !disabled &&
    (uncertain ||
      !isDirectoryTarget ||
      (targetId !== "" && !directory.error && !directory.isFetching));

  async function createSheet() {
    if (!canSubmit) return;
    let request = uncertain ? attempt : undefined;
    if (!request) {
      const { requestId, startedAt } = beginWrite();
      request = {
        body: {
          ...scope,
          templateId: template.templateId,
          requestId,
          ...(targetType === "employee" ? { employeeUid: targetId } : {}),
          ...(targetType === "department" ? { departmentId: targetId } : {}),
        },
        startedAt,
      };
    }
    if (!canReplay(request.startedAt)) {
      setProblem("expiredCreate");
      setAttempt(undefined);
      onRefresh();
      return;
    }
    onBusy(true);
    setProblem(undefined);
    try {
      const receipt = await create(request.body, client.csrfToken);
      if (!live.current) return;
      setAttempt(undefined);
      if (receipt.status === "active") {
        onCreate(receipt.sheetId);
      } else {
        setProblem("voidedCreate");
        onRefresh();
      }
    } catch (caught) {
      if (!live.current) return;
      if (isUncertain(caught)) {
        setAttempt(request);
        setProblem("uncertainCreate");
        return;
      }
      setAttempt(undefined);
      const settingsChanged =
        caught instanceof WebApiError && caught.code === "INSPECTION_INVALID";
      const staleTarget =
        isDirectoryTarget &&
        (settingsChanged ||
          (caught instanceof WebApiError &&
            caught.code === "INSPECTION_NOT_FOUND"));
      if (staleTarget) {
        onSelect("");
        void directory.refetch();
      }
      setProblem(
        staleTarget
          ? "targetRefresh"
          : settingsChanged || isConflict(caught)
            ? "createConflict"
            : errorText(caught),
      );
      if (settingsChanged || isAccessError(caught) || isConflict(caught))
        onRefresh();
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className={styles.card}>
      <h3>{template.title}</h3>
      <p className={styles.muted}>
        {t("targetType")} · {t(targetType)}
        {uncreated && <> · {t("uncreated")}</>}
      </p>
      {existingStoreSheetId && !uncertain && !busy ? (
        <ActionButton
          label={t("openExisting")}
          variant="secondary"
          disabled={disabled}
          onRun={() => onOpen(existingStoreSheetId)}
        />
      ) : (
        allowWrite && (
          <>
            {isDirectoryTarget && (
              <>
                <div className={styles.targetPicker}>
                  <Field
                    label={t(
                      isEmployee ? "chooseEmployee" : "chooseDepartment",
                    )}
                    {...(!directoryDenied &&
                    candidates.length > 0 &&
                    targetId === ""
                      ? { hint: t("chooseTarget") }
                      : {})}
                  >
                    <select
                      value={targetId}
                      disabled={
                        busy ||
                        disabled ||
                        uncertain ||
                        directoryDenied ||
                        candidates.length === 0
                      }
                      onChange={(event) => {
                        onSelect(event.target.value);
                        setProblem(undefined);
                      }}
                    >
                      <option value="">{t("choose")}</option>
                      {candidates.map(({ id, label }) => (
                        <option value={id} key={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                {directory.isPending && <p role="status">{t("loading")}</p>}
                {directoryDenied ? (
                  <p role="alert">
                    {t(isEmployee ? "employeeDenied" : "departmentDenied")}
                  </p>
                ) : directory.error ? (
                  <p role="alert">{t("targetLoadError")}</p>
                ) : !directory.isPending &&
                  candidates.length === 0 &&
                  !moreEmployees ? (
                  <p role="status">
                    {t(
                      isEmployee
                        ? directoryAccess === "partial"
                          ? "noVisibleEmployees"
                          : "noEmployees"
                        : "noDepartments",
                    )}
                  </p>
                ) : isEmployee && directoryAccess === "partial" ? (
                  <p className={styles.muted}>{t("partialEmployees")}</p>
                ) : null}
                {directory.error && (
                  <ActionButton
                    label={t("retry")}
                    variant="secondary"
                    busy={directory.isFetching}
                    disabled={busy || disabled || uncertain}
                    onRun={() => void directory.refetch()}
                  />
                )}
                {moreEmployees && (
                  <ActionButton
                    label={t("moreEmployees")}
                    variant="secondary"
                    busy={directory.isFetchingNextPage}
                    disabled={
                      busy || disabled || uncertain || directory.isFetching
                    }
                    onRun={() => void directory.fetchNextPage()}
                  />
                )}
              </>
            )}
            <ActionButton
              label={t("create")}
              busy={busy}
              disabled={!canSubmit}
              onRun={() => void createSheet()}
            />
          </>
        )
      )}
      {problem && (problem !== "uncertainCreate" || uncertain) && (
        <p role="alert">{t(problem)}</p>
      )}
    </li>
  );
}
