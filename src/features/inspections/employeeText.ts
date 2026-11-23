import { WebApiError } from "@/api/client";
import { useText } from "@/i18n/useText";

const messages = {
  enterprise: ["企业", "Enterprise"],
  store: ["门店", "Store"],
  date: ["巡检日期", "Inspection date"],
  choose: ["请选择", "Select"],
  chooseScope: [
    "请选择企业、门店和巡检日期。",
    "Select an enterprise, store, and inspection date.",
  ],
  retired: ["已停用", "Retired"],
  unavailable: [
    "当前范围没有可查看的巡检。",
    "Inspections are unavailable for this selection.",
  ],
  loading: ["正在加载…", "Loading…"],
  retry: ["重试", "Try again"],
  loadMore: ["加载更多", "Load more"],
  moreQuestions: ["显示更多题目", "Show more questions"],
  templates: ["适用模板", "Applicable templates"],
  sheets: ["有效巡检卷", "Active inspection sheets"],
  noTemplates: ["此门店暂无适用模板。", "No templates apply to this store."],
  noSheets: [
    "该日暂无有效巡检卷。",
    "There are no active sheets for this date.",
  ],
  historical: [
    "历史日期可按当前启用模板补建。",
    "Sheets for past dates use the template currently active.",
  ],
  single: ["单份", "Single sheet"],
  multiple: ["多份", "Multiple sheets"],
  create: ["建卷", "Create sheet"],
  name: ["卷名称", "Sheet name"],
  view: ["查看", "View"],
  close: ["返回列表", "Back to list"],
  existing: [
    "已有多份有效卷，请按名称与编号选择。",
    "Multiple sheets already exist. Choose one by name and ID.",
  ],
  uncertainCreate: [
    "建卷结果待确认，请重试同一次操作。",
    "Creation result is uncertain. Retry the same request.",
  ],
  uncreated: ["未建卷", "No sheet created"],
  unfilled: ["未填写", "Unfilled"],
  incomplete: ["未填完", "Incomplete"],
  complete: ["已填完", "Complete"],
  scored: ["已评分", "Scored"],
  points: ["分", "points"],
  subtotal: ["暂计", "Subtotal"],
  sheetId: ["卷编号", "Sheet ID"],
  templateVersion: ["固定模板版", "Pinned template version"],
  sheetRevision: ["卷修订", "Sheet revision"],
  missing: ["缺少 {count} 项必填答案", "{count} required answers missing"],
  required: ["必填", "Required"],
  missingRequired: ["待补", "Missing"],
  readOnly: ["只读", "Read only"],
  empty: ["未作答", "Unanswered"],
  clear: ["清空", "Clear"],
  remove: ["移除", "Remove"],
  undo: ["撤销", "Undo"],
  clearPhotos: ["清空照片", "Clear photos"],
  pending: ["待保存", "Unsaved"],
  photo: ["照片", "Photo"],
  pendingPhoto: ["待挂接照片", "Unattached photo"],
  upload: ["上传照片", "Upload photo"],
  photoError: ["无法读取这张照片。", "This photo could not be loaded."],
  photoType: [
    "请选择 JPEG 或 PNG 原图，大小须在 1 字节至 10 MiB 之间。",
    "Choose a JPEG or PNG original between 1 byte and 10 MiB.",
  ],
  photoExpired: [
    "暂存照片已过期，请重新上传后保存。",
    "This upload expired. Upload it again before saving.",
  ],
  repairUpload: ["重新上传", "Upload again"],
  photoLimit: [
    "每个组件至多 20 张照片。",
    "Each component holds up to 20 photos.",
  ],
  scoreRange: [
    "输入 {min}–{max} 分，最多一位小数。",
    "Enter {min}–{max} points with up to one decimal place.",
  ],
  save: ["保存答案", "Save answers"],
  saved: ["答案已保存。", "Answers saved."],
  changesLimit: [
    "一次最多保存 50 项，请先取消部分改动。",
    "Save up to 50 changes at a time. Revert some edits to continue.",
  ],
  discard: ["取消未保存改动", "Discard unsaved edits"],
  refresh: ["重读当前卷", "Reload current sheet"],
  conflict: [
    "卷已更新，请重读并核对当前答案。草稿仍保留。",
    "The sheet changed. Reload and compare the current answers. Your draft is preserved.",
  ],
  current: ["当前已保存", "Currently saved"],
  proposed: ["我的草稿", "My draft"],
  append: ["待追加", "To append"],
  removePhotos: ["待移除", "To remove"],
  reconcile: [
    "确认以当前版本继续编辑",
    "Confirm edits against the current version",
  ],
  revisedQuestion: [
    "原题已变更。请核对后手动录入仍适用的内容。",
    "The original question changed. Review the draft and manually re-enter any applicable answers.",
  ],
  releaseDraft: ["移除此草稿", "Discard this draft"],
  cancel: ["取消", "Cancel"],
  replace: ["预览换版", "Preview version replacement"],
  noReplacement: [
    "当前没有可替换的启用版本。",
    "There is no active version available to replace this one.",
  ],
  confirmReplace: ["确认换版", "Replace version"],
  replaceDescription: [
    "仅替换当前卷。清空与移除的题目将失去当前答案及照片引用。",
    "Replace the version of this sheet only. Cleared and removed questions lose their current answers and photo references.",
  ],
  retained: ["沿用答案", "Retain answers"],
  cleared: ["清空答案", "Clear answers"],
  removed: ["移除题目", "Remove questions"],
  added: ["新增题目", "Add questions"],
  noItems: ["无", "None"],
  void: ["作废卷", "Void sheet"],
  confirmVoid: ["确认作废", "Confirm void"],
  voidDescription: [
    "作废后该卷退出日常列表，无法继续填写。",
    "The sheet will leave the active list and can no longer be edited.",
  ],
  busyScope: [
    "请等待当前操作完成。",
    "Wait for the current operation to finish.",
  ],
  stalePreview: [
    "预览已失效，请取消并重新比较。",
    "The preview is stale. Cancel and compare again.",
  ],
  blocked: [
    "当前没有访问该巡检或执行此操作的权限。",
    "This inspection or action is unavailable with your current access.",
  ],
  invalid: [
    "提交内容不符合要求。请检查分值、状态或照片后重试。",
    "Check the score, status, or photos and try again.",
  ],
  expiredOrInvalidPhoto: [
    "一张或多张待挂接的照片不可用，可重新上传或撤销后再保存。",
    "One or more pending photos are unavailable. Upload them again or remove them before saving.",
  ],
  limit: ["提交内容超过限制。", "The request exceeds a limit."],
  unavailablePhoto: [
    "原图不受支持，请选择 JPEG 或 PNG。",
    "Choose a supported JPEG or PNG original.",
  ],
  unexpected: [
    "操作未完成，请重试。",
    "The operation could not be completed. Try again.",
  ],
} as const;

export type EmployeeTextKey = keyof typeof messages;
export type EmployeeText = ReturnType<typeof useEmployeeText>;

export function useEmployeeText() {
  const { locale } = useText();
  return (key: EmployeeTextKey, values: Record<string, string | number> = {}) =>
    messages[key][locale === "zh" ? 0 : 1].replace(
      /\{(\w+)\}/g,
      (token, name: string) => String(values[name] ?? token),
    );
}

export function errorText(error: unknown): EmployeeTextKey {
  if (!(error instanceof WebApiError)) return "unexpected";
  switch (error.code) {
    case "INSPECTION_FORBIDDEN":
    case "INSPECTION_NOT_FOUND":
      return "blocked";
    case "INSPECTION_CONFLICT":
    case "INSPECTION_IDEMPOTENCY_CONFLICT":
      return "conflict";
    case "INSPECTION_INVALID":
      return "invalid";
    case "INSPECTION_LIMIT_EXCEEDED":
      return "limit";
    case "INSPECTION_MEDIA_UNSUPPORTED":
      return "unavailablePhoto";
    default:
      return "unexpected";
  }
}
