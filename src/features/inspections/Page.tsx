import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";

import {
  inspectionsDayQuerySchema,
  type InspectionsSheetsCreateBody,
  type InspectionsDayResponse,
} from "@/api/generated/contract";
import { useSession } from "@/api/session";
import { PageFrame } from "@/app/PageFrame";
import { useText } from "@/i18n/useText";
import { ActionButton } from "@/ui/ActionButton";
import { Field } from "@/ui/Field";

import {
  beginWrite,
  canReplay,
  context,
  create,
  day,
  isAccessError,
  isConflict,
  isUncertain,
  type Scope,
  type Sheet,
} from "./employeeApi";
import {
  photosSeenIn,
  REUSABLE_PHOTO_LIMIT,
  type ReusablePhoto,
} from "./employeeDraft";
import { errorText, useEmployeeText } from "./employeeText";
import { SheetEditor, Summary } from "./SheetEditor";
import styles from "./Employee.module.css";

type Template = Extract<
  InspectionsDayResponse["items"][number],
  { kind: "template" }
>;

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
    <PageFrame title={t("pages.inspections.title")}>
      {session?.canReadInspections && (
        <ScopePicker
          key={JSON.stringify([
            session.identity.orgId,
            session.identity.userAccountId,
          ])}
          csrfToken={session.csrfToken}
          identityKey={JSON.stringify([
            session.identity.orgId,
            session.identity.userAccountId,
          ])}
        />
      )}
    </PageFrame>
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
  csrfToken,
  identityKey,
}: {
  csrfToken: string;
  identityKey: string;
}) {
  const t = useEmployeeText();
  const [enterpriseKey, setEnterprise] = useState("");
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
  const storeList = useContextPages(identityKey, enterpriseKey);

  const enterprises =
    enterpriseList.data?.pages.flatMap(({ items }) =>
      items.filter(
        (item) => item.kind === "enterprise" && item.canReadInspections,
      ),
    ) ?? [];
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
          {enterpriseList.hasNextPage && (
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
              onChange={(event) => setStore(event.target.value)}
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
        <Field label={t("date")}>
          <input
            type="date"
            value={inspectionDate}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
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
          csrfToken={csrfToken}
          identityKey={identityKey}
        />
      ) : (
        <p className={styles.muted}>
          {(!enterpriseList.hasNextPage && enterprises.length === 0) ||
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
  csrfToken,
  identityKey,
}: {
  scope: Scope;
  csrfToken: string;
  identityKey: string;
}) {
  const t = useEmployeeText();
  const [selected, select] = useState<string>();
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
      const combined = new Map(
        old.photos
          .filter((photo) => photo.sheetId !== sheet.sheetId)
          .map((photo) => [photo.photoId, photo]),
      );
      for (const photo of photosSeenIn(sheet)) {
        combined.delete(photo.photoId);
        combined.set(photo.photoId, photo);
      }
      return {
        ...old,
        photos: [...combined.values()].slice(-REUSABLE_PHOTO_LIMIT),
      };
    });
  }, []);
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
        forgetPhotos={forgetPhotos}
        canFill={allowWrite}
        csrfToken={csrfToken}
        onClose={() => select(undefined)}
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
              {templates.map((template) => (
                <TemplateEntry
                  key={template.templateId}
                  template={template}
                  scope={scope}
                  allowWrite={allowWrite}
                  uncreated={
                    !dayList.hasNextPage &&
                    !sheets.some(
                      (sheet) => sheet.templateId === template.templateId,
                    )
                  }
                  singleAlreadyExists={
                    template.copyMode === "single" &&
                    sheets.some(
                      (sheet) => sheet.templateId === template.templateId,
                    )
                  }
                  csrfToken={csrfToken}
                  onCreate={(sheetId) => {
                    select(sheetId);
                    refresh();
                  }}
                  onRefresh={refresh}
                />
              ))}
            </ul>
          </section>
          <section>
            <h2>{t("sheets")}</h2>
            {!dayList.hasNextPage && sheets.length === 0 && (
              <p>{t("noSheets")}</p>
            )}
            <ul className={styles.cards}>
              {sheets.map((sheet) => {
                const title = sheet.name ?? sheet.templateTitle;
                return (
                  <li className={styles.card} key={sheet.sheetId}>
                    <h3>{title}</h3>
                    {sheet.name !== null && <p>{sheet.templateTitle}</p>}
                    <Summary data={sheet} />
                    <p className={styles.identifier}>
                      {t("sheetId")} <code>{sheet.sheetId}</code>
                    </p>
                    <ActionButton
                      label={`${t("view")} ${title}`}
                      variant="secondary"
                      onRun={() => select(sheet.sheetId)}
                    />
                  </li>
                );
              })}
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

function TemplateEntry({
  template,
  scope,
  allowWrite,
  uncreated,
  singleAlreadyExists,
  csrfToken,
  onCreate,
  onRefresh,
}: {
  template: Template;
  scope: Scope;
  allowWrite: boolean;
  uncreated: boolean;
  singleAlreadyExists: boolean;
  csrfToken: string;
  onCreate: (sheetId: string) => void;
  onRefresh: () => void;
}) {
  const t = useEmployeeText();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState<{
    body: InspectionsSheetsCreateBody;
    startedAt: number;
  }>();
  const multiple = template.copyMode === "multiple";
  const uncertain = Boolean(attempt) && isUncertain(error);

  async function createSheet() {
    const { requestId, startedAt } = beginWrite();
    const request = attempt ?? {
      body: {
        ...scope,
        templateId: template.templateId,
        requestId,
        ...(multiple ? { name: name.trim() } : {}),
      },
      startedAt,
    };
    if (!canReplay(request.startedAt)) {
      setError(new Error("Expired create receipt"));
      setAttempt(undefined);
      onRefresh();
      return;
    }
    setAttempt(request);
    setBusy(true);
    setError(undefined);
    try {
      const receipt = await create(request.body, csrfToken);
      onCreate(receipt.sheetId);
    } catch (caught) {
      setError(caught);
      if (!isUncertain(caught)) setAttempt(undefined);
      if (isAccessError(caught) || isConflict(caught)) onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={styles.card}>
      <h3>{template.title}</h3>
      <p className={styles.muted}>
        {t(template.copyMode)}
        {uncreated && <> · {t("uncreated")}</>}
      </p>
      {allowWrite && (!singleAlreadyExists || uncertain) && (
        <>
          {multiple && (
            <Field label={t("name")}>
              <input
                value={name}
                maxLength={120}
                disabled={busy || uncertain}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
          )}
          <ActionButton
            label={t("create")}
            busy={busy}
            disabled={multiple && !name.trim()}
            onRun={() => void createSheet()}
          />
        </>
      )}
      {error != null && (
        <p role="alert">
          {t(
            uncertain
              ? "uncertainCreate"
              : isConflict(error)
                ? "existing"
                : errorText(error),
          )}
        </p>
      )}
    </li>
  );
}
