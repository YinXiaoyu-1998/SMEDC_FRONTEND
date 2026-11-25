import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";

import { inspectionsDayQuerySchema } from "@/api/generated/contract";
import { useSession } from "@/api/session";
import { singleEnterpriseKey } from "@/features/singleEnterpriseKey";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";

import {
  context,
  day,
  isAccessError,
  type Scope,
  type Sheet,
} from "./employeeApi";
import {
  prunePhotoChoices,
  REUSABLE_PHOTO_LIMIT,
  type ReusablePhoto,
} from "./employeeDraft";
import { errorText, useEmployeeText } from "./employeeText";
import { InspectionFrame } from "./InspectionFrame";
import { SheetEditor, Summary } from "./SheetEditor";
import { SheetTarget } from "./SheetTarget";
import { TemplateEntry } from "./TemplateEntry";
import styles from "./Employee.module.css";

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function InspectionsPage() {
  const { t } = useText();
  const session = useSession().data;
  return (
    <InspectionFrame title={t("pages.inspections.title")}>
      {session?.canReadInspections && (
        <ScopePicker
          key={JSON.stringify([
            session.identity.orgId,
            session.identity.userAccountId,
          ])}
          orgId={session.identity.orgId}
          csrfToken={session.csrfToken}
          identityKey={JSON.stringify([
            session.identity.orgId,
            session.identity.userAccountId,
          ])}
        />
      )}
    </InspectionFrame>
  );
}

function useContextPages(identityKey: string, enterpriseKey?: string) {
  return useInfiniteQuery({
    queryKey: ["inspection-employee", identityKey, "context", enterpriseKey],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      context(
        {
          ...(enterpriseKey === undefined ? {} : { enterpriseKey }),
          cursor: pageParam,
        },
        signal,
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: enterpriseKey !== "",
    retry: false,
  });
}

function ScopePicker({
  orgId,
  csrfToken,
  identityKey,
}: {
  orgId: string;
  csrfToken: string;
  identityKey: string;
}) {
  const t = useEmployeeText();
  const [selectedEnterprise, setEnterprise] = useState<string>();
  const [storeId, setStore] = useState("");
  const [search] = useSearchParams();
  const dateFromUrl = search.get("date");
  const [inspectionDate, setDate] = useState(() =>
    dateFromUrl &&
    inspectionsDayQuerySchema.shape.inspectionDate.safeParse(dateFromUrl)
      .success
      ? dateFromUrl
      : today(),
  );
  const enterpriseList = useContextPages(identityKey);
  const contextItems =
    enterpriseList.data?.pages.flatMap(({ items }) => items) ?? [];
  const enterprises = contextItems.filter(
    (item) => item.kind === "enterprise" && item.canReadInspections,
  );
  // The context API lists all enterprises before the first store.
  const hasMoreEnterprises =
    enterpriseList.hasNextPage &&
    !contextItems.some((item) => item.kind === "store");
  const enterpriseKey =
    selectedEnterprise ??
    (hasMoreEnterprises || isAccessError(enterpriseList.error)
      ? ""
      : singleEnterpriseKey(enterprises));
  const storeList = useContextPages(identityKey, enterpriseKey);

  const stores =
    storeList.data?.pages.flatMap(({ items }) =>
      items.filter((item) => item.kind === "store" && item.canReadInspections),
    ) ?? [];
  const allowedStore =
    !isAccessError(enterpriseList.error) &&
    !isAccessError(storeList.error) &&
    enterprises.some((item) => item.enterpriseKey === enterpriseKey) &&
    stores.some((item) => item.kind === "store" && item.storeId === storeId);
  const scope = inspectionsDayQuerySchema.safeParse({
    enterpriseKey,
    storeId,
    inspectionDate,
  });
  const listError = enterpriseList.error ?? storeList.error;

  return (
    <div className={styles.workspace}>
      <div className={styles.filters}>
        <div>
          <Field label={t("enterprise")}>
            <select
              value={enterpriseKey}
              onChange={(event) => {
                setEnterprise(event.target.value);
                setStore("");
              }}
            >
              <option value="">{t("choose")}</option>
              {enterprises.map((item) => (
                <option key={item.enterpriseKey} value={item.enterpriseKey}>
                  {item.enterpriseName}
                </option>
              ))}
            </select>
          </Field>
          {hasMoreEnterprises && (
            <ActionButton
              label={t("loadMore")}
              variant="secondary"
              busy={enterpriseList.isFetchingNextPage}
              onRun={() => void enterpriseList.fetchNextPage()}
            />
          )}
        </div>
        <div>
          <Field label={t("store")}>
            <select
              value={storeId}
              disabled={!enterpriseKey}
              onChange={(event) => {
                setEnterprise(enterpriseKey);
                setStore(event.target.value);
              }}
            >
              <option value="">{t("choose")}</option>
              {stores.map(
                (item) =>
                  item.kind === "store" && (
                    <option key={item.storeId} value={item.storeId}>
                      {item.officialName}
                      {item.retired ? ` · ${t("retired")}` : ""}
                    </option>
                  ),
              )}
            </select>
          </Field>
          {storeList.hasNextPage && (
            <ActionButton
              label={t("loadMore")}
              variant="secondary"
              busy={storeList.isFetchingNextPage}
              onRun={() => void storeList.fetchNextPage()}
            />
          )}
        </div>
        <div>
          <Field label={t("date")}>
            <input
              type="date"
              value={inspectionDate}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
        </div>
      </div>
      {listError && (
        <div className={styles.row}>
          <p role="alert">{t(errorText(listError))}</p>
          <ActionButton
            label={t("retry")}
            variant="secondary"
            onRun={() => {
              if (enterpriseList.error) void enterpriseList.refetch();
              if (storeList.error) void storeList.refetch();
            }}
          />
        </div>
      )}
      {enterpriseList.isPending ||
      (enterpriseKey !== "" && storeList.isPending) ? (
        <p role="status">{t("loading")}</p>
      ) : allowedStore && scope.success ? (
        <InspectionDay
          key={JSON.stringify(scope.data)}
          scope={scope.data}
          orgId={orgId}
          csrfToken={csrfToken}
          identityKey={identityKey}
        />
      ) : (
        <p className={styles.muted}>
          {(!hasMoreEnterprises && enterprises.length === 0) ||
          (enterpriseKey && !storeList.hasNextPage && stores.length === 0)
            ? t("unavailable")
            : t("chooseScope")}
        </p>
      )}
    </div>
  );
}

function InspectionDay({
  scope,
  orgId,
  csrfToken,
  identityKey,
}: {
  scope: Scope;
  orgId: string;
  csrfToken: string;
  identityKey: string;
}) {
  const t = useEmployeeText();
  const [selected, select] = useState<string>();
  const [selection, setSelection] = useState<{ key: string; id: string }>();
  const [creating, setCreating] = useState<string>();
  const [photoScope, setPhotoScope] = useState<{
    allowed: boolean;
    photos: ReusablePhoto[];
  }>({
    allowed: false,
    photos: [],
  });
  const forgetPhotos = useCallback(
    () =>
      setPhotoScope((old) =>
        old.photos.length ? { ...old, photos: [] } : old,
      ),
    [],
  );
  const rememberPhotos = useCallback((sheet: Sheet) => {
    setPhotoScope((old) => {
      if (!old.allowed) return old;
      const photos = prunePhotoChoices(old.photos, sheet);
      return photos === old.photos ? old : { ...old, photos };
    });
  }, []);
  const markPhoto = (photo: ReusablePhoto) => {
    setPhotoScope((old) =>
      old.allowed
        ? {
            ...old,
            photos: [
              ...old.photos.filter(({ photoId }) => photoId !== photo.photoId),
              photo,
            ].slice(-REUSABLE_PHOTO_LIMIT),
          }
        : old,
    );
  };
  const access = useQuery({
    queryKey: ["inspection-employee", identityKey, "scope", scope],
    queryFn: ({ signal }) => context(scope, signal),
    gcTime: 0,
    retry: false,
  });
  const preflight = access.data?.preflight;
  const allowRead =
    preflight?.canReadInspections === true &&
    preflight.enterpriseKey === scope.enterpriseKey &&
    preflight.storeId === scope.storeId &&
    preflight.inspectionDate === scope.inspectionDate &&
    !isAccessError(access.error);
  const allowWrite = preflight?.canFillInspections === true && allowRead;
  const dayList = useInfiniteQuery({
    queryKey: ["inspection-employee", identityKey, "day", scope],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => day(scope, pageParam, signal),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: allowRead,
    retry: false,
  });
  const canReusePhotos = allowWrite && !access.error && !dayList.error;
  // Throw away photo choices before rendering a changed or uncertain access state.
  if (photoScope.allowed !== canReusePhotos)
    setPhotoScope({ allowed: canReusePhotos, photos: [] });
  const entries = dayList.data?.pages.flatMap((page) => page.items) ?? [];
  const templates = entries.filter((entry) => entry.kind === "template");
  const sheets = entries.filter((entry) => entry.kind === "sheet");
  const refresh = () => {
    void access.refetch();
    void dayList.refetch();
  };

  if (!access.isPending && !allowRead) {
    return (
      <div className={styles.row}>
        <p role="status">
          {t(
            access.error && !isAccessError(access.error)
              ? errorText(access.error)
              : "unavailable",
          )}
        </p>
        <ActionButton
          label={t("retry")}
          variant="secondary"
          onRun={() => void access.refetch()}
        />
      </div>
    );
  }
  if (dayList.isPending) return <p role="status">{t("loading")}</p>;
  if (selected && !isAccessError(dayList.error))
    return (
      <SheetEditor
        key={`${selected}:${allowWrite}`}
        sheetId={selected}
        identityKey={identityKey}
        scope={scope}
        reusablePhotos={
          canReusePhotos && photoScope.allowed ? photoScope.photos : []
        }
        canReusePhotos={canReusePhotos}
        rememberPhotos={rememberPhotos}
        markPhoto={markPhoto}
        forgetPhotos={forgetPhotos}
        canFill={allowWrite}
        csrfToken={csrfToken}
        onClose={() => {
          setSelection(undefined);
          select(undefined);
        }}
        onChange={refresh}
        onVoid={() => {
          forgetPhotos();
          select(undefined);
          refresh();
        }}
      />
    );

  return (
    <>
      {!allowWrite && <p className={styles.muted}>{t("readOnly")}</p>}
      {dayList.error && (
        <div className={styles.row}>
          <p role="alert">{t(errorText(dayList.error))}</p>
          <ActionButton
            label={t("retry")}
            variant="secondary"
            onRun={refresh}
          />
        </div>
      )}
      {!isAccessError(dayList.error) && (
        <div className={styles.columns}>
          <section>
            <h2>{t("templates")}</h2>
            {scope.inspectionDate < today() && templates.length > 0 && (
              <p className={styles.muted}>{t("historical")}</p>
            )}
            {!dayList.hasNextPage && templates.length === 0 && (
              <p>{t("noTemplates")}</p>
            )}
            <ul className={styles.cards}>
              {templates.map((template) => {
                const key = JSON.stringify([
                  template.templateId,
                  template.activeRevision,
                  template.targetType,
                  allowWrite,
                ]);
                const existingStoreSheet = sheets.find(
                  (sheet) =>
                    template.targetType === "store" &&
                    sheet.templateId === template.templateId &&
                    sheet.targetType === "store" &&
                    sheet.targetId === scope.storeId,
                );
                return (
                  <TemplateEntry
                    key={key}
                    template={template}
                    scope={scope}
                    client={{ orgId, csrfToken }}
                    identityKey={identityKey}
                    allowWrite={allowWrite}
                    uncreated={
                      !dayList.hasNextPage &&
                      !sheets.some(
                        (sheet) => sheet.templateId === template.templateId,
                      )
                    }
                    existingStoreSheetId={existingStoreSheet?.sheetId}
                    selectedId={selection?.key === key ? selection.id : ""}
                    onSelect={(id) => setSelection({ key, id })}
                    busy={creating === key}
                    disabled={creating !== undefined && creating !== key}
                    onBusy={(busy) =>
                      setCreating((current) =>
                        busy ? key : current === key ? undefined : current,
                      )
                    }
                    onOpen={select}
                    onCreate={(sheetId) => {
                      select(sheetId);
                      refresh();
                    }}
                    onRefresh={refresh}
                  />
                );
              })}
            </ul>
          </section>
          <section>
            <h2>{t("sheets")}</h2>
            {!dayList.hasNextPage && sheets.length === 0 && (
              <p>{t("noSheets")}</p>
            )}
            <ul className={styles.cards}>
              {sheets.map((sheet) => (
                <li className={styles.card} key={sheet.sheetId}>
                  <h3>{sheet.templateTitle}</h3>
                  <SheetTarget sheet={sheet} />
                  <Summary data={sheet} />
                  <p className={styles.identifier}>
                    {t("sheetId")} <code>{sheet.sheetId}</code>
                  </p>
                  <ActionButton
                    label={`${t("view")} ${sheet.templateTitle}`}
                    aria-label={
                      sheet.targetType === "store"
                        ? undefined
                        : `${t("view")} ${sheet.templateTitle} · ${sheet.targetName} · ${sheet.targetId}`
                    }
                    variant="secondary"
                    disabled={creating !== undefined}
                    onRun={() => select(sheet.sheetId)}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {dayList.hasNextPage && (
        <ActionButton
          label={t("loadMore")}
          variant="secondary"
          busy={dayList.isFetchingNextPage}
          onRun={() => void dayList.fetchNextPage()}
        />
      )}
    </>
  );
}
