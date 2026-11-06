import { requestWebApi, resolveWebApiUrl, serializeQuery } from "@/api/client";
import {
  ledgerContextResponseSchema,
  ledgerCoverageResponseSchema,
  ledgerDownloadsResponseSchema,
  ledgerRequestsDownloadUrlResponseSchema,
  ledgerRequestsReadResponseSchema,
  webApiRoutes,
  type LedgerContextResponse,
  type LedgerCoverageBody,
  type LedgerCoverageResponse,
  type LedgerDownloadsBody,
  type LedgerDownloadsResponse,
  type LedgerRequestsDownloadUrlResponse,
  type LedgerRequestsReadResponse,
} from "@/api/generated/contract";

export type LedgerPdfDisposition = "inline" | "attachment";

const contextRoute = webApiRoutes["ledger.context"];
const coverageRoute = webApiRoutes["ledger.coverage"];
const downloadsRoute = webApiRoutes["ledger.downloads"];
const pdfRoute = webApiRoutes["ledger.pdf"];
const requestReadRoute = webApiRoutes["ledger.requests.read"];
const requestDownloadUrlRoute = webApiRoutes["ledger.requests.downloadUrl"];

export function readLedgerContext(
  signal?: AbortSignal,
): Promise<LedgerContextResponse> {
  return requestWebApi(
    {
      method: contextRoute.method,
      path: contextRoute.path,
      ...(signal === undefined ? {} : { signal }),
    },
    ledgerContextResponseSchema,
  );
}

export function readLedgerCoverage(
  body: LedgerCoverageBody,
  csrfToken: string,
  signal?: AbortSignal,
): Promise<LedgerCoverageResponse> {
  return requestWebApi(
    {
      method: coverageRoute.method,
      path: coverageRoute.path,
      body,
      csrfToken,
      ...(signal === undefined ? {} : { signal }),
    },
    ledgerCoverageResponseSchema,
  );
}

export function prepareLedgerBundle(
  body: LedgerDownloadsBody,
  csrfToken: string,
  signal?: AbortSignal,
): Promise<LedgerDownloadsResponse> {
  return requestWebApi(
    {
      method: downloadsRoute.method,
      path: downloadsRoute.path,
      body,
      csrfToken,
      ...(signal === undefined ? {} : { signal }),
    },
    ledgerDownloadsResponseSchema,
  );
}

export function readLedgerRequest(
  requestId: string,
  signal?: AbortSignal,
): Promise<LedgerRequestsReadResponse> {
  return requestWebApi(
    {
      method: requestReadRoute.method,
      path: requestReadRoute.path,
      params: { requestId },
      ...(signal === undefined ? {} : { signal }),
    },
    ledgerRequestsReadResponseSchema,
  );
}

export function requestLedgerDownloadUrl(
  requestId: string,
  csrfToken: string,
  signal?: AbortSignal,
): Promise<LedgerRequestsDownloadUrlResponse> {
  return requestWebApi(
    {
      method: requestDownloadUrlRoute.method,
      path: requestDownloadUrlRoute.path,
      params: { requestId },
      csrfToken,
      ...(signal === undefined ? {} : { signal }),
    },
    ledgerRequestsDownloadUrlResponseSchema,
  );
}

/**
 * 单份 PDF 的同源地址：预览走 iframe，下载走 anchor，都不经过 blob 或跨域拼接。
 */
export function ledgerPdfUrl(
  item: { readonly storeName: string; readonly purchaseDate: string },
  disposition: LedgerPdfDisposition,
): string {
  return `${resolveWebApiUrl(pdfRoute.path)}${serializeQuery({
    storeName: item.storeName,
    purchaseDate: item.purchaseDate,
    disposition,
  })}`;
}
