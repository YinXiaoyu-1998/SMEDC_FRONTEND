import type {
  TemplateDefinition,
  TemplatePreview,
} from "@/api/inspection-templates";
import { stableSerialize } from "@/ui/stableSerialize";

type Question = TemplateDefinition["questions"][number];
type Component = Question["components"][number];
type Score = Extract<Component, { kind: "score" }>;
type ScoreInput = Omit<Score, "minTenths" | "maxTenths"> & {
  min: string;
  max: string;
};
export type ComponentInput = Exclude<Component, Score> | ScoreInput;
export type QuestionInput = Omit<Question, "components"> & {
  components: ComponentInput[];
};
export type TemplateDraft = Omit<TemplateDefinition, "questions"> & {
  questions: QuestionInput[];
};

export const componentKinds = [
  "sop",
  "score",
  "comment",
  "photo",
  "status",
] as const;
export type ComponentKind = (typeof componentKinds)[number];

export function draftFromPreview(
  preview: TemplatePreview | null,
): TemplateDraft {
  if (!preview)
    return { title: "", copyMode: null, storeIds: [], questions: [] };
  const { title, copyMode, storeIds, questions } = preview.draft;
  return {
    title,
    copyMode: copyMode ?? null,
    storeIds,
    questions: questions.map(({ questionId, title, components }) => ({
      questionId,
      title,
      components: components.map((component) =>
        component.kind === "score"
          ? {
              kind: "score" as const,
              componentId: component.componentId,
              label: component.label,
              required: component.required,
              min:
                component.minTenths == null
                  ? ""
                  : String(component.minTenths / 10),
              max:
                component.maxTenths == null
                  ? ""
                  : String(component.maxTenths / 10),
            }
          : component,
      ),
    })),
  };
}

function tenths(input: string): number | null {
  if (input === "") return null;
  if (!/^(?:\d+(?:\.\d)?|\.\d)$/.test(input)) return NaN;
  const [integer, decimal] = input.split(".");
  const value = Number(integer) * 10 + Number(decimal ?? 0);
  return value <= 1_000_000 ? value : NaN;
}

export function completeDefinition(
  draft: TemplateDraft,
): TemplateDefinition | null {
  const questions: Question[] = [];
  for (const question of draft.questions) {
    const components: Component[] = [];
    for (const component of question.components) {
      if (component.kind !== "score") {
        components.push(component);
        continue;
      }
      const { min, max, ...fields } = component;
      const minTenths = tenths(min);
      const maxTenths = tenths(max);
      if (
        Number.isNaN(minTenths) ||
        Number.isNaN(maxTenths) ||
        (minTenths !== null && maxTenths !== null && minTenths > maxTenths)
      )
        return null;
      components.push({ ...fields, minTenths, maxTenths });
    }
    questions.push({ ...question, components });
  }
  return { ...draft, questions };
}

export function newComponent(kind: ComponentKind): ComponentInput {
  const base = { componentId: crypto.randomUUID(), label: "" };
  if (kind === "sop") return { ...base, kind, text: "" };
  const answer = { ...base, required: false };
  if (kind === "score") return { ...answer, kind, min: "", max: "" };
  if (kind === "status") return { ...answer, kind, options: [] };
  return { ...answer, kind };
}

export function newQuestion(): QuestionInput {
  return {
    questionId: crypto.randomUUID(),
    title: "",
    components: [newComponent("sop")],
  };
}

export function copyQuestion(question: QuestionInput): QuestionInput {
  return {
    ...question,
    questionId: crypto.randomUUID(),
    components: question.components.map((component) => ({
      ...component,
      componentId: crypto.randomUUID(),
    })),
  };
}

export function sameDraft(a: TemplateDraft, b: TemplateDraft): boolean {
  return stableSerialize(a) === stableSerialize(b);
}

/** Removed server identities stay retired even if their local definitions are kept. */
export function restoreRemovedItems(
  draft: TemplateDraft,
  baseline: TemplateDraft,
  latest: TemplateDraft,
): TemplateDraft {
  const original = new Map(
    baseline.questions.map((question) => [question.questionId, question]),
  );
  const current = new Map(
    latest.questions.map((question) => [question.questionId, question]),
  );
  return {
    ...draft,
    questions: draft.questions.map((question) => {
      const previous = original.get(question.questionId);
      if (!previous) return question;
      const updated = current.get(question.questionId);
      if (!updated) return copyQuestion(question);
      const oldIds = new Set(
        previous.components.map((component) => component.componentId),
      );
      const currentIds = new Set(
        updated.components.map((component) => component.componentId),
      );
      return {
        ...question,
        components: question.components.map((component) =>
          oldIds.has(component.componentId) &&
          !currentIds.has(component.componentId)
            ? { ...component, componentId: crypto.randomUUID() }
            : component,
        ),
      };
    }),
  };
}
