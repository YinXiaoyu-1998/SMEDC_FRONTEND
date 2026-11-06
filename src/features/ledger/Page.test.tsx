import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  LedgerContextResponse,
  LedgerCoverageBody,
  LedgerDownloadsBody,
} from "@/api/generated/contract";
import type { LedgerPartition } from "@/features/ledger/model";
import { employeeSession } from "@/test/fixtures";
import { renderApp } from "@/test/renderApp";

interface MockResult {
  readonly status?: number;
  readonly body?: unknown;
}

interface RecordedCall {
  readonly url: URL;
  readonly method: string;
  readonly body: unknown;
  readonly headers: Headers;
}

interface MockOptions {
  readonly context?: () => MockResult;
  readonly coverage?: (
    body: LedgerCoverageBody | undefined,
    call: RecordedCall,
  ) => MockResult | Promise<MockResult>;
  readonly downloads?: (
    body: LedgerDownloadsBody | undefined,
    call: RecordedCall,
  ) => MockResult | Promise<MockResult>;
  readonly request?: (requestId: string) => MockResult | Promise<MockResult>;
  readonly downloadUrl?: (
    requestId: string,
  ) => MockResult | Promise<MockResult>;
  readonly login?: () => MockResult;
}

const defaultLimits: LedgerContextResponse["limits"] = {
  files: 5000,
  bytes: 1073741824,
  stores: 50,
  dates: 366,
  pageSize: 200,
  deadlineMs: 600_000,
  retentionMs: 86_400_000,
};

function ledgerContext(
  limits: Partial<LedgerContextResponse["limits"]> = {},
): LedgerContextResponse {
  return {
    identity: {
      employeeId: "employee-2",
      orgId: "org-1",
      displayName: "李四",
      organizationName: "示例企业",
    },
    csrfToken: "csrf-ledger",
    limits: { ...defaultLimits, ...limits },
  };
}

function partition(
  storeName: string,
  purchaseDate: string,
  status: LedgerPartition["status"] = "ready",
  byteSize: number | null = 1024,
): LedgerPartition {
  return { storeName, purchaseDate, status, byteSize };
}

function selectionCoverage(rows: readonly LedgerPartition[]) {
  const byKey = new Map(
    rows.map((row) => [JSON.stringify([row.storeName, row.purchaseDate]), row]),
  );
  return (body: LedgerCoverageBody | undefined): MockResult => {
    if (body?.selection !== undefined) {
      const selected = body.selection.flatMap((ref) => {
        const found = byKey.get(
          JSON.stringify([ref.storeName, ref.purchaseDate]),
        );
        return found === undefined ? [] : [found];
      });
      return { body: { partitions: selected, nextCursor: null } };
    }
    return { body: { partitions: rows, nextCursor: null } };
  };
}

function toResponse(result: MockResult): Response {
  return new Response(
    result.body === undefined ? null : JSON.stringify(result.body),
    {
      status: result.status ?? 200,
      headers: { "content-type": "application/json" },
    },
  );
}

function installFetch(options: MockOptions) {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url,
        "http://localhost",
      );
      const method = (init?.method ?? "GET").toUpperCase();
      const rawBody = typeof init?.body === "string" ? init.body : undefined;
      const body: unknown =
        rawBody === undefined ? undefined : (JSON.parse(rawBody) as unknown);
      const call: RecordedCall = {
        url,
        method,
        body,
        headers: new Headers(init?.headers),
      };
      calls.push(call);

      const path = url.pathname;
      if (method === "GET" && path === "/api/web/v1/ledger/context") {
        return toResponse(options.context?.() ?? { body: ledgerContext() });
      }
      if (method === "POST" && path === "/api/web/v1/ledger/coverage") {
        const handler = options.coverage ?? selectionCoverage([]);
        return toResponse(
          await handler(body as LedgerCoverageBody | undefined, call),
        );
      }
      if (method === "POST" && path === "/api/web/v1/ledger/downloads") {
        const handler =
          options.downloads ??
          ((): MockResult => ({
            body: { requestId: "req-1", status: "queued" },
          }));
        return toResponse(
          await handler(body as LedgerDownloadsBody | undefined, call),
        );
      }
      if (
        method === "POST" &&
        path.startsWith("/api/web/v1/ledger/requests/") &&
        path.endsWith("/download-url")
      ) {
        const requestId = decodeURIComponent(path.split("/").at(-2) ?? "");
        const handler =
          options.downloadUrl ??
          ((): MockResult => ({
            body: {
              requestId,
              downloadUrl: "https://files.example/ledger.zip",
              expiresAt: "2026-11-06T12:00:00.000Z",
            },
          }));
        return toResponse(await handler(requestId));
      }
      if (method === "GET" && path.startsWith("/api/web/v1/ledger/requests/")) {
        const requestId = decodeURIComponent(path.split("/").at(-1) ?? "");
        const handler =
          options.request ??
          ((id: string): MockResult => ({
            body: {
              requestId: id,
              status: "succeeded",
              partitions: [],
              nextCursor: null,
            },
          }));
        return toResponse(await handler(requestId));
      }
      if (method === "POST" && path === "/api/web/v1/session") {
        return toResponse(options.login?.() ?? { body: employeeSession });
      }
      if (method === "GET" && path === "/api/web/v1/session") {
        return toResponse({ body: employeeSession });
      }
      if (method === "DELETE" && path === "/api/web/v1/session") {
        return toResponse({ body: { signedOut: true } });
      }
      return toResponse({
        status: 500,
        body: { error: { code: "INTERNAL_ERROR", message: "unmocked" } },
      });
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

function renderLedger(
  options: MockOptions = {},
  initialEntries: readonly string[] = ["/ledger"],
) {
  const harness = installFetch(options);
  const view = renderApp({ session: employeeSession, initialEntries });
  return { ...harness, ...view };
}

async function waitForPage(searchLabel = "查询台账") {
  await screen.findByRole("button", { name: searchLabel });
}

function clickSearch() {
  fireEvent.click(screen.getByRole("button", { name: "查询台账" }));
}

function selectRow(storeName: string, purchaseDate: string) {
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: `选择 ${storeName} · ${purchaseDate}`,
    }),
  );
}

async function openPrepareDialog() {
  fireEvent.click(screen.getByRole("button", { name: "打包下载 ZIP" }));
  return screen.findByRole("dialog", { name: "确认打包下载" });
}

function coverageCalls(calls: readonly RecordedCall[]) {
  return calls.filter(
    (call) =>
      call.method === "POST" &&
      call.url.pathname === "/api/web/v1/ledger/coverage",
  );
}

function downloadsCalls(calls: readonly RecordedCall[]) {
  return calls.filter(
    (call) =>
      call.method === "POST" &&
      call.url.pathname === "/api/web/v1/ledger/downloads",
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("台账下载中心", () => {
  it("首次加载显示筛选与初始空态，查询后展示空结果并使用上下文 CSRF", async () => {
    const { calls } = renderLedger({
      coverage: () => ({ body: { partitions: [], nextCursor: null } }),
    });
    await waitForPage();

    expect(screen.getByText("选择日期后查询台账。")).toBeInTheDocument();
    const prepare = screen.getByRole("button", { name: "打包下载 ZIP" });
    expect(prepare).toBeDisabled();
    expect(prepare).toHaveAccessibleDescription("请先选择可下载的台账");
    expect(coverageCalls(calls)).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/进货日期 · 起/), {
      target: { value: "2026-10-01" },
    });
    fireEvent.change(screen.getByLabelText(/进货日期 · 止/), {
      target: { value: "2026-10-03" },
    });
    clickSearch();

    expect(
      await screen.findByText("本次查询无受权进货记录。请调整筛选条件。"),
    ).toBeInTheDocument();
    const [coverageCall] = coverageCalls(calls);
    expect(coverageCall?.body).toEqual({
      scope: { startDate: "2026-10-01", endDate: "2026-10-03" },
    });
    expect(coverageCall?.headers.get("x-csrf-token")).toBe("csrf-ledger");
  });

  it("日期必填、区间合法且跨度不超过上限，校验失败不发请求", async () => {
    const { calls } = renderLedger({
      coverage: () => ({ body: { partitions: [], nextCursor: null } }),
    });
    await waitForPage();

    fireEvent.change(screen.getByLabelText(/进货日期 · 起/), {
      target: { value: "" },
    });
    clickSearch();
    expect(
      await screen.findByText(
        "请核对门店原名及有效日期，起始日期不能晚于结束日期。",
      ),
    ).toBeInTheDocument();
    expect(coverageCalls(calls)).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/进货日期 · 起/), {
      target: { value: "2025-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/进货日期 · 止/), {
      target: { value: "2026-01-02" },
    });
    clickSearch();
    expect(
      await screen.findByText(
        "查询或清单超过数量、门店或日期限制，请缩小范围。",
      ),
    ).toBeInTheDocument();
    expect(coverageCalls(calls)).toHaveLength(0);

    fireEvent.change(screen.getByLabelText("门店精确名称"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText(/进货日期 · 止/), {
      target: { value: "2026-01-01" },
    });
    clickSearch();
    expect(
      await screen.findByText(
        "请核对门店原名及有效日期，起始日期不能晚于结束日期。",
      ),
    ).toBeInTheDocument();
    expect(coverageCalls(calls)).toHaveLength(0);
  });

  it("深链进入时按 URL 还原筛选条件、自动查询并填充已加载门店", async () => {
    const rows = [
      partition(" 门店 甲 ", "2026-10-01"),
      partition("门店乙", "2026-10-02"),
    ];
    const { calls } = renderLedger({ coverage: selectionCoverage(rows) }, [
      `/ledger?from=2026-10-01&to=2026-10-03&store=${encodeURIComponent(" 门店 甲 ")}`,
    ]);
    await waitForPage();

    expect(await screen.findByText("门店 甲")).toBeInTheDocument();
    expect(screen.getByLabelText("门店精确名称")).toHaveValue(" 门店 甲 ");
    expect(screen.getByLabelText(/进货日期 · 起/)).toHaveValue("2026-10-01");
    expect(screen.getByLabelText(/进货日期 · 止/)).toHaveValue("2026-10-03");

    const [coverageCall] = coverageCalls(calls);
    expect(coverageCall?.body).toEqual({
      scope: {
        startDate: "2026-10-01",
        endDate: "2026-10-03",
        storeNames: [" 门店 甲 "],
      },
    });

    const options = [
      ...document.querySelectorAll<HTMLOptionElement>("#ledger-stores option"),
    ].map((option) => option.value);
    expect(options).toEqual([" 门店 甲 ", "门店乙"]);
  });

  it("请求失败展示稳定错误文案，重试后恢复列表", async () => {
    let failed = false;
    const rows = [partition("门店A", "2026-10-01")];
    renderLedger({
      coverage: () => {
        if (!failed) {
          failed = true;
          return {
            status: 500,
            body: { error: { code: "INTERNAL_ERROR", message: "boom" } },
          };
        }
        return { body: { partitions: rows, nextCursor: null } };
      },
    });
    await waitForPage();
    clickSearch();

    expect(
      await screen.findByText("服务暂时无法完成请求，请稍后重试。"),
    ).toBeInTheDocument();
    expect(screen.getByText("本批台账读取失败，请重试。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(await screen.findByText("门店A")).toBeInTheDocument();
    expect(
      screen.queryByText("服务暂时无法完成请求，请稍后重试。"),
    ).not.toBeInTheDocument();
  });

  it("权限拒绝（403）时展示无访问权限并卸载台账页", async () => {
    renderLedger({
      coverage: () => ({
        status: 403,
        body: { error: { code: "BROWSER_ACCESS_DENIED", message: "denied" } },
      }),
    });
    await waitForPage();
    clickSearch();

    expect(
      await screen.findByRole("heading", { name: "无访问权限" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "台账下载中心" }),
    ).not.toBeInTheDocument();
  });

  it("写操作成功：确认后提交固定清单、复用幂等键并在终态停止轮询", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    const bodies: LedgerDownloadsBody[] = [];
    let pollCount = 0;
    const { calls } = renderLedger({
      coverage: selectionCoverage(rows),
      downloads: (body) => {
        if (body !== undefined) bodies.push(body);
        return { body: { requestId: "req-1", status: "queued" } };
      },
      request: () => {
        pollCount += 1;
        return {
          body: {
            requestId: "req-1",
            status: "succeeded",
            partitions: [],
            nextCursor: null,
          },
        };
      },
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");
    selectRow("门店A", "2026-10-01");

    expect(
      screen.getAllByText(/已选 1 \/ 5000 份 · 1 家门店 · 1 个日期/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "打包下载 ZIP" })).toBeEnabled();

    const dialog = await openPrepareDialog();
    expect(
      within(dialog).getByText(/本次清单：1 份 · 1 家门店 · 1 个日期/),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "确认打包" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await screen.findByText("打包完成，可领取下载链接");

    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.selection).toEqual([
      { storeName: "门店A", purchaseDate: "2026-10-01" },
    ]);
    expect(bodies[0]?.idempotencyKey).toEqual(expect.any(String));
    expect(pollCount).toBe(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(pollCount).toBe(1);

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "领取下载链接" }));
    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.href).toBe("https://files.example/ledger.zip");

    const second = await openPrepareDialog();
    fireEvent.click(within(second).getByRole("button", { name: "确认打包" }));
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]?.idempotencyKey).toBe(bodies[0]?.idempotencyKey);
    expect(downloadsCalls(calls)).toHaveLength(2);
  });

  it("选择顺序按门店与日期稳定，不受勾选先后影响", async () => {
    const rows = [
      partition("门店B", "2026-10-02"),
      partition("门店A", "2026-10-03"),
    ];
    const bodies: LedgerDownloadsBody[] = [];
    renderLedger({
      coverage: selectionCoverage(rows),
      downloads: (body) => {
        if (body !== undefined) bodies.push(body);
        return { body: { requestId: "req-1", status: "queued" } };
      },
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店B");

    selectRow("门店B", "2026-10-02");
    selectRow("门店A", "2026-10-03");
    const dialog = await openPrepareDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "确认打包" }));
    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0]?.selection).toEqual([
      { storeName: "门店A", purchaseDate: "2026-10-03" },
      { storeName: "门店B", purchaseDate: "2026-10-02" },
    ]);
  });

  it("准备期间按钮忙碌并阻止重复准备", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { calls } = renderLedger({
      coverage: async (body) => {
        if (body?.selection !== undefined) await gate;
        return selectionCoverage(rows)(body);
      },
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");
    selectRow("门店A", "2026-10-01");

    const prepare = screen.getByRole("button", { name: "打包下载 ZIP" });
    fireEvent.click(prepare);
    fireEvent.click(prepare);
    expect(prepare).toBeDisabled();
    expect(prepare).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    release();
    expect(
      await screen.findByRole("dialog", { name: "确认打包下载" }),
    ).toBeInTheDocument();
    const selectionCalls = coverageCalls(calls).filter(
      (call) => (call.body as LedgerCoverageBody).selection !== undefined,
    );
    expect(selectionCalls).toHaveLength(1);
  });

  it("超过服务端限额时禁止提交并给出具体超限说明", async () => {
    const rows = [
      partition("门店A", "2026-10-01"),
      partition("门店B", "2026-10-01"),
      partition("门店C", "2026-10-01"),
      partition("待生成", "2026-10-01", "pending", null),
    ];
    renderLedger({
      context: () => ({ body: ledgerContext({ files: 2 }) }),
      coverage: selectionCoverage(rows),
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");

    const pendingCheckbox = screen.getByRole("checkbox", {
      name: "选择 待生成 · 2026-10-01",
    });
    expect(pendingCheckbox).toBeDisabled();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "全选本页可下载文件" }),
    );
    expect(
      screen.getByText(/已选 3 \/ 2 份 · 3 家门店 · 1 个日期/),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("已选 3 份，超过上限 2 份，请取消 1 份。").length,
    ).toBeGreaterThan(0);

    const prepare = screen.getByRole("button", { name: "打包下载 ZIP" });
    expect(prepare).toBeDisabled();
    expect(prepare).toHaveAccessibleDescription(
      "已选 3 份，超过上限 2 份，请取消 1 份。",
    );
  });

  it("版本冲突（409）保留草稿并可显式重新提交", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    const bodies: LedgerDownloadsBody[] = [];
    let attempts = 0;
    renderLedger({
      coverage: selectionCoverage(rows),
      downloads: (body) => {
        if (body !== undefined) bodies.push(body);
        attempts += 1;
        if (attempts === 1) {
          return {
            status: 409,
            body: {
              error: {
                code: "LEDGER_IDEMPOTENCY_CONFLICT",
                message: "conflict",
              },
            },
          };
        }
        return { body: { requestId: "req-1", status: "queued" } };
      },
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");
    selectRow("门店A", "2026-10-01");

    const dialog = await openPrepareDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "确认打包" }));

    const panel = await screen.findByRole("alert", { name: "版本冲突" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(panel).toHaveTextContent(
      "此请求对应不同清单，请明确重新准备当前清单。",
    );
    expect(
      screen.getAllByText(/已选 1 \/ 5000 份 · 1 家门店 · 1 个日期/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "打包下载 ZIP" })).toBeDisabled();
    expect(bodies).toHaveLength(1);

    fireEvent.click(
      within(panel).getByRole("button", { name: "用我的改动重新提交" }),
    );
    const retryDialog = await screen.findByRole("dialog", {
      name: "确认打包下载",
    });
    fireEvent.click(
      within(retryDialog).getByRole("button", { name: "确认打包" }),
    );
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]?.idempotencyKey).not.toBe(bodies[0]?.idempotencyKey);
    await screen.findByText("打包完成，可领取下载链接");
  });

  it("冲突后重新核验会刷新上下文与已选清单并保留选择", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    let conflicts = 1;
    const { calls } = renderLedger({
      coverage: selectionCoverage(rows),
      downloads: () => {
        if (conflicts-- > 0) {
          return {
            status: 409,
            body: {
              error: {
                code: "AUTHORIZATION_VERSION_CONFLICT",
                message: "conflict",
              },
            },
          };
        }
        return { body: { requestId: "req-1", status: "queued" } };
      },
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");
    selectRow("门店A", "2026-10-01");

    const dialog = await openPrepareDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "确认打包" }));
    const panel = await screen.findByRole("alert", { name: "版本冲突" });
    const contextCallsBefore = calls.filter(
      (call) => call.url.pathname === "/api/web/v1/ledger/context",
    ).length;

    fireEvent.click(within(panel).getByRole("button", { name: "重新加载" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("alert", { name: "版本冲突" }),
      ).not.toBeInTheDocument(),
    );

    const contextCallsAfter = calls.filter(
      (call) => call.url.pathname === "/api/web/v1/ledger/context",
    ).length;
    expect(contextCallsAfter).toBe(contextCallsBefore + 1);
    expect(
      coverageCalls(calls).some(
        (call) => (call.body as LedgerCoverageBody).selection !== undefined,
      ),
    ).toBe(true);
    expect(
      screen.getAllByText(/已选 1 \/ 5000 份 · 1 家门店 · 1 个日期/).length,
    ).toBeGreaterThan(0);
  });

  it("会话过期（401）跳转登录并保留筛选，重新登录后回到原查询", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    let unauthorized = true;
    const { calls, router } = renderLedger({
      coverage: (body) => {
        if (unauthorized) {
          unauthorized = false;
          return {
            status: 401,
            body: {
              error: { code: "BROWSER_SIGN_IN_REQUIRED", message: "expired" },
            },
          };
        }
        return selectionCoverage(rows)(body);
      },
    });
    await waitForPage();
    fireEvent.change(screen.getByLabelText(/进货日期 · 起/), {
      target: { value: "2026-10-01" },
    });
    fireEvent.change(screen.getByLabelText(/进货日期 · 止/), {
      target: { value: "2026-10-03" },
    });
    clickSearch();

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    const next = new URLSearchParams(router.state.location.search).get("next");
    expect(next).toContain("/ledger");
    expect(next).toContain("from=2026-10-01");
    expect(screen.getByText("登录状态已过期，请重新登录")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "lisi@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/ledger"));
    expect(router.state.location.search).toContain("from=2026-10-01");
    expect(await screen.findByText("门店A")).toBeInTheDocument();

    const scoped = coverageCalls(calls).filter(
      (call) => (call.body as LedgerCoverageBody).scope !== undefined,
    );
    expect(scoped).toHaveLength(2);
    expect(scoped[1]?.body).toEqual(scoped[0]?.body);
  });

  it("游标分页按 nextCursor 前后翻批", async () => {
    const first = [partition("门店A", "2026-10-01")];
    const second = [partition("门店B", "2026-10-02")];
    const { calls } = renderLedger({
      coverage: (body) => {
        if (body?.cursor === "cursor-2") {
          return { body: { partitions: second, nextCursor: null } };
        }
        return { body: { partitions: first, nextCursor: "cursor-2" } };
      },
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");
    expect(screen.getByText("第 1 批")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一批" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "下一批" }));
    expect(await screen.findByText("门店B")).toBeInTheDocument();
    expect(screen.getByText("第 2 批")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一批" })).toBeDisabled();

    const sent = coverageCalls(calls).find(
      (call) => (call.body as LedgerCoverageBody).cursor === "cursor-2",
    );
    expect(sent?.body).toEqual({
      scope: {
        startDate: expect.any(String),
        endDate: expect.any(String),
      },
      cursor: "cursor-2",
    });

    fireEvent.click(screen.getByRole("button", { name: "上一批" }));
    expect(await screen.findByText("门店A")).toBeInTheDocument();
    expect(screen.getByText("第 1 批")).toBeInTheDocument();
  });

  it("预览使用同源 iframe，关闭后释放", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    const { calls } = renderLedger({ coverage: selectionCoverage(rows) });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");

    fireEvent.click(screen.getByRole("button", { name: "预览" }));
    const frame = screen.getByTitle("PDF 预览 · 门店A · 2026-10-01");
    expect(frame.tagName).toBe("IFRAME");
    const src = frame.getAttribute("src") ?? "";
    expect(src.startsWith("blob:")).toBe(false);
    const url = new URL(src, "http://localhost");
    expect(url.origin).toBe("http://localhost");
    expect(url.pathname).toBe("/api/web/v1/ledger/pdf");
    expect(url.searchParams.get("storeName")).toBe("门店A");
    expect(url.searchParams.get("purchaseDate")).toBe("2026-10-01");
    expect(url.searchParams.get("disposition")).toBe("inline");
    expect(
      calls.some((call) => call.url.pathname.endsWith("/ledger/pdf")),
    ).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(
      screen.queryByTitle("PDF 预览 · 门店A · 2026-10-01"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("选择一份可用台账核对内容。")).toBeInTheDocument();
  });

  it("提交失败后保留确认弹窗与同一幂等键，显式重试成功", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    const bodies: LedgerDownloadsBody[] = [];
    let attempts = 0;
    renderLedger({
      coverage: selectionCoverage(rows),
      downloads: (body) => {
        if (body !== undefined) bodies.push(body);
        attempts += 1;
        if (attempts === 1) throw new Error("offline");
        return { body: { requestId: "req-1", status: "queued" } };
      },
    });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");
    selectRow("门店A", "2026-10-01");

    const dialog = await openPrepareDialog();
    const confirm = within(dialog).getByRole("button", { name: "确认打包" });
    fireEvent.click(confirm);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "网络请求失败。筛选和清单已保留，请重试。",
    );
    expect(
      screen.getByRole("dialog", { name: "确认打包下载" }),
    ).toBeInTheDocument();
    expect(bodies).toHaveLength(1);

    fireEvent.click(confirm);
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]?.idempotencyKey).toBe(bodies[0]?.idempotencyKey);
    await screen.findByText("打包完成，可领取下载链接");
  });

  it("单份下载使用同源 PDF 地址并携带 attachment", async () => {
    const rows = [partition("门店A", "2026-10-01")];
    renderLedger({ coverage: selectionCoverage(rows) });
    await waitForPage();
    clickSearch();
    await screen.findByText("门店A");

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "下载" }));
    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    const url = new URL(anchor.href, "http://localhost");
    expect(url.pathname).toBe("/api/web/v1/ledger/pdf");
    expect(url.searchParams.get("storeName")).toBe("门店A");
    expect(url.searchParams.get("purchaseDate")).toBe("2026-10-01");
    expect(url.searchParams.get("disposition")).toBe("attachment");
    expect(
      await screen.findByText("下载已发起，请查看浏览器下载记录。"),
    ).toBeInTheDocument();
  });

  it("双语切换覆盖筛选、列表与动作按钮文案", async () => {
    localStorage.setItem("smedc-locale", "en");
    renderLedger({
      coverage: () => ({ body: { partitions: [], nextCursor: null } }),
    });
    await waitForPage("Find ledgers");
    expect(
      screen.getByRole("button", { name: "Prepare ZIP" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Choose dates to find ledgers."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "中文" }));
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "台账下载中心",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "打包下载 ZIP" }),
    ).toBeInTheDocument();
  });
});
