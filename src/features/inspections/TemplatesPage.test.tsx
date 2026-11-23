import { fireEvent, screen, waitFor, within } from "@testing-library/react";
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
  category: "",
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

function setup(existing = false) {
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
          ],
          nextCursor: null,
        });
      if (method === "GET" && pathname.endsWith("/templates"))
        return jsonResponse({
          items:
            templateId === null
              ? []
              : [{ ...status(), title: definition.title }],
          nextCursor: null,
        });
      if (method === "GET" && pathname.endsWith("/" + templateId)) {
        const cursor = searchParams.get("cursor");
        pageReads.push(cursor);
        const questions = definition.questions.map((question) => ({
          ...question,
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
      if (pathname.endsWith("/activate")) activeRevision = draftRevision;
      if (pathname.endsWith("/deactivate")) activeRevision = null;
      return jsonResponse(status());
    }),
  );
  renderApp({
    session: templateMaintainerSession,
    initialEntries: ["/inspections/templates"],
  });
  return {
    writes,
    pageReads,
    updateElsewhere: () => {
      draftRevision += 1;
      definition = { ...definition, title: "另一位维护人保存的模板" };
    },
  };
}

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
  expect(screen.getByRole("button", { name: "启用模板" })).toBeDisabled();
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

it("loads every preview page before saving and keeps edits after a revision conflict", async () => {
  const { writes, pageReads, updateElsewhere } = setup(true);
  fireEvent.click(
    await screen.findByRole("button", { name: "服务器草稿 · 未启用" }),
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
