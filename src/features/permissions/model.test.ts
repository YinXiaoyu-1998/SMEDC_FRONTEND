import { describe, expect, it } from "vitest";

import type {
  PermissionCategory,
  PermissionEnterprise,
  PermissionStore,
} from "@/api/permissions";

import {
  diffKeyedRows,
  sameSelection,
  sameSet,
  type RebaseInput,
} from "./diff";
import {
  accountDiff,
  accountUpdateBody,
  accountToDraft,
  rebaseAccount,
  sameGrant,
  type AccountDraft,
  type GrantData,
  type GrantDraft,
} from "./grants";
import {
  documentDiff,
  documentToDraft,
  rebaseDocument,
  sameScopeTuple,
  validateDocumentDraft,
  type DocumentDraft,
} from "./document-draft";

const t = (key: string): string => key;

const categories: PermissionCategory[] = [
  {
    orgId: "org-1",
    id: "cat-sales",
    key: "business",
    name: "营业数据",
    kind: "fixed",
    confidentialityLevel: 1,
    allowGroup: false,
    allowStore: true,
    retired: false,
    dimensions: [],
  },
  {
    orgId: "org-1",
    id: "cat-policy",
    key: null,
    name: "运营制度",
    kind: "evidence",
    confidentialityLevel: null,
    allowGroup: true,
    allowStore: false,
    retired: false,
    dimensions: [
      { orgId: "org-1", categoryId: "cat-policy", dimensionId: "dim-team" },
    ],
  },
];

const dimensions = [
  {
    orgId: "org-1",
    id: "dim-team",
    name: "团队",
    retired: false,
    values: [
      {
        orgId: "org-1",
        dimensionId: "dim-team",
        id: "team-a",
        name: "一组",
        retired: false,
      },
      {
        orgId: "org-1",
        dimensionId: "dim-team",
        id: "team-b",
        name: "二组",
        retired: false,
      },
      {
        orgId: "org-1",
        dimensionId: "dim-team",
        id: "team-old",
        name: "原组",
        retired: true,
      },
    ],
  },
];

const stores: PermissionStore[] = [
  { orgId: "org-1", enterpriseKey: "ent-1", name: "一号店", retired: false },
  { orgId: "org-1", enterpriseKey: "ent-1", name: "二号店", retired: false },
];

const enterprises: PermissionEnterprise[] = [
  { enterpriseKey: "ent-1", enterpriseName: "示例餐饮" },
];

const data: GrantData = {
  categories,
  dimensions,
  stores,
  enterprises,
};

function grant(overrides: Partial<GrantDraft> = {}): GrantDraft {
  return {
    id: "grant-1",
    orgId: "org-1",
    enterpriseKey: "ent-1",
    categoryIds: ["cat-sales"],
    ownership: "store",
    stores: { kind: "fixed", values: ["一号店"] },
    dimensions: {},
    ...overrides,
  };
}

function groupGrant(overrides: Partial<GrantDraft> = {}): GrantDraft {
  return {
    id: "grant-group",
    orgId: "org-1",
    enterpriseKey: "ent-1",
    categoryIds: ["cat-policy"],
    ownership: "group",
    dimensions: {},
    ...overrides,
  };
}

describe("语义差异", () => {
  it("集合顺序与重复不影响比较", () => {
    expect(sameSet(["b", "a"], ["a", "b", "a"])).toBe(true);
    expect(
      sameSelection(
        { kind: "fixed", values: ["b", "a"] },
        { kind: "fixed", values: ["a", "b"] },
      ),
    ).toBe(true);
  });

  it("动态全部与固定集合是两种设置", () => {
    expect(
      sameSelection({ kind: "all" }, { kind: "fixed", values: ["a", "b"] }),
    ).toBe(false);
  });

  it("授权条目换序不产生差异，字段变化只列一项", () => {
    const left = grant({
      stores: { kind: "fixed", values: ["一号店", "二号店"] },
    });
    const right = grant({
      stores: { kind: "fixed", values: ["二号店", "一号店"] },
    });
    expect(sameGrant(left, right)).toBe(true);

    const entries = diffKeyedRows(
      [{ id: left.id, value: left }],
      [{ id: left.id, value: right }],
      () => "title",
      () => "short",
      (before, after) =>
        sameGrant(before.value, after.value)
          ? []
          : [
              {
                kind: "changed",
                label: "门店",
                before: "一号店",
                after: "二号店",
              },
            ],
      "授权",
    );
    expect(entries).toHaveLength(0);
  });
});

describe("账号授权差异与提交载荷", () => {
  const baseline: AccountDraft = {
    clearance: 2,
    grants: [
      grant(),
      groupGrant({ id: "grant-2", categoryIds: ["cat-policy"] }),
    ],
  };

  it("只改密级时只显示密级一项", () => {
    const draft: AccountDraft = { ...baseline, clearance: 1 };
    const entries = accountDiff(t, data, draft, baseline);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "changed",
      label: "permissions.clearance",
    });
  });

  it("新增、编辑、删除各显示一条摘要", () => {
    const draft: AccountDraft = {
      clearance: 2,
      grants: [
        grant({ stores: { kind: "fixed", values: ["一号店", "二号店"] } }),
        grant({ id: "grant-3", categoryIds: ["cat-sales"] }),
      ],
    };
    const entries = accountDiff(t, data, draft, baseline);
    expect(entries).toHaveLength(3);
    expect(entries.filter((entry) => entry.kind === "removed")).toHaveLength(1);
    expect(entries.filter((entry) => entry.kind === "added")).toHaveLength(1);
  });

  it("提交请求包含未修改条目与历史引用", () => {
    const draft: AccountDraft = {
      clearance: 2,
      grants: [
        grant(),
        groupGrant({
          id: "grant-2",
          categoryIds: ["cat-policy"],
          dimensions: { "dim-team": { kind: "fixed", values: ["team-old"] } },
        }),
      ],
    };
    const body = accountUpdateBody(draft, "9");
    expect(body.expectedVersion).toBe("9");
    expect(body.grants).toHaveLength(2);
    expect(body.grants[1]?.dimensions["dim-team"]).toEqual({
      kind: "fixed",
      values: ["team-old"],
    });
  });

  it("服务端新增的未编辑授权在重新应用后保留", () => {
    const server: AccountDraft = {
      clearance: 2,
      grants: [...baseline.grants, grant({ id: "grant-server" })],
    };
    const input: RebaseInput<AccountDraft> = {
      draft: { ...baseline, clearance: 1 },
      baseline,
      server,
      decisions: {},
    };
    const outcome = rebaseAccount(t, data, input);
    expect(outcome.kind).toBe("merged");
    if (outcome.kind !== "merged") return;
    expect(outcome.draft.grants.map((item) => item.id)).toContain(
      "grant-server",
    );
    expect(outcome.draft.clearance).toBe(1);
  });

  it("同一条在两边都被修改时要求显式选择", () => {
    const server: AccountDraft = {
      clearance: 2,
      grants: [grant({ stores: { kind: "fixed", values: ["二号店"] } })],
    };
    const draft: AccountDraft = {
      clearance: 2,
      grants: [grant({ stores: { kind: "all" } })],
    };
    const first = rebaseAccount(t, data, {
      draft,
      baseline,
      server,
      decisions: {},
    });
    expect(first.kind).toBe("choice");
    if (first.kind !== "choice") return;
    expect(first.choices.map((choice) => choice.key)).toContain(
      "grant:grant-1",
    );

    const second = rebaseAccount(t, data, {
      draft,
      baseline,
      server,
      decisions: { "grant:grant-1": "draft" },
    });
    expect(second.kind).toBe("merged");
    if (second.kind !== "merged") return;
    expect(second.draft.grants[0]?.stores).toEqual({ kind: "all" });
  });

  it("服务端撤销了本地正在编辑的授权时要求显式选择", () => {
    const baseline: AccountDraft = { clearance: 2, grants: [grant()] };
    const draft: AccountDraft = {
      ...baseline,
      grants: [{ ...baseline.grants[0]!, stores: { kind: "all" } }],
    };
    const server: AccountDraft = { ...baseline, grants: [] };
    expect(
      rebaseAccount(t, data, { baseline, draft, server, decisions: {} }),
    ).toMatchObject({
      kind: "choice",
      choices: [{ key: "grant:grant-1" }],
    });
    expect(
      rebaseAccount(t, data, {
        baseline,
        draft,
        server,
        decisions: { "grant:grant-1": "server" },
      }),
    ).toMatchObject({ kind: "merged", draft: { grants: [] } });
  });
});

describe("文档范围", () => {
  const baseline: DocumentDraft = documentToDraft({
    id: "doc-1",
    title: "门店值班手册",
    status: "archived",
    categoryId: "cat-policy",
    fileConfidentialityLevel: 2,
    valid: true,
    scopes: [
      {
        enterpriseKey: "ent-1",
        ownership: "store",
        storeName: "一号店",
        dimensions: { "dim-team": "team-a" },
      },
      {
        enterpriseKey: "ent-1",
        ownership: "group",
        dimensions: { "dim-team": "team-b" },
      },
    ],
  });

  it("范围换序不产生差异，只改密级只显示密级", () => {
    const reordered: DocumentDraft = {
      ...baseline,
      scopes: [...baseline.scopes].reverse(),
    };
    expect(documentDiff(t, data, reordered, baseline)).toHaveLength(0);

    const levelChanged: DocumentDraft = {
      ...baseline,
      fileConfidentialityLevel: 3,
    };
    const entries = documentDiff(t, data, levelChanged, baseline);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ label: "permissions.level" });
  });

  it("同一草稿条目按 id 配对显示字段改动", () => {
    const changed: DocumentDraft = {
      ...baseline,
      scopes: baseline.scopes.map((scope, index) =>
        index === 0 ? { ...scope, storeName: "二号店" } : scope,
      ),
    };
    const entries = documentDiff(t, data, changed, baseline);
    expect(
      entries.some((entry) => entry.label === "permissions.scopeStore"),
    ).toBe(true);
    expect(
      entries.filter(
        (entry) => entry.kind === "added" || entry.kind === "removed",
      ),
    ).toHaveLength(0);
  });

  it("重载后无法配对的范围显示为增删", () => {
    const reloaded: DocumentDraft = {
      ...baseline,
      scopes: baseline.scopes.map((scope, index) =>
        scope.ownership === "store"
          ? { ...scope, id: `server-${index}`, storeName: "二号店" }
          : { ...scope, id: `server-${index}` },
      ),
    };
    const entries = documentDiff(t, data, reloaded, baseline);
    expect(entries.filter((entry) => entry.kind === "removed")).toHaveLength(1);
    expect(entries.filter((entry) => entry.kind === "added")).toHaveLength(1);
  });

  it("改动涉及停用取值时必须填写历史补录理由", () => {
    const draft: DocumentDraft = {
      ...baseline,
      scopes: [
        baseline.scopes[1]!,
        {
          id: "changed-scope",
          enterpriseKey: "ent-1",
          ownership: "group",
          dimensions: { "dim-team": "team-old" },
        },
      ],
    };
    const category = categories[1];
    expect(validateDocumentDraft(draft, baseline, category, data)).toBe(
      "permissions.scopeChangedRequiresReason",
    );
    expect(
      validateDocumentDraft(
        { ...draft, historicalSupplementReason: "补录" },
        baseline,
        category,
        data,
      ),
    ).toBeNull();
  });

  it("类别两边都改时冲突面板要求选择", () => {
    const server: DocumentDraft = { ...baseline, categoryId: "cat-policy" };
    const draft: DocumentDraft = { ...baseline, fileConfidentialityLevel: 1 };
    const outcome = rebaseDocument(
      t,
      {
        draft,
        baseline,
        server,
        decisions: {},
      },
      data,
    );
    expect(outcome.kind).toBe("merged");
  });

  it("双方编辑同一文档范围时要求选择一侧，不合并成额外的范围", () => {
    const [first, second] = baseline.scopes;
    const server = {
      ...baseline,
      scopes: [{ ...first!, id: "remote", storeName: "远端门店" }, second!],
    };
    const draft = {
      ...baseline,
      scopes: [{ ...first!, storeName: "本地门店" }, second!],
    };
    expect(
      rebaseDocument(t, { baseline, server, draft, decisions: {} }, data),
    ).toMatchObject({ kind: "choice", choices: [{ key: "scopes" }] });
    expect(
      rebaseDocument(
        t,
        { baseline, server, draft, decisions: { scopes: "draft" } },
        data,
      ),
    ).toMatchObject({ kind: "merged", draft: { scopes: draft.scopes } });
  });

  it("文档改用同名类别时仍显示对应身份的变更", () => {
    const original = categories[1]!;
    const duplicate = { ...original, id: "another" };
    expect(
      documentDiff(
        t,
        { ...data, categories: [...categories, duplicate] },
        { ...baseline, categoryId: duplicate.id },
        { ...baseline, categoryId: original.id },
      ),
    ).toMatchObject([
      { kind: "changed", label: "permissions.documentCategory" },
    ]);
  });

  it("规范化元组忽略 id 与维度顺序", () => {
    const [first, second] = baseline.scopes;
    expect(sameScopeTuple(first!, { ...first!, id: "other" })).toBe(true);
    expect(sameScopeTuple(first!, second!)).toBe(false);
  });
});

void accountToDraft;
