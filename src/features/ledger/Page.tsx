import { useEffect, useRef } from "react";
import type { FormEvent } from "react";

import type { LedgerContextResponse } from "@/api/generated/contract";
import { PageFrame } from "@/app/PageFrame";
import { ledgerPdfUrl } from "@/features/ledger/api";
import { ledgerErrorKey } from "@/features/ledger/errors";
import { formatMessage } from "@/features/ledger/messages";
import {
  formatBytes,
  hasKnownSize,
  isPendingTaskStatus,
  isReady,
  ledgerKey,
  type LedgerPartition,
  type SelectedPartition,
} from "@/features/ledger/model";
import {
  useLedgerContextQuery,
  useLedgerWorkspace,
  type BundleTask,
} from "@/features/ledger/useLedgerWorkspace";
import { useText } from "@/i18n/useText";
import type { Locale } from "@/i18n/text";
import { ActionButton } from "@/ui/ActionButton";
import { Button } from "@/ui/Button";
import { ConflictPanel } from "@/ui/ConflictPanel";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { PageSection } from "@/ui/PageSection";

import styles from "./Page.module.css";

const TASK_STATUS_KEYS: ReadonlySet<string> = new Set([
  "queued",
  "running",
  "succeeded",
  "failed",
  "partial_failed",
  "superseded",
]);

export function LedgerPage() {
  const { t } = useText();
  const contextQuery = useLedgerContextQuery();

  if (contextQuery.isPending) {
    return (
      <PageFrame title={t("pages.ledger.title")}>
        <p role="status" className={styles.muted}>
          {t("ledger.loading")}
        </p>
      </PageFrame>
    );
  }

  if (contextQuery.isError) {
    return (
      <PageFrame title={t("pages.ledger.title")}>
        <div role="alert" className={styles.loadError}>
          <p>{t("ledger.loadFailed")}</p>
          <p>{t(ledgerErrorKey(contextQuery.error))}</p>
        </div>
        <ActionButton
          label={t("ledger.retry")}
          onRun={() => {
            void contextQuery.refetch();
          }}
        />
      </PageFrame>
    );
  }

  // 身份变化（另一个账号）时整页重置，选择与任务不带到新账号名下
  return (
    <LedgerWorkspaceView
      key={`${contextQuery.data.identity.orgId}:${contextQuery.data.identity.userAccountId}`}
      context={contextQuery.data}
      refreshContext={async () => {
        const result = await contextQuery.refetch();
        if (result.data === undefined) {
          throw result.error ?? new Error("ledger context unavailable");
        }
        return result.data;
      }}
    />
  );
}

interface LedgerWorkspaceViewProps {
  readonly context: LedgerContextResponse;
  readonly refreshContext: () => Promise<LedgerContextResponse>;
}

function LedgerWorkspaceView({
  context,
  refreshContext,
}: LedgerWorkspaceViewProps) {
  const { t, locale } = useText();
  const workspace = useLedgerWorkspace({ context, refreshContext });
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const limits = context.limits;

  const readyRows = workspace.rows.filter((row) => isReady(row));
  const selectedOnPage = readyRows.filter((row) =>
    workspace.selected.has(ledgerKey(row)),
  );
  const allReadySelected =
    readyRows.length > 0 && selectedOnPage.length === readyRows.length;
  const someSelected = selectedOnPage.length > 0 && !allReadySelected;

  useEffect(() => {
    const checkbox = headerCheckboxRef.current;
    if (checkbox !== null) checkbox.indeterminate = someSelected;
  }, [someSelected]);

  const summaryText = formatMessage(t("ledger.selection.summary"), {
    files: workspace.summary.files,
    limit: limits.files,
    stores: workspace.summary.stores,
    dates: workspace.summary.dates,
  });

  let prepareDisabledReason: string | undefined;
  if (workspace.summary.files === 0) {
    prepareDisabledReason = t("ledger.prepare.disabled.empty");
  } else if (workspace.conflict !== null) {
    prepareDisabledReason = t("ledger.prepare.disabled.conflict");
  } else if (!workspace.summary.allowed) {
    const issue = workspace.limitIssueList[0];
    prepareDisabledReason =
      issue === undefined
        ? t("ledger.selection.unknown")
        : formatMessage(t(issue.key), issue.values);
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    workspace.search();
  };

  const emptyLabel =
    workspace.coverageErrorKey !== null
      ? t("ledger.failed")
      : workspace.appliedScope === null
        ? t("ledger.initial")
        : t("ledger.empty");

  return (
    <PageFrame title={t("pages.ledger.title")}>
      <div className={styles.stack}>
        <p className={styles.intro}>{t("ledger.intro")}</p>

        <PageSection
          title={t("ledger.filters.title")}
          description={t("ledger.access")}
        >
          <form className={styles.filters} onSubmit={handleSearch} noValidate>
            <Field
              label={t("ledger.store")}
              hint={t("ledger.loadedStores")}
              id="ledger-store"
            >
              <input
                id="ledger-store"
                type="text"
                list="ledger-stores"
                maxLength={512}
                autoComplete="off"
                value={workspace.draft.storeName}
                onChange={(event) => workspace.setStoreName(event.target.value)}
              />
            </Field>
            <datalist id="ledger-stores">
              {workspace.stores.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <Field label={t("ledger.startDate")} required id="ledger-start">
              <input
                id="ledger-start"
                type="date"
                min="1000-01-01"
                max="9999-12-31"
                required
                value={workspace.draft.startDate}
                onChange={(event) => workspace.setStartDate(event.target.value)}
              />
            </Field>
            <Field label={t("ledger.endDate")} required id="ledger-end">
              <input
                id="ledger-end"
                type="date"
                min="1000-01-01"
                max="9999-12-31"
                required
                value={workspace.draft.endDate}
                onChange={(event) => workspace.setEndDate(event.target.value)}
              />
            </Field>
            <div className={styles.filterActions}>
              <Button type="submit" busy={workspace.coverageLoading}>
                {t("ledger.search")}
              </Button>
            </div>
          </form>
          <p className={styles.muted}>{t("ledger.allStores")}</p>
          {workspace.filterIssueKey === null ? null : (
            <p className={styles.error} role="alert">
              {t(ledgerErrorKey(workspace.filterIssueKey))}
            </p>
          )}
        </PageSection>

        <PageSection
          title={t("ledger.list.title")}
          description={formatMessage(t("ledger.listNote"), {
            count: workspace.rows.length,
            limit: limits.pageSize,
          })}
        >
          {workspace.coverageErrorKey === null ? null : (
            <div className={styles.errorBlock} role="alert">
              <p>{t(workspace.coverageErrorKey)}</p>
              <ActionButton
                label={t("ledger.retry")}
                variant="secondary"
                onRun={workspace.refetchCoverage}
              />
            </div>
          )}

          <div className={styles.tableWrapper}>
            <table
              className={styles.table}
              aria-label={t("ledger.list.title")}
              aria-busy={workspace.coverageLoading}
            >
              <thead>
                <tr>
                  <th className={styles.selectionCell} scope="col">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allReadySelected}
                      disabled={
                        workspace.coverageLoading || readyRows.length === 0
                      }
                      onChange={() =>
                        workspace.selectBatch(readyRows, !allReadySelected)
                      }
                      aria-label={t("ledger.selectBatch")}
                    />
                  </th>
                  <th scope="col">{t("ledger.store.column")}</th>
                  <th scope="col">{t("ledger.date")}</th>
                  <th scope="col">{t("ledger.status")}</th>
                  <th scope="col">{t("ledger.size")}</th>
                  <th scope="col">{t("ledger.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {workspace.coverageLoading ? (
                  <tr>
                    <td className={styles.statusCell} colSpan={6}>
                      <span role="status">{t("ledger.querying")}</span>
                    </td>
                  </tr>
                ) : workspace.rows.length === 0 ? (
                  <tr>
                    <td className={styles.statusCell} colSpan={6}>
                      <span>{emptyLabel}</span>
                    </td>
                  </tr>
                ) : (
                  workspace.rows.map((row) => (
                    <LedgerRow
                      key={ledgerKey(row)}
                      row={row}
                      selected={workspace.selected.has(ledgerKey(row))}
                      downloaded={workspace.downloadedKeys.has(ledgerKey(row))}
                      onSelect={workspace.select}
                      onPreview={workspace.openPreview}
                      onDownload={workspace.downloadSingle}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <nav
            className={styles.pagination}
            aria-label={t("ui.table.pagination")}
          >
            <span className={styles.muted}>
              {formatMessage(t("ledger.batch"), {
                batch: workspace.batch + 1,
              })}
            </span>
            <Button
              variant="secondary"
              disabled={workspace.coverageLoading || workspace.batch === 0}
              onClick={workspace.goPrevious}
            >
              {t("ledger.previous")}
            </Button>
            <Button
              variant="secondary"
              disabled={
                workspace.coverageLoading || workspace.nextCursor === null
              }
              onClick={workspace.goNext}
            >
              {t("ledger.next")}
            </Button>
          </nav>
        </PageSection>

        {workspace.conflict === null ? null : (
          <ConflictPanel
            description={formatMessage(t("ledger.conflict.description"), {
              reason: t(ledgerErrorKey(workspace.conflict.code)),
            })}
            fields={[
              {
                key: "selection",
                label: t("ledger.conflict.selection"),
                serverValue: t("ledger.conflict.serverScope"),
                draftValue: summaryText,
              },
              {
                key: "request",
                label: t("ledger.conflict.request"),
                serverValue: t("ledger.conflict.serverRequest"),
                draftValue: workspace.conflict.requestRef,
              },
            ]}
            onReload={workspace.reloadConflict}
            onResubmit={workspace.resubmitConflict}
            reloading={workspace.reloading}
            resubmitting={workspace.prepareFlow.isPreparing}
            disabled={workspace.reloading}
          />
        )}
        {workspace.conflictErrorKey === null ? null : (
          <p className={styles.error} role="alert">
            {t(workspace.conflictErrorKey)}
          </p>
        )}

        <PageSection title={t("ledger.selection.title")}>
          <div className={styles.selectionSummary}>
            <p>
              <strong>{summaryText}</strong>
            </p>
            <p>
              {formatMessage(t("ledger.selection.bytes"), {
                bytes: formatBytes(workspace.summary.bytes),
                limit: formatBytes(limits.bytes),
              })}
            </p>
            <p className={styles.muted}>
              {formatMessage(t("ledger.selection.limits"), {
                files: limits.files,
                stores: limits.stores,
                dates: limits.dates,
                bytes: formatBytes(limits.bytes),
                days: limits.dates,
              })}
            </p>
          </div>

          {workspace.limitIssueList.length === 0 ? null : (
            <ul className={styles.error} role="alert">
              {workspace.limitIssueList.map((issue) => (
                <li key={issue.key}>
                  {formatMessage(t(issue.key), issue.values)}
                </li>
              ))}
            </ul>
          )}

          {workspace.summary.unknown > 0 || workspace.summary.invalid > 0 ? (
            <p className={styles.error} role="alert">
              {formatMessage(t("ledger.selection.unknown"), {
                unknown: workspace.summary.unknown,
                invalid: workspace.summary.invalid,
              })}
            </p>
          ) : null}

          <p className={styles.muted}>{t("ledger.selection.hint")}</p>

          {workspace.prepareFlow.error === null ||
          workspace.prepareFlow.error === undefined ||
          workspace.prepareFlow.open ? null : (
            <LedgerError error={workspace.prepareFlow.error} />
          )}

          <div className={styles.actions}>
            <ActionButton
              label={t("ledger.prepare")}
              busy={workspace.prepareFlow.isPreparing}
              disabled={!workspace.canPrepare}
              {...(prepareDisabledReason === undefined
                ? {}
                : { disabledReason: prepareDisabledReason })}
              onRun={() => {
                void workspace.prepareFlow.request();
              }}
            />
            <ActionButton
              label={t("ledger.selection.clear")}
              variant="secondary"
              disabled={workspace.summary.files === 0}
              onRun={workspace.clearSelection}
            />
          </div>

          <details className={styles.selectionDetails}>
            <summary>
              {t("ledger.selection.details")} ({workspace.selectedList.length})
            </summary>
            <p className={styles.muted}>{t("ledger.selection.order")}</p>
            {workspace.selectedList.length === 0 ? (
              <p className={styles.muted}>{t("ledger.selection.empty")}</p>
            ) : (
              <ul className={styles.selectedList}>
                {workspace.selectedList.map((item) => (
                  <SelectedRow
                    key={ledgerKey(item)}
                    item={item}
                    onRemove={workspace.removeSelectedKey}
                  />
                ))}
              </ul>
            )}
          </details>
        </PageSection>

        <PageSection
          title={t("ledger.preview.title")}
          {...(workspace.preview === null
            ? {}
            : {
                actions: (
                  <ActionButton
                    label={t("ledger.preview.close")}
                    variant="secondary"
                    onRun={workspace.closePreview}
                  />
                ),
              })}
        >
          {workspace.preview === null ? (
            <p className={styles.muted}>{t("ledger.preview.empty")}</p>
          ) : (
            <div className={styles.preview}>
              <p className={styles.previewName}>
                {workspace.preview.item.storeName} ·{" "}
                {workspace.preview.item.purchaseDate}
              </p>
              {workspace.previewFailed ? (
                <div className={styles.errorBlock} role="alert">
                  <p>{t("ledger.preview.failed")}</p>
                  <ActionButton
                    label={t("ledger.preview.retry")}
                    variant="secondary"
                    onRun={workspace.retryPreview}
                  />
                </div>
              ) : (
                <div className={styles.frameWrapper}>
                  {workspace.previewReady ? null : (
                    <p className={styles.muted} role="status">
                      {t("ledger.preview.loading")}
                    </p>
                  )}
                  <iframe
                    key={workspace.preview.nonce}
                    className={styles.frame}
                    src={ledgerPdfUrl(workspace.preview.item, "inline")}
                    title={formatMessage(t("ledger.preview.frameTitle"), {
                      store: workspace.preview.item.storeName,
                      date: workspace.preview.item.purchaseDate,
                    })}
                    onLoad={workspace.previewLoaded}
                    onError={workspace.previewFailedNow}
                  />
                </div>
              )}
              <p className={styles.muted}>{t("ledger.preview.hint")}</p>
            </div>
          )}
        </PageSection>

        <PageSection
          title={t("ledger.tasks.title")}
          description={t("ledger.tasks.hint")}
        >
          {workspace.tasks.length === 0 ? (
            <p className={styles.muted}>{t("ledger.tasks.empty")}</p>
          ) : (
            <ul className={styles.tasks}>
              {workspace.tasks.map((task) => (
                <TaskRow
                  key={task.requestId}
                  task={task}
                  locale={locale}
                  canPrepare={workspace.canPrepare}
                  onLink={workspace.linkTask}
                  onRetryPoll={workspace.retryPoll}
                  onReprepare={workspace.freshPrepare}
                />
              ))}
            </ul>
          )}
        </PageSection>
      </div>

      <ConfirmDialog
        flow={workspace.prepareFlow}
        title={t("ledger.confirm.title")}
        description={t("ledger.confirm.description")}
        confirmLabel={t("ledger.confirm.confirm")}
        cancelLabel={t("ledger.confirm.cancel")}
        error={null}
      >
        {workspace.prepareFlow.prepared === null ? null : (
          <div className={styles.confirmBody}>
            <p>
              {formatMessage(t("ledger.confirm.summary"), {
                files: workspace.prepareFlow.prepared.summary.files,
                stores: workspace.prepareFlow.prepared.summary.stores,
                dates: workspace.prepareFlow.prepared.summary.dates,
                bytes: formatBytes(
                  workspace.prepareFlow.prepared.summary.bytes,
                ),
              })}
            </p>
            <p>
              {formatMessage(t("ledger.task.hint"), {
                minutes: limits.deadlineMs / 60_000,
                hours: limits.retentionMs / 3_600_000,
              })}
            </p>
            <p className={styles.muted}>{t("ledger.confirm.fixed")}</p>
            {workspace.prepareFlow.error === null ||
            workspace.prepareFlow.error === undefined ? null : (
              <LedgerError error={workspace.prepareFlow.error} />
            )}
          </div>
        )}
      </ConfirmDialog>
    </PageFrame>
  );
}

interface LedgerRowProps {
  readonly row: LedgerPartition;
  readonly selected: boolean;
  readonly downloaded: boolean;
  readonly onSelect: (item: LedgerPartition, checked: boolean) => void;
  readonly onPreview: (item: LedgerPartition) => void;
  readonly onDownload: (item: LedgerPartition) => void;
}

function LedgerRow({
  row,
  selected,
  downloaded,
  onSelect,
  onPreview,
  onDownload,
}: LedgerRowProps) {
  const { t, locale } = useText();
  const ready = isReady(row);
  const sizeText =
    row.byteSize === null
      ? t("ledger.size.unknown")
      : formatBytes(row.byteSize);

  return (
    <tr aria-selected={selected}>
      <td className={styles.selectionCell}>
        <input
          type="checkbox"
          checked={selected}
          disabled={!ready}
          onChange={(event) => onSelect(row, event.target.checked)}
          aria-label={formatMessage(t("ledger.selectFile"), {
            store: row.storeName,
            date: row.purchaseDate,
          })}
        />
      </td>
      <td>{row.storeName}</td>
      <td>{row.purchaseDate}</td>
      <td>
        <span className={`${styles.badge} ${styles[row.status]}`}>
          {t(`ledger.status.${row.status}`)}
        </span>
      </td>
      <td
        {...(row.byteSize === null
          ? {}
          : {
              title: `${sizeText} (${row.byteSize.toLocaleString(locale)} B)`,
            })}
      >
        {sizeText}
      </td>
      <td>
        <div className={styles.rowActions}>
          <ActionButton
            label={t("ledger.preview")}
            variant="secondary"
            disabled={!ready}
            onRun={() => onPreview(row)}
          />
          <ActionButton
            label={t("ledger.download")}
            variant="secondary"
            disabled={!ready}
            onRun={() => onDownload(row)}
          />
        </div>
        {downloaded ? (
          <span className={styles.notice} role="status">
            {t("ledger.download.started")}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

interface SelectedRowProps {
  readonly item: SelectedPartition;
  readonly onRemove: (key: string) => void;
}

function SelectedRow({ item, onRemove }: SelectedRowProps) {
  const { t } = useText();
  const key = ledgerKey(item);

  return (
    <li className={styles.selectedRow}>
      <span>
        {item.storeName} · {item.purchaseDate}
      </span>
      <span>
        {hasKnownSize(item)
          ? formatBytes(item.byteSize ?? 0)
          : t("ledger.size.unknown")}
      </span>
      <span>{t(`ledger.status.${item.status}`)}</span>
      <ActionButton
        label={t("ledger.selection.remove")}
        variant="secondary"
        onRun={() => onRemove(key)}
      />
    </li>
  );
}

interface TaskRowProps {
  readonly task: BundleTask;
  readonly locale: Locale;
  readonly canPrepare: boolean;
  readonly onLink: (task: BundleTask) => void;
  readonly onRetryPoll: (task: BundleTask) => void;
  readonly onReprepare: () => void;
}

function TaskRow({
  task,
  locale,
  canPrepare,
  onLink,
  onRetryPoll,
  onReprepare,
}: TaskRowProps) {
  const { t } = useText();
  const pending = isPendingTaskStatus(task.status);
  const failedLink = task.status === "succeeded" && task.errorCode !== null;
  const needsReprepare =
    (!pending && task.status !== "succeeded") || failedLink;

  return (
    <li className={styles.task}>
      <p>
        {formatMessage(t("ledger.tasks.item"), {
          time: formatTimestamp(task.createdAt, locale),
          files: task.selection.length,
        })}
      </p>
      <p className={styles.taskStatus} role="status">
        {TASK_STATUS_KEYS.has(task.status)
          ? t(`ledger.task.${task.status}`)
          : formatMessage(t("ledger.task.unknown"), { status: task.status })}
      </p>
      {pending ? (
        <p className={styles.muted}>{t("ledger.task.waiting")}</p>
      ) : null}
      {task.errorCode === null ? null : (
        <p className={styles.error} role="alert">
          {t(ledgerErrorKey(task.errorCode))}
        </p>
      )}
      {task.pollErrorKey === null ? null : (
        <p className={styles.error} role="alert">
          {t(task.pollErrorKey)}
        </p>
      )}
      {task.notice === "linkIssued" ? (
        <p className={styles.notice} role="status">
          {t("ledger.task.issued")}
        </p>
      ) : null}
      {task.expiresAt === null ? null : (
        <p className={styles.muted}>
          {formatMessage(t("ledger.task.expires"), {
            time: formatTimestampText(task.expiresAt, locale),
          })}
        </p>
      )}
      <details className={styles.taskDetail}>
        <summary>{t("ledger.tasks.detail")}</summary>
        <p className={styles.muted}>
          {formatMessage(t("ledger.task.selection"), {
            count: task.selection.length,
          })}
        </p>
        <ul className={styles.taskSelection}>
          {task.selection.map((item) => (
            <li key={`${item.storeName}|\u0000|${item.purchaseDate}`}>
              {item.storeName} · {item.purchaseDate}
            </li>
          ))}
        </ul>
      </details>
      <div className={styles.actions}>
        {task.status === "succeeded" ? (
          <ActionButton
            label={t("ledger.task.link")}
            busy={task.linking}
            onRun={() => onLink(task)}
          />
        ) : null}
        {pending && (task.pollErrorKey !== null || task.errorCode !== null) ? (
          <ActionButton
            label={t("ledger.task.retryPoll")}
            variant="secondary"
            onRun={() => onRetryPoll(task)}
          />
        ) : null}
        {needsReprepare ? (
          <ActionButton
            label={t("ledger.task.reprepare")}
            variant="secondary"
            disabled={!canPrepare}
            onRun={onReprepare}
          />
        ) : null}
      </div>
    </li>
  );
}

function LedgerError({ error }: { readonly error: unknown }) {
  const { t } = useText();
  return (
    <p className={styles.error} role="alert">
      {t(ledgerErrorKey(error))}
    </p>
  );
}

function formatTimestamp(timestamp: number, locale: Locale): string {
  return formatTimestampText(new Date(timestamp), locale);
}

function formatTimestampText(value: string | Date, locale: Locale): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
