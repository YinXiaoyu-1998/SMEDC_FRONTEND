import type { Change, Sheet } from "./employeeApi";

export type Question = Sheet["questions"][number];
export type Component = Question["components"][number];
export type Answer = Question["answers"][number];
export type Value = Answer["value"];
export type Upload = {
  id: string;
  startedAt: number;
  file: File;
  photo?: { photoId: string; expiresAt: string } | undefined;
  failed?: boolean | undefined;
};
export type Draft =
  | { kind: "scalar"; text: string }
  | { kind: "append"; uploads: Upload[] }
  | { kind: "remove"; photoIds: string[]; all: boolean };

export type Edit = {
  draft: Draft;
  question: Question;
  component: Exclude<Component, { kind: "sop" }>;
  answer: Answer;
};

export function answerOf(question: Question, componentId: string): Answer {
  return (
    question.answers.find((answer) => answer.componentId === componentId) ?? {
      componentId,
      componentRevision: 0,
      value: null,
    }
  );
}

export function points(tenths: number) {
  return String(tenths / 10);
}

export function answerInput(value: Value) {
  return typeof value === "number"
    ? points(value)
    : typeof value === "string"
      ? value
      : "";
}

export function parseScalar(component: Edit["component"], raw: string) {
  if (component.kind === "status") return raw || null;
  const value = raw.trim();
  if (!value) return null;
  if (component.kind !== "score") return value;
  const parsed = Math.round(Number(value) * 10);
  if (
    !/^(?:\d+(?:\.\d)?|\.\d)$/.test(value) ||
    parsed < component.minTenths ||
    parsed > component.maxTenths
  )
    return undefined;
  return parsed;
}

export function uploadIsReady(upload: Upload) {
  return (
    upload.photo !== undefined &&
    Date.parse(upload.photo.expiresAt) > Date.now()
  );
}

export function changeFor({
  component,
  answer,
  draft,
}: Edit): Change | undefined {
  const { componentId } = component;
  const expectedComponentRevision = answer.componentRevision;
  if (draft.kind === "append") {
    const photoIds = draft.uploads.flatMap((upload) =>
      uploadIsReady(upload) && upload.photo ? [upload.photo.photoId] : [],
    );
    return photoIds.length > 0 && photoIds.length === draft.uploads.length
      ? { op: "appendPhotos", componentId, photoIds }
      : undefined;
  }
  if (draft.kind === "remove") {
    const saved = Array.isArray(answer.value) ? answer.value : [];
    const photoIds = draft.photoIds.filter((id) => saved.includes(id));
    if (photoIds.length === 0) return undefined;
    return draft.all && saved.every((id) => photoIds.includes(id))
      ? { op: "clear", componentId, expectedComponentRevision }
      : {
          op: "removePhotos",
          componentId,
          expectedComponentRevision,
          photoIds,
        };
  }
  const value = parseScalar(component, draft.text);
  if (value === undefined || value === answer.value) return undefined;
  if (value === null)
    return { op: "clear", componentId, expectedComponentRevision };
  if (answer.value === null) return { op: "fill", componentId, value };
  return { op: "set", componentId, value, expectedComponentRevision };
}

export function latestAnswer(edit: Edit, sheet: Sheet) {
  const question = sheet.questions.find(
    (value) => value.questionId === edit.question.questionId,
  );
  if (
    !question ||
    question.questionRevision !== edit.question.questionRevision ||
    !question.components.some(
      (component) => component.componentId === edit.component.componentId,
    )
  )
    return undefined;
  return answerOf(question, edit.component.componentId);
}
