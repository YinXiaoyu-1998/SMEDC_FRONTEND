import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import type { TemplateDefinition } from "@/api/inspection-templates";
import { templateMaintainerSession } from "@/test/fixtures";
import { jsonResponse } from "@/test/http";
import { renderApp } from "@/test/renderApp";

const enterpriseKey = "ent-1";
const storeId = "7f31ac52-b329-4647-8e7e-c103ac448a03";
const existingId = "526311aa-e44f-4840-a15f-91b370ff6832";
const activeVersion = "580dbc92-9e76-44c4-b944-f69edeec86ab";
const bothQuestions = ["第一题", "第二题"].map((title) => ({
  questionId: crypto.randomUUID(),
  title,
  components: [],
}));
const capabilities = {
  canReadInspections: false,
  canFillInspections: false,
  canManageInspectionTemplates: true,
};
type Write = {
  path: string;
  method: string;
  csrf: string | null;
  body: unknown;
};

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function setup(existing = false, otherEnterprise = false) {
  let allowed = true;
  let denied = false;
  let templateId: string | null = existing ? existingId : null;
  let definition: TemplateDefinition = {
    title: "服务器草稿",
    storeIds: [storeId],
    copyMode: "single",
    questions: existing ? bothQuestions : [],
  };
  let draftRevision = existing ? 1 : 0;
  let activeRevision: number | null = null;
  const writes: Write[] = [];
  const pageReads: (string | null)[] = [];
  const status = () => ({
    templateId,
    draftRevision,
    activeTemplateVersionId: activeRevision === null ? null : activeVersion,
    activeRevision,
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const { pathname, searchParams } = new URL(
        String(input),
        "https://app.example",
      );
      const method = init?.method ?? "GET";
      if (pathname.endsWith("/context"))
        return jsonResponse({
          items: [
            ...(allowed
              ? [
                  {
                    kind: "enterprise",
                    enterpriseKey,
                    enterpriseName: "体验企业",
                    ...capabilities,
                  },
                  {
                    kind: "store",
                    enterpriseKey,
                    enterpriseName: "体验企业",
                    storeId,
                    officialName: "体验门店",
                    retired: false,
                    ...capabilities,
                  },
                ]
              : []),
            ...(otherEnterprise
              ? [
                  {
                    kind: "enterprise",
                    enterpriseKey: "other-ent",
                    enterpriseName: "仍可管理的企业",
                    ...capabilities,
                  },
                ]
              : []),
          ],
          nextCursor: null,
        });
      if (method === "GET" && pathname.endsWith("/templates"))
        return jsonResponse({
          items:
            templateId === null ||
            searchParams.get("enterpriseKey") === "other-ent"
              ? []
              : [{ ...status(), title: definition.title }],
          nextCursor: null,
        });
      if (method === "GET" && pathname.endsWith("/" + templateId)) {
        if (denied)
          return jsonResponse(
            { error: { code: "INSPECTION_FORBIDDEN", message: "not allowed" } },
            403,
          );
        const cursor = searchParams.get("cursor");
        pageReads.push(cursor);
        const questions = definition.questions.map((question) => ({
          ...question,
          category: "原表章节",
          questionRevision: 1,
        }));
        const page = existing
          ? cursor
            ? questions.slice(1)
            : questions.slice(0, 1)
          : questions;
        return jsonResponse({
          ...status(),
          draft: { ...definition, templateId, draftRevision, questions: page },
          issues: [],
          staticMaxTenths: 125,
          nextCursor: existing && !cursor ? "page-2" : null,
        });
      }
      const body = JSON.parse(String(init?.body)) as {
        templateId?: string;
        definition?: TemplateDefinition;
        expectedDraftRevision?: number;
      };
      writes.push({
        path: pathname,
        method,
        csrf: new Headers(init?.headers).get("x-csrf-token"),
        body,
      });
      if (
        pathname.endsWith("/templates/active") &&
        !body.definition?.storeIds.length
      ) {
        return jsonResponse(
          {
            error: {
              code: "INSPECTION_INVALID",
              message: "Invalid inspection request.",
              details: {
                field: "storeIds",
                issues: [
                  {
                    field: "storeIds",
                    message: "Choose at least one applicable store.",
                  },
                ],
              },
            },
          },
          400,
        );
      }
      if (body.templateId) templateId = body.templateId;
      if (
        body.expectedDraftRevision !== undefined &&
        body.expectedDraftRevision !== draftRevision
      )
        return jsonResponse(
          { error: { code: "INSPECTION_CONFLICT", message: "revision" } },
          409,
        );
      if (body.definition) definition = body.definition;
      draftRevision += 1;
      if (
        pathname.endsWith("/activate") ||
        pathname.endsWith("/templates/active")
      )
        activeRevision = draftRevision;
      if (pathname.endsWith("/deactivate")) activeRevision = null;
      return jsonResponse(status());
    }),
  );
  const { queryClient } = renderApp({
    session: templateMaintainerSession,
    initialEntries: ["/inspections/templates"],
  });
  return {
    async revokeDetails() {
      denied = true;
      await queryClient.invalidateQueries({
        queryKey: ["inspection-templates"],
      });
    },
    async revokeContext() {
      allowed = false;
      await queryClient.invalidateQueries({
        queryKey: ["inspection-template-context"],
      });
    },
    writes,
    pageReads,
    updateElsewhere: () => {
      draftRevision += 1;
      definition = { ...definition, title: "另一位维护人保存的模板" };
    },
  };
}

it("reports missing fields and creates a usable template in one request when corrected", async () => {
  const { writes } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "新建模板" }));
  fireEvent.change(screen.getByLabelText("模板名称"), {
    target: { value: "闭店巡检" },
  });
  fireEvent.click(screen.getByRole("button", { name: "创建并启用" }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("适用门店");
  expect(
    screen.queryByRole("button", { name: /闭店巡检 ·/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("模板名称")).toHaveValue("闭店巡检");

  fireEvent.change(screen.getByLabelText("同店同日份数"), {
    target: { value: "single" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "体验门店" }));
  fireEvent.click(screen.getByRole("button", { name: "添加题目" }));
  fireEvent.change(screen.getByLabelText("题目名称"), {
    target: { value: "台面" },
  });
  fireEvent.change(screen.getByLabelText("标准说明"), {
    target: { value: "干燥整洁" },
  });
  fireEvent.change(screen.getByLabelText("组件类型"), {
    target: { value: "comment" },
  });
  fireEvent.click(screen.getByRole("button", { name: "添加组件" }));
  screen.getAllByLabelText("组件标签").forEach((field, index) =>
    fireEvent.change(field, {
      target: { value: index ? "观察结果" : "标准" },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "创建并启用" }));
  expect(
    await screen.findByRole("button", { name: "闭店巡检 · 已启用" }),
  ).toBeInTheDocument();
  expect(writes).toHaveLength(2);
  expect(
    writes.every(
      ({ method, path }) =>
        method === "POST" && path.endsWith("/templates/active"),
    ),
  ).toBe(true);
  expect(screen.getByRole("button", { name: "停用模板" })).toBeEnabled();
});

it("saves all five component kinds with stable identities and activates only the saved revision", async () => {
  const { writes } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "新建模板" }));
  fireEvent.change(screen.getByLabelText("模板名称"), {
    target: { value: "卫生检查" },
  });
  fireEvent.change(screen.getByLabelText("同店同日份数"), {
    target: { value: "single" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "体验门店" }));
  fireEvent.click(screen.getByRole("button", { name: "添加题目" }));
  fireEvent.change(screen.getByLabelText("题目名称"), {
    target: { value: "洗手池清洁" },
  });
  fireEvent.change(screen.getByLabelText("标准说明"), {
    target: { value: "台面干燥；遇有积水则补拍。" },
  });
  for (const value of ["score", "comment", "photo", "status"]) {
    fireEvent.change(screen.getByLabelText("组件类型"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "添加组件" }));
  }
  screen
    .getAllByLabelText("组件标签")
    .forEach((field, index) =>
      fireEvent.change(field, { target: { value: `检查项目 ${index + 1}` } }),
    );
  fireEvent.change(screen.getByLabelText("最低分"), { target: { value: "0" } });
  fireEvent.change(screen.getByLabelText("最高分"), {
    target: { value: "12.5" },
  });
  fireEvent.click(
    within(screen.getByRole("group", { name: "评分 2" })).getByRole(
      "checkbox",
      { name: "作答必填" },
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "添加状态选项" }));
  fireEvent.change(screen.getByLabelText("选项名称"), {
    target: { value: "正常" },
  });
  expect(
    screen.queryByRole("button", { name: /^(上移|下移)$/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "启用模板" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "启用模板" })).toBeEnabled(),
  );
  const write = writes[0]!;
  expect(write.csrf).toBe(templateMaintainerSession.csrfToken);
  expect(write.body).toMatchObject({
    enterpriseKey,
    definition: {
      storeIds: [storeId],
      questions: [
        {
          components: [
            { kind: "sop", text: "台面干燥；遇有积水则补拍。" },
            { kind: "score", minTenths: 0, maxTenths: 125, required: true },
            { kind: "comment" },
            { kind: "photo" },
            { kind: "status", options: [{ label: "正常" }] },
          ],
        },
      ],
    },
  });
  const { definition } = write.body as { definition: TemplateDefinition };
  expect(
    new Set(
      definition.questions[0]!.components.map(
        (component) => component.componentId,
      ),
    ).size,
  ).toBe(5);
  fireEvent.click(screen.getByRole("button", { name: "启用模板" }));
  const confirm = await screen.findByRole("dialog", { name: "启用模板" });
  expect(writes).toHaveLength(1);
  fireEvent.click(within(confirm).getByRole("button", { name: "启用模板" }));
  await waitFor(() =>
    expect(writes[1]?.body).toEqual({
      enterpriseKey,
      expectedDraftRevision: 1,
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "停用模板" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "停用模板" }));
  const stop = await screen.findByRole("dialog", { name: "停用模板" });
  expect(writes).toHaveLength(2);
  fireEvent.click(within(stop).getByRole("button", { name: "停用模板" }));
  await waitFor(() =>
    expect(writes[2]?.body).toEqual({
      enterpriseKey,
      expectedDraftRevision: 2,
    }),
  );

  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "停用模板" }),
    ).not.toBeInTheDocument(),
  );
}, 10_000);

it("collapses question fields and saves a whole-card drag reorder by identity", async () => {
  const { writes } = setup(true);
  fireEvent.click(
    await screen.findByRole("button", { name: "服务器草稿 · 未启用" }),
  );
  const first = await screen.findByRole("button", {
    name: "第一题",
    expanded: false,
  });
  expect(
    screen.getByRole("button", { name: "第二题", expanded: false }),
  ).toBeInTheDocument();
  fireEvent.click(first);
  expect(
    screen.getByRole("button", { name: "第一题", expanded: true }),
  ).toBeInTheDocument();
  const firstCard = first.closest("section")!;
  expect(screen.queryByLabelText("题目分类")).not.toBeInTheDocument();
  fireEvent.click(first);
  expect(
    within(firstCard).getByRole("button", { name: "第一题", expanded: false }),
  ).toBeInTheDocument();
  expect(
    within(firstCard).queryByLabelText("题目名称"),
  ).not.toBeInTheDocument();
  expect(
    within(firstCard).getByRole("button", { name: "复制题目" }),
  ).toBeEnabled();
  expect(
    within(firstCard).getByRole("button", { name: "移除题目" }),
  ).toBeEnabled();
  expect(
    within(firstCard).queryByRole("button", { name: "上移" }),
  ).not.toBeInTheDocument();
  expect(
    within(firstCard).queryByRole("button", { name: "下移" }),
  ).not.toBeInTheDocument();

  const grip = within(firstCard).getByRole("button", {
    name: "拖动题目排序 · 第一题",
  });
  const secondCard = screen
    .getByRole("button", { name: "第二题", expanded: false })
    .closest("section")!;
  // JSDOM does not provide layout, pointer capture, or hit testing.
  const fromPoint = vi.fn(() => secondCard);
  const original = Object.getOwnPropertyDescriptor(
    document,
    "elementFromPoint",
  );
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: fromPoint,
  });
  Object.defineProperties(grip, {
    setPointerCapture: { value: vi.fn() },
    hasPointerCapture: { value: () => true },
  });
  const point = (type: string) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      button: 0,
      clientY: 100,
    });
    Object.defineProperties(event, {
      isPrimary: { value: true },
      pointerId: { value: 1 },
    });
    return event;
  };
  try {
    fireEvent(grip, point("pointerdown"));
    fireEvent(grip, point("pointermove"));
    expect(secondCard).toHaveAttribute("data-drop", "after");
    fireEvent(grip, point("pointerup"));
  } finally {
    if (original) Object.defineProperty(document, "elementFromPoint", original);
    else Reflect.deleteProperty(document, "elementFromPoint");
  }

  fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
  await waitFor(() =>
    expect(writes[0]?.body).toMatchObject({
      definition: { questions: [bothQuestions[1], bothQuestions[0]] },
    }),
  );
  const submitted = writes[0]!.body as { definition: TemplateDefinition };
  for (const question of submitted.definition.questions)
    expect(question).not.toHaveProperty("category");
});

it("loads every preview page before saving and keeps edits after a revision conflict", async () => {
  const { writes, pageReads, updateElsewhere } = setup(true);
  fireEvent.click(
    await screen.findByRole("button", { name: "服务器草稿 · 未启用" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "第一题", expanded: false }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "第二题", expanded: false }),
  );
  await waitFor(() =>
    expect(screen.getAllByLabelText("题目名称")).toHaveLength(2),
  );
  expect(pageReads).toEqual([null, "page-2"]);
  fireEvent.change(screen.getByLabelText("模板名称"), {
    target: { value: "我编辑的模板" },
  });
  updateElsewhere();
  fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
  await screen.findByText("服务器上的草稿已更新。请比较修订后再保存。");
  expect(screen.getByLabelText("模板名称")).toHaveValue("我编辑的模板");
  expect(writes[0]?.body).toMatchObject({
    expectedDraftRevision: 1,
    definition: { questions: bothQuestions },
  });
  fireEvent.click(screen.getByRole("button", { name: "重新读取预览" }));
  await screen.findByText("服务器草稿 · 另一位维护人保存的模板");
  fireEvent.click(
    screen.getByRole("button", { name: "保留本地草稿并采用最新修订" }),
  );
  expect(writes).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
  await waitFor(() =>
    expect(writes[1]?.body).toMatchObject({
      expectedDraftRevision: 2,
      definition: { title: "我编辑的模板", questions: bothQuestions },
    }),
  );
  await screen.findByRole("button", { name: "我编辑的模板 · 未启用" });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "保存草稿" })).toBeDisabled(),
  );
});

it.each(["context", "details"] as const)(
  "hides cached template data after a %s permission change while keeping other enterprises available",
  async (source) => {
    const app = setup(true, true);
    fireEvent.click(
      await screen.findByRole("button", { name: "服务器草稿 · 未启用" }),
    );
    await screen.findByLabelText("模板名称");
    await act(async () => {
      if (source === "context") await app.revokeContext();
      else await app.revokeDetails();
    });

    await waitFor(() =>
      expect(screen.queryByLabelText("模板名称")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "服务器草稿 · 未启用" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "仍可管理的企业" }),
    ).toBeInTheDocument();
  },
);
