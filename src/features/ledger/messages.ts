import type { TextDictionary } from "@/i18n/text";

// 台账下载中心的业务文案；由 i18n/messages 合并进全局字典。
// 值顺序固定为 [中文, English]；{name} 占位符由 formatMessage 填充。
export const ledgerMessages = {
  "ledger.title": ["台账 PDF 下载中心", "Ledger PDF downloads"],
  "ledger.intro": [
    "按门店与进货日期查找、核对并下载已生成的台账。",
    "Find, review and download generated ledgers by store and purchase date.",
  ],
  "ledger.access": [
    "仅显示当前账号有权读取的文件。今日未就绪不影响历史可用文件。",
    "Only files you can currently read are shown. Today's pending files do not block available history.",
  ],
  "ledger.loading": [
    "正在读取台账下载信息…",
    "Loading ledger download settings…",
  ],
  "ledger.loadFailed": [
    "无法读取台账下载所需信息。",
    "Unable to load the ledger download settings.",
  ],
  "ledger.retry": ["重试", "Try again"],

  "ledger.filters.title": ["筛选条件", "Filters"],
  "ledger.store": ["门店精确名称", "Exact store name"],
  "ledger.loadedStores": [
    "已加载门店（非完整门店目录）",
    "Loaded stores (not a complete directory)",
  ],
  "ledger.allStores": [
    "留空查询所有受权门店；保留名称原有空格。",
    "Leave empty for all authorized stores. Preserve spaces in the name.",
  ],
  "ledger.startDate": ["进货日期 · 起", "Purchase date · From"],
  "ledger.endDate": ["进货日期 · 止", "Purchase date · To"],
  "ledger.search": ["查询台账", "Find ledgers"],
  "ledger.querying": ["正在查询…", "Finding ledgers…"],

  "ledger.list.title": ["台账文件", "Ledger files"],
  "ledger.listNote": [
    "本批 {count} 项 · 每批最多 {limit} 项",
    "{count} items in this batch · Up to {limit} per batch",
  ],
  "ledger.empty": [
    "本次查询无受权进货记录。请调整筛选条件。",
    "No authorized purchase records match this query. Adjust your filters.",
  ],
  "ledger.initial": ["选择日期后查询台账。", "Choose dates to find ledgers."],
  "ledger.failed": [
    "本批台账读取失败，请重试。",
    "This batch failed to load. Please try again.",
  ],
  "ledger.store.column": ["门店", "Store"],
  "ledger.date": ["进货日期", "Purchase date"],
  "ledger.status": ["状态", "Status"],
  "ledger.size": ["文件大小", "File size"],
  "ledger.actions": ["操作", "Actions"],
  "ledger.selectBatch": [
    "全选本页可下载文件",
    "Select available files on this page",
  ],
  "ledger.selectFile": ["选择 {store} · {date}", "Select {store} · {date}"],
  "ledger.status.ready": ["可下载", "Ready"],
  "ledger.status.pending": ["等待生成", "Pending"],
  "ledger.status.stale": ["待更新", "Out of date"],
  "ledger.status.missing": ["暂无文件", "Missing"],
  "ledger.status.unverified": ["待核验不可用", "Unverified"],
  "ledger.size.unknown": ["大小未知", "Unknown size"],
  "ledger.preview": ["预览", "Preview"],
  "ledger.download": ["下载", "Download"],
  "ledger.download.started": [
    "下载已发起，请查看浏览器下载记录。",
    "Download initiated. Check your browser downloads.",
  ],
  "ledger.previous": ["上一批", "Previous batch"],
  "ledger.next": ["下一批", "Next batch"],
  "ledger.batch": ["第 {batch} 批", "Batch {batch}"],

  "ledger.selection.title": ["已选清单", "Selected files"],
  "ledger.selection.summary": [
    "已选 {files} / {limit} 份 · {stores} 家门店 · {dates} 个日期",
    "{files} / {limit} files · {stores} stores · {dates} dates",
  ],
  "ledger.selection.bytes": [
    "已知大小 {bytes} · 上限 {limit}",
    "Known size {bytes} · Limit {limit}",
  ],
  "ledger.selection.hint": [
    "跨批次、跨查询保留勾选，仅保存在本页内存。刷新页面会清空。",
    "Selections span batches and queries and live only in this page. Reloading clears them.",
  ],
  "ledger.selection.empty": ["尚未选择任何文件。", "No files selected yet."],
  "ledger.selection.order": [
    "已选文件按文件大小从大到小排列。",
    "Selected files, largest known size first.",
  ],
  "ledger.selection.remove": ["移除", "Remove"],
  "ledger.selection.clear": ["清空选择", "Clear selection"],
  "ledger.selection.details": ["查看已选文件", "Review selected files"],
  "ledger.selection.limits": [
    "每次最多 {files} 份 · {stores} 家门店 · {dates} 个不同日期 · 原 PDF 合计 {bytes}。查询跨度最多 {days} 天。",
    "Up to {files} files · {stores} stores · {dates} distinct dates · {bytes} of original PDFs. Query spans up to {days} days.",
  ],
  "ledger.selection.unknown": [
    "{unknown} 份大小未知，{invalid} 份待核验或不可用；请核验或移除后提交。",
    "{unknown} sizes unknown; {invalid} files unverified or unavailable. Recheck or remove them before submitting.",
  ],
  "ledger.selection.overFiles": [
    "已选 {files} 份，超过上限 {limit} 份，请取消 {excess} 份。",
    "Selected {files} files, exceeding the {limit}-file limit by {excess}. Remove some files.",
  ],
  "ledger.selection.overBytes": [
    "已知大小 {bytes}，超过上限 {limit}，超出 {excess}，请取消部分文件。",
    "Known size {bytes} exceeds the {limit} limit by {excess}. Remove some files.",
  ],
  "ledger.selection.overStores": [
    "已选 {stores} 家门店，超过上限 {limit} 家，请取消部分文件。",
    "Selected files span {stores} stores, exceeding the {limit}-store limit. Remove some files.",
  ],
  "ledger.selection.overDates": [
    "已选 {dates} 个日期，超过上限 {limit} 个，请取消部分文件。",
    "Selected files span {dates} dates, exceeding the {limit}-date limit. Remove some files.",
  ],

  "ledger.prepare": ["打包下载 ZIP", "Prepare ZIP"],
  "ledger.preparing": ["正在核验清单…", "Checking the selection…"],
  "ledger.prepare.disabled.empty": [
    "请先选择可下载的台账",
    "Select available ledgers first",
  ],
  "ledger.prepare.disabled.conflict": [
    "请先处理版本冲突",
    "Resolve the version conflict first",
  ],
  "ledger.confirm.title": ["确认打包下载", "Confirm ZIP preparation"],
  "ledger.confirm.description": [
    "服务器会按本次固定清单生成 ZIP。提交后清单不再随勾选变化。",
    "The server prepares a ZIP from this fixed selection. Later selection changes do not affect the task.",
  ],
  "ledger.confirm.summary": [
    "本次清单：{files} 份 · {stores} 家门店 · {dates} 个日期 · 已知大小 {bytes}",
    "Selection: {files} files · {stores} stores · {dates} dates · {bytes} known size",
  ],
  "ledger.confirm.fixed": [
    "任务提交后可在任务历史中领取下载链接；链接短时有效。",
    "After submitting, request the download link from the task history. Links are short-lived.",
  ],
  "ledger.confirm.confirm": ["确认打包", "Prepare ZIP"],
  "ledger.confirm.cancel": ["取消", "Cancel"],

  "ledger.preview.title": ["PDF 预览", "PDF preview"],
  "ledger.preview.empty": [
    "选择一份可用台账核对内容。",
    "Choose an available ledger to review.",
  ],
  "ledger.preview.loading": [
    "正在加载 PDF…其他文件仍可操作。",
    "Loading PDF… Other files remain available.",
  ],
  "ledger.preview.failed": [
    "PDF 无法显示，请重试或直接下载查看。",
    "The PDF could not be displayed. Retry or download it.",
  ],
  "ledger.preview.retry": ["重试", "Retry"],
  "ledger.preview.close": ["关闭", "Close"],
  "ledger.preview.hint": [
    "使用浏览器 PDF 工具翻页和缩放。无法显示时，可直接下载查看。",
    "Use the browser PDF controls to page and zoom. If the viewer is unavailable, download the file.",
  ],
  "ledger.preview.frameTitle": [
    "PDF 预览 · {store} · {date}",
    "PDF preview · {store} · {date}",
  ],

  "ledger.tasks.title": ["任务历史", "Task history"],
  "ledger.tasks.hint": [
    "仅记录本会话内的打包任务，刷新后不保留。",
    "ZIP tasks from this session only. Not retained after reload.",
  ],
  "ledger.tasks.empty": ["尚未发起打包任务。", "No ZIP tasks yet."],
  "ledger.tasks.item": [
    "{time} · 固定清单 {files} 份",
    "{time} · {files} files",
  ],
  "ledger.tasks.detail": ["查看清单", "View files"],
  "ledger.task.queued": ["排队中", "Queued"],
  "ledger.task.running": ["正在打包", "Preparing ZIP"],
  "ledger.task.succeeded": [
    "打包完成，可领取下载链接",
    "ZIP ready; request a download link",
  ],
  "ledger.task.failed": ["打包失败", "Failed"],
  "ledger.task.partial_failed": ["任务未完整完成", "Task incomplete"],
  "ledger.task.superseded": ["任务已替代", "Superseded"],
  "ledger.task.unknown": ["状态：{status}", "Status: {status}"],
  "ledger.task.link": ["领取下载链接", "Get download link"],
  "ledger.task.linking": [
    "正在核验并领取…",
    "Checking access and getting link…",
  ],
  "ledger.task.expires": ["本次链接到期：{time}", "This link expires: {time}"],
  "ledger.task.issued": [
    "下载已发起，请查看浏览器下载记录。",
    "Download initiated. Check your browser downloads.",
  ],
  "ledger.task.pollFailed": [
    "状态查询失败，请重试。",
    "Status check failed. Please retry.",
  ],
  "ledger.task.retryPoll": ["重试查询", "Retry check"],
  "ledger.task.reprepare": [
    "重新准备当前清单",
    "Prepare the current selection again",
  ],
  "ledger.task.waiting": [
    "正在打包，进度会自动更新。",
    "Preparing the ZIP; progress updates automatically.",
  ],
  "ledger.task.hint": [
    "任务最长处理 {minutes} 分钟；生成的包保留 {hours} 小时，领取的链接最长 15 分钟有效。",
    "Tasks run for up to {minutes} minutes; packages are retained for {hours} hours and links last up to 15 minutes.",
  ],
  "ledger.task.selection": [
    "本次固定清单：{count} 份。后续勾选不会改变此任务。",
    "Fixed selection: {count} files. Later selections do not change this task.",
  ],

  "ledger.conflict.description": [
    "服务端拒绝了本次提交：{reason}。已选清单已保留，请先重新核验，或用当前清单明确重新提交。",
    "The server rejected this submission: {reason}. Your selection is retained. Recheck access, or explicitly resubmit the current selection.",
  ],
  "ledger.conflict.selection": ["已选清单", "Selected files"],
  "ledger.conflict.serverScope": [
    "服务端未接受本次清单",
    "The server did not accept this selection",
  ],
  "ledger.conflict.request": ["提交标识", "Submission reference"],
  "ledger.conflict.serverRequest": [
    "已失效或与本次不一致",
    "Expired or inconsistent with this submission",
  ],
  "ledger.conflict.reloadFailed": [
    "重新核验失败，请重试。",
    "Recheck failed. Please try again.",
  ],

  "ledger.errors.BROWSER_SIGN_IN_REQUIRED": [
    "网页登录已失效。已选清单保留在此页；请重新登录后返回。",
    "Your browser sign-in expired. Your selection remains on this page. Sign in again and return.",
  ],
  "ledger.errors.BROWSER_SECURITY_CHECK_FAILED": [
    "安全上下文已变化，请重新核验后操作。",
    "The security context changed. Recheck access before continuing.",
  ],
  "ledger.errors.BROWSER_ACCESS_DENIED": [
    "当前账号没有读取台账的权限。",
    "Your account does not have permission to read ledgers.",
  ],
  "ledger.errors.NETWORK_ERROR": [
    "网络请求失败。筛选和清单已保留，请重试。",
    "Network request failed. Filters and selection are retained. Retry when ready.",
  ],
  "ledger.errors.INTERNAL_ERROR": [
    "服务暂时无法完成请求，请稍后重试。",
    "The service could not complete this request. Please retry later.",
  ],
  "ledger.errors.INVALID_RESPONSE": [
    "服务器返回了无法解析的响应，请重试。",
    "The server returned a response that could not be read. Please retry.",
  ],
  "ledger.errors.WEB_API_INVALID_REQUEST": [
    "提交的内容无效，请检查后重试。",
    "The submitted content is invalid. Check it and try again.",
  ],
  "ledger.errors.LEDGER_PDF_NOT_ENABLED": [
    "台账交付服务暂不可用，请稍后重试或联系管理员。",
    "Ledger delivery is currently unavailable. Retry later or contact your administrator.",
  ],
  "ledger.errors.LEDGER_SCOPE_INVALID": [
    "请核对门店原名及有效日期，起始日期不能晚于结束日期。",
    "Check the exact store name and valid dates. From cannot be later than To.",
  ],
  "ledger.errors.LEDGER_SCOPE_LIMIT_EXCEEDED": [
    "查询或清单超过数量、门店或日期限制，请缩小范围。",
    "The query or selection exceeds file, store or date limits. Reduce the scope.",
  ],
  "ledger.errors.LEDGER_CURSOR_INVALID": [
    "本批游标已失效，请重新查询；已选清单仍保留。",
    "This batch cursor expired. Search again; selected files are retained.",
  ],
  "ledger.errors.LEDGER_REQUEST_INVALID": [
    "任务请求无效，请重新准备。",
    "Invalid task request. Prepare a new task.",
  ],
  "ledger.errors.LEDGER_IDEMPOTENCY_CONFLICT": [
    "此请求对应不同清单，请明确重新准备当前清单。",
    "This request belongs to a different selection. Prepare the current selection again.",
  ],
  "ledger.errors.LEDGER_PDF_UNAVAILABLE": [
    "文件或任务当前不可读取，请重新核验账号与清单。",
    "The file or task is unavailable. Recheck your account and selection.",
  ],
  "ledger.errors.LEDGER_PDF_NOT_READY": [
    "所选文件尚未全部就绪。请等待每日更新，其他历史可用文件仍可下载。",
    "Some selected files are not ready. Wait for daily processing; other available historical files remain downloadable.",
  ],
  "ledger.errors.LEDGER_PDF_BUNDLE_STALE": [
    "下载包已过期或内容失效，请重新核验并准备。",
    "The package expired or its content changed. Recheck and prepare again.",
  ],
  "ledger.errors.LEDGER_DOWNLOAD_REBUILD_REQUIRED": [
    "需要重新核验并准备下载包。",
    "Recheck your selection and prepare a new package.",
  ],
  "ledger.errors.AUTHORIZATION_VERSION_CONFLICT": [
    "权限已变化，请重新核验全部已选文件。",
    "Permissions changed. Recheck all selected files.",
  ],
  "ledger.errors.LEDGER_PDF_BUNDLE_LIMIT_EXCEEDED": [
    "原 PDF 合计超过容量限制，请取消部分文件。",
    "Original PDF size exceeds the limit. Remove some files.",
  ],
  "ledger.errors.VERSION_CONFLICT": [
    "配置已在你编辑期间更新，请比较后再提交。",
    "The configuration changed while you were editing. Compare the versions before submitting.",
  ],
  "ledger.errors.LEDGER_SELECTION_INVALID": [
    "所选文件尚未全部就绪或不可用，请重新核验后提交。",
    "The selected files are not all ready or available. Recheck and submit again.",
  ],
  "ledger.errors.LEDGER_SELECTION_EMPTY": [
    "请先选择可下载的台账。",
    "Select available ledgers first.",
  ],
} as const satisfies TextDictionary;

/** 用 {name} 占位符填充文案；缺失值保留占位符，避免静默丢字段。 */
export function formatMessage(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}
