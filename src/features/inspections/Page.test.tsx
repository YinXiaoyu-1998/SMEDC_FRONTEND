import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import type {
  InspectionsPatchesBody,
  InspectionsSheetsReadResponse,
} from "@/api/generated/contract";
import { inspectingEmployeeSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

const id = (suffix: number) =>
  `30000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
const scope = {
  enterpriseKey: "fixture",
  storeId: id(1),
  inspectionDate: "2026-11-23",
};
const sheet = {
  kind: "sheet",
  sheetId: id(2),
  templateId: id(3),
  templateVersionId: id(4),
  templateTitle: "卫生巡检",
  name: null,
  sheetRevision: 1,
  progress: "unfilled",
} as const;
const question: InspectionsSheetsReadResponse["questions"][number] = {
  title: "冷柜整洁",
  category: "后厨",
  questionId: id(5),
  questionRevision: 1,
  components: [
    { componentId: id(6), kind: "sop", label: "标准", text: "检查冷柜内部。" },
    { componentId: id(7), kind: "comment", label: "评价", required: false },
    { componentId: id(8), kind: "photo", label: "原图", required: true },
  ],
  answers: [
    { componentId: id(7), componentRevision: 0, value: null },
    { componentId: id(8), componentRevision: 0, value: null },
  ],
};

const template = {
  kind: "template",
  templateId: sheet.templateId,
  templateVersionId: sheet.templateVersionId,
  activeRevision: 1,
  title: sheet.templateTitle,
  copyMode: "single",
} as const;

function mockInspectionApi(
  canFill: boolean,
  overrides?: (url: URL, init?: RequestInit) => Response | undefined,
) {
  const permissions = {
    canReadInspections: true,
    canFillInspections: canFill,
    canManageInspectionTemplates: false,
  };
  const enterprise = {
    enterpriseKey: scope.enterpriseKey,
    enterpriseName: "样例企业",
    ...permissions,
  };
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "https://smedc.test");
    const custom = overrides?.(url, init);
    if (custom) return custom;
    if (url.pathname.endsWith("/session"))
      return jsonResponse(inspectingEmployeeSession);
    if (url.pathname.endsWith("/context")) {
      if (url.searchParams.has("inspectionDate")) {
        return jsonResponse({
          items: [],
          nextCursor: null,
          preflight: { ...scope, ...permissions },
        });
      }
      const items = url.searchParams.has("enterpriseKey")
        ? [
            {
              kind: "store",
              ...enterprise,
              storeId: scope.storeId,
              officialName: "东门店",
              retired: false,
            },
          ]
        : [{ kind: "enterprise", ...enterprise }];
      return jsonResponse({ items, nextCursor: null });
    }
    if (url.pathname.endsWith("/day"))
      return jsonResponse({ items: [sheet], nextCursor: null });
    if (url.pathname.endsWith(`/sheets/${sheet.sheetId}`)) {
      return jsonResponse(readResponse());
    }
    throw new Error(`Unexpected request to ${url.pathname}`);
  });
}

function readResponse(
  answers = question.answers,
  sheetRevision = 1,
): InspectionsSheetsReadResponse {
  const photo = answers.find((answer) => answer.componentId === id(8));
  const missingRequired = photo?.value
    ? []
    : [{ questionId: question.questionId, componentId: id(8) }];
  return {
    ...scope,
    sheetId: sheet.sheetId,
    templateVersionId: sheet.templateVersionId,
    templateId: sheet.templateId,
    templateTitle: sheet.templateTitle,
    name: sheet.name,
    progress:
      missingRequired.length === 0
        ? "complete"
        : sheetRevision === 1
          ? "unfilled"
          : "incomplete",
    sheetRevision,
    questions: [{ ...question, answers }],
    missingRequiredCount: missingRequired.length,
    missingRequired,
    nextCursor: null,
  };
}

async function selectScope() {
  renderApp({
    session: inspectingEmployeeSession,
    initialEntries: [`/inspections?date=${scope.inspectionDate}`],
  });
  await screen.findByRole("option", { name: "样例企业" });
  expect(screen.getByLabelText("企业")).toHaveValue(scope.enterpriseKey);
  await screen.findByRole("option", { name: "东门店" });
  fireEvent.change(screen.getByLabelText("门店"), {
    target: { value: scope.storeId },
  });
}

async function openSheet() {
  await selectScope();
  fireEvent.click(await screen.findByRole("button", { name: "查看 卫生巡检" }));
}

afterEach(() => vi.unstubAllGlobals());

it.each([true, false])(
  "only preselects a single inspection enterprise once the context proves completeness (store row: %s)",
  async (hasStore) => {
    const enterprise = {
      kind: "enterprise",
      enterpriseKey: scope.enterpriseKey,
      enterpriseName: "样例企业",
      canReadInspections: true,
      canFillInspections: false,
      canManageInspectionTemplates: false,
    };
    const fetchMock = mockInspectionApi(false, (url) => {
      if (
        !url.pathname.endsWith("/context") ||
        url.searchParams.has("enterpriseKey")
      ) {
        return undefined;
      }
      const store = {
        ...enterprise,
        kind: "store",
        storeId: scope.storeId,
        officialName: "东门店",
        retired: false,
      };
      return url.searchParams.has("cursor")
        ? jsonResponse({
            items: [
              {
                ...enterprise,
                enterpriseKey: "other",
                enterpriseName: "其他企业",
              },
            ],
            nextCursor: null,
          })
        : jsonResponse({
            items: hasStore ? [enterprise, store] : [enterprise],
            nextCursor: "more-context",
          });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp({
      session: inspectingEmployeeSession,
      initialEntries: ["/inspections"],
    });

    await screen.findByRole("option", { name: "样例企业" });
    expect(screen.getByLabelText("企业")).toHaveValue(
      hasStore ? scope.enterpriseKey : "",
    );
    if (hasStore) {
      await screen.findByRole("option", { name: "东门店" });
      expect(screen.getByLabelText("门店")).toHaveValue("");
      expect(screen.queryByRole("button", { name: "加载更多" })).toBeNull();
    } else {
      expect(screen.getByLabelText("门店")).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "加载更多" }));
      await screen.findByRole("option", { name: "其他企业" });
      expect(screen.getByLabelText("企业")).toHaveValue("");
    }
  },
);

it("shows the fixed SOP and missing photo without offering writes to a read-only store", async () => {
  vi.stubGlobal("fetch", mockInspectionApi(false));
  await openSheet();

  expect(await screen.findByText("检查冷柜内部。")).toBeInTheDocument();
  expect(screen.getByText("缺少 1 项必填答案")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "保存答案" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText("原图")).not.toBeInTheDocument();
});

it("creates a sheet and recovers a lost staged photo without losing the other answers", async () => {
  let created = false;
  let attached = false;
  let uploadCount = 0;
  let patchCount = 0;
  let request: InspectionsPatchesBody | undefined;
  const photoId = id(20);
  const replacementId = id(21);
  const original = new File(["fixture"], "cold-room.png", {
    type: "image/png",
  });
  const fetchMock = mockInspectionApi(true, (url, init) => {
    if (url.pathname.endsWith("/day")) {
      return jsonResponse({
        items: created ? [template, sheet] : [template],
        nextCursor: null,
      });
    }
    if (url.pathname.endsWith("/sheets") && init?.method === "POST") {
      expect(JSON.parse(String(init.body))).toMatchObject({
        ...scope,
        templateId: template.templateId,
      });
      created = true;
      return jsonResponse({
        sheetId: sheet.sheetId,
        templateVersionId: sheet.templateVersionId,
        sheetRevision: 1,
        status: "active",
      });
    }
    if (url.pathname.endsWith("/photos") && init?.method === "POST") {
      const body = init.body as FormData;
      expect(new Headers(init.headers).get("x-csrf-token")).toBe(
        inspectingEmployeeSession.csrfToken,
      );
      expect(new Headers(init.headers).has("content-type")).toBe(false);
      expect(body.get("file")).toEqual(original);
      expect(body.get("storeId")).toBe(scope.storeId);
      return jsonResponse({
        ...scope,
        photoId: ++uploadCount === 1 ? photoId : replacementId,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });
    }
    if (url.pathname.endsWith("/patches")) {
      request = JSON.parse(String(init?.body)) as InspectionsPatchesBody;
      if (++patchCount === 1)
        return jsonResponse({
          results: [
            {
              sheetId: sheet.sheetId,
              status: "failed",
              error: {
                code: "INSPECTION_NOT_FOUND",
                message: "The requested action is unavailable.",
              },
            },
          ],
        });
      attached = true;
      return jsonResponse({
        results: [
          {
            sheetId: sheet.sheetId,
            templateVersionId: sheet.templateVersionId,
            sheetRevision: 2,
            status: "applied",
            progress: "complete",
            missingRequiredCount: 0,
            missingRequired: [],
          },
        ],
      });
    }
    if (attached && url.pathname.endsWith(`/sheets/${sheet.sheetId}`)) {
      return jsonResponse(
        readResponse(
          question.answers.map((answer) =>
            answer.componentId === id(8)
              ? { ...answer, value: [replacementId], componentRevision: 1 }
              : answer,
          ),
          2,
        ),
      );
    }
  });
  vi.stubGlobal("fetch", fetchMock);
  await selectScope();
  expect(await screen.findByText("该日暂无有效巡检卷。")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "建卷" }));
  const upload = await screen.findByLabelText("原图");
  fireEvent.change(screen.getByLabelText("评价"), {
    target: { value: "冷柜干净" },
  });
  fireEvent.change(upload, { target: { files: [original] } });
  expect(
    await screen.findByRole("img", { name: "cold-room.png" }),
  ).toHaveAttribute("src", `/api/web/v1/inspections/photos/${photoId}`);
  expect(screen.getByText("缺少 1 项必填答案")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "保存答案" }));
  expect(
    await screen.findByText(
      "一张或多张待挂接的照片不可用，可重新上传或撤销后再保存。",
    ),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("评价")).toHaveValue("冷柜干净");
  expect(screen.getByText("缺少 1 项必填答案")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重新上传" }));
  await waitFor(() =>
    expect(screen.getByRole("img", { name: "cold-room.png" })).toHaveAttribute(
      "src",
      `/api/web/v1/inspections/photos/${replacementId}`,
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "保存答案" }));
  expect(await screen.findByText("已填完")).toBeInTheDocument();
  expect(request?.patches[0]?.changes).toEqual([
    { componentId: id(7), op: "fill", value: "冷柜干净" },
    { componentId: id(8), op: "appendPhotos", photoIds: [replacementId] },
  ]);
});

it("keeps the draft after a concurrent write and saves against the new revision only after explicit comparison", async () => {
  const requests: InspectionsPatchesBody[] = [];
  let answer = {
    componentId: id(7),
    componentRevision: 0,
    value: null,
  } as InspectionsSheetsReadResponse["questions"][number]["answers"][number];
  vi.stubGlobal(
    "fetch",
    mockInspectionApi(true, (url, init) => {
      if (url.pathname.endsWith(`/sheets/${sheet.sheetId}`)) {
        return jsonResponse(
          readResponse(
            question.answers.map((candidate) =>
              candidate.componentId === answer.componentId ? answer : candidate,
            ),
            answer.componentRevision + 1,
          ),
        );
      }
      if (url.pathname.endsWith("/patches")) {
        requests.push(JSON.parse(String(init?.body)) as InspectionsPatchesBody);
        if (requests.length === 1) {
          answer = { ...answer, value: "同事已填写", componentRevision: 1 };
          return jsonResponse({
            results: [
              {
                sheetId: sheet.sheetId,
                status: "conflict",
                error: {
                  code: "INSPECTION_CONFLICT",
                  message: "Changed",
                  details: { reason: "nonempty" },
                },
              },
            ],
          });
        }
        answer = { ...answer, value: "我的现场评价", componentRevision: 2 };
        return jsonResponse({
          results: [
            {
              sheetId: sheet.sheetId,
              templateVersionId: sheet.templateVersionId,
              sheetRevision: 3,
              status: "applied",
              progress: "incomplete",
              missingRequiredCount: 1,
              missingRequired: [
                { questionId: question.questionId, componentId: id(8) },
              ],
            },
          ],
        });
      }
    }),
  );
  await openSheet();

  fireEvent.change(await screen.findByLabelText("评价"), {
    target: { value: "我的现场评价" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存答案" }));
  fireEvent.click(await screen.findByRole("button", { name: "重读当前卷" }));
  expect(await screen.findByText("同事已填写")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "保存答案" })).toBeDisabled();
  expect(requests[0]?.patches[0]?.changes).toEqual([
    { componentId: id(7), op: "fill", value: "我的现场评价" },
  ]);
  expect(requests).toHaveLength(1);

  fireEvent.click(
    screen.getByRole("button", { name: "确认以当前版本继续编辑" }),
  );
  expect(screen.getByLabelText("评价")).toHaveValue("我的现场评价");
  expect(requests).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "保存答案" }));

  await waitFor(() =>
    expect(requests[1]?.patches[0]?.changes).toEqual([
      {
        componentId: id(7),
        op: "set",
        expectedComponentRevision: 1,
        value: "我的现场评价",
      },
    ]),
  );
  expect(await screen.findByText("答案已保存。")).toBeInTheDocument();
});

it("shows added and renamed titles before confirming replacement", async () => {
  vi.stubGlobal(
    "fetch",
    mockInspectionApi(true, (url) => {
      if (!url.pathname.endsWith("/replacement")) return;
      expect(url.searchParams.get("includeTitles")).toBe("true");
      return jsonResponse({
        sheetId: sheet.sheetId,
        sourceTemplateVersionId: sheet.templateVersionId,
        targetTemplateVersionId: id(24),
        expectedActiveRevision: 2,
        expectedSheetRevision: 1,
        retainedQuestionIds: [],
        clearedQuestionIds: [question.questionId],
        addedQuestionIds: [id(25)],
        removedQuestionIds: [],
        questionTitles: [
          {
            questionId: question.questionId,
            sourceTitle: question.title,
            targetTitle: "冷柜消毒",
          },
          { questionId: id(25), targetTitle: "排水沟检查" },
        ],
      });
    }),
  );
  await openSheet();
  fireEvent.click(await screen.findByRole("button", { name: "预览换版" }));
  expect(await screen.findByText("冷柜整洁 → 冷柜消毒")).toBeInTheDocument();
  expect(screen.getByText("排水沟检查")).toBeInTheDocument();
  expect(screen.queryByText(id(25))).not.toBeInTheDocument();
});

it("selects and reuses the 41st authorized photo across sheets without uploading it again", async () => {
  const photoId = id(1040);
  const filled = [20, 20, 1].map((count, index) => ({
    component: {
      componentId: index === 0 ? id(8) : id(108 + index),
      kind: "photo" as const,
      label: index === 2 ? "第三图组" : `图组 ${index + 1}`,
      required: true,
    },
    photoIds: Array.from({ length: count }, (_, at) =>
      id(1000 + index * 20 + at),
    ),
  }));
  const sourceSheet = {
    ...readResponse(question.answers, 2),
    questions: [
      {
        ...question,
        components: [
          ...question.components.filter(({ kind }) => kind !== "photo"),
          ...filled.map(({ component }) => component),
        ],
        answers: [
          ...question.answers.filter(
            ({ componentId }) => componentId !== id(8),
          ),
          ...filled.map(({ component, photoIds }) => ({
            componentId: component.componentId,
            componentRevision: 1,
            value: photoIds,
          })),
        ],
      },
    ],
  };
  const other = { ...sheet, sheetId: id(32), name: "晚班" };
  let patch: InspectionsPatchesBody | undefined;
  vi.stubGlobal(
    "fetch",
    mockInspectionApi(true, (url, init) => {
      if (url.pathname.endsWith("/day"))
        return jsonResponse({ items: [sheet, other], nextCursor: null });
      if (url.pathname.endsWith(`/sheets/${sheet.sheetId}`))
        return jsonResponse(sourceSheet);
      if (url.pathname.endsWith(`/sheets/${other.sheetId}`))
        return jsonResponse({
          ...readResponse(question.answers, 2),
          sheetId: other.sheetId,
          name: other.name,
        });
      if (url.pathname.endsWith("/photos") && init?.method === "POST")
        throw new Error("Reusing a photo must not upload it again");
      if (url.pathname.endsWith("/patches") && init?.method === "POST") {
        patch = JSON.parse(String(init.body)) as InspectionsPatchesBody;
        return jsonResponse({
          results: [
            {
              status: "applied",
              sheetId: other.sheetId,
              templateVersionId: other.templateVersionId,
              sheetRevision: 3,
              progress: "complete",
              missingRequiredCount: 0,
              missingRequired: [],
            },
          ],
        });
      }
    }),
  );
  await openSheet();
  fireEvent.click(
    await screen.findByRole("button", {
      name: "加入待复用照片 第三图组 · 照片 1",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "返回列表" }));
  fireEvent.click(await screen.findByRole("button", { name: "查看 卫生巡检" }));
  expect(
    await screen.findByRole("button", {
      name: "已加入待复用照片 第三图组 · 照片 1",
    }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "返回列表" }));
  fireEvent.click(await screen.findByRole("button", { name: "查看 晚班" }));
  expect(await screen.findByText("待补齐")).toBeInTheDocument();
  fireEvent.change(await screen.findByLabelText("复用照片 · 原图"), {
    target: { value: photoId },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存答案" }));
  await waitFor(() =>
    expect(patch?.patches[0]).toMatchObject({
      sheetId: other.sheetId,
      changes: [
        { op: "appendPhotos", componentId: id(8), photoIds: [photoId] },
      ],
    }),
  );
  await screen.findByText("答案已保存。");
  fireEvent.change(screen.getByLabelText("巡检日期"), {
    target: { value: "2026-11-24" },
  });
  fireEvent.change(screen.getByLabelText("巡检日期"), {
    target: { value: scope.inspectionDate },
  });
  fireEvent.click(await screen.findByRole("button", { name: "查看 晚班" }));
  await screen.findByLabelText("原图");
  expect(screen.queryByLabelText("复用照片 · 原图")).not.toBeInTheDocument();
});
