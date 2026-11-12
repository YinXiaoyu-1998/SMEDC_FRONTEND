import type { TextDictionary } from "@/i18n/text";

// 权限设置页的文案：键名按区块分组，措辞沿用旧管理页，避免迁移时改变用户看到的话术
export const permissionsMessages = {
  // 区域导航
  // 权限设置页（F4）：键名按区块分组，文案沿用旧管理页的措辞
  "permissions.tabs.label": ["权限设置区域", "Permission settings sections"],
  "permissions.tabs.categories": ["类别密级", "Category levels"],
  "permissions.tabs.stores": ["门店与业务企业", "Stores and businesses"],
  "permissions.tabs.dimensions": ["业务条件", "Business conditions"],
  "permissions.tabs.accounts": ["账号授权", "Account permissions"],
  "permissions.tabs.documents": ["普通文档", "Documents"],
  "permissions.tabs.readiness": ["检查与启用", "Check and activate"],
  "permissions.intro": [
    "先设置类别密级与业务目录，再为账号授权。保存配置与启用权限是两个独立步骤。",
    "Set category levels and business directories, then grant account access. Saving and activation are separate steps.",
  ],
  "permissions.mode.legacy": [
    "未启用 · 仍按原有规则读取",
    "Not activated · original read rules apply",
  ],
  "permissions.mode.preparing": [
    "准备中 · 仍按原有规则读取",
    "Preparing · original read rules apply",
  ],
  "permissions.mode.enabled": [
    "已启用业务权限",
    "Business permissions enabled",
  ],
  "permissions.mode.suspended": ["业务读取已暂停", "Business reads suspended"],
  "permissions.loading": ["正在读取配置…", "Loading configuration…"],
  "permissions.version": ["配置版本", "Configuration version"],
  "permissions.reload": ["重新读取配置", "Reload configuration"],
  "permissions.save": ["保存", "Save"],
  "permissions.saving": ["正在保存…", "Saving…"],
  "permissions.saved": ["已保存。", "Saved."],
  "permissions.noChange": ["没有需要保存的变更。", "No changes to save."],
  "permissions.confirm.title": ["确认本次变更", "Confirm these changes"],
  "permissions.confirm.action": ["确认变更", "Confirm changes"],
  "permissions.cancel": ["取消", "Cancel"],
  "permissions.discard.title": [
    "重新读取会替换未保存的内容",
    "Reloading replaces unsaved changes",
  ],
  "permissions.discard.description": [
    "当前页面的未保存内容仍保留在后台。请比较后选择是否放弃；不会自动合并或覆盖。",
    "Unsaved fields remain on this page. Compare before discarding; changes are never automatically merged or overwritten.",
  ],
  "permissions.discard.action": [
    "放弃草稿并重新读取",
    "Discard drafts and reload",
  ],
  "permissions.discard.keep": ["保留草稿", "Keep drafts"],
  "permissions.saveBlocked.conflict": [
    "请先处理版本冲突",
    "Resolve the version conflict first",
  ],
  "permissions.required": [
    "请完成必填项；密级、范围和取值不能留空。",
    "Complete the required fields. Levels, scopes and values cannot be empty.",
  ],
  "permissions.differentConditions": [
    "所选类别的业务条件不一致，请拆成不同授权条目。",
    "These categories require different conditions. Use separate grants.",
  ],
  "permissions.invalidGrant": [
    "请核对授权条目的类别、归属、门店和完整业务条件。",
    "Check the grant's categories, ownership, stores and complete conditions.",
  ],
  "permissions.dimensionUnavailable": [
    "所选业务条件已不可用，请重新选择。",
    "A selected condition is unavailable. Choose another.",
  ],
  "permissions.unset": ["未配置", "Not configured"],
  "permissions.notCreated": ["（尚未创建）", "(not created)"],
  "permissions.checkFirst": [
    "请先运行只读准备检查",
    "Run the read-only preparation check first",
  ],
  "permissions.choose": ["请选择", "Choose"],
  "permissions.level": ["密级", "Confidentiality level"],
  "permissions.clearance": ["账号密级", "Account clearance"],
  "permissions.levelHelp": [
    "0–3 级都需要显式业务授权；0 不代表公开，管理员普通读取也需授权。",
    "Every level from 0 to 3 requires an explicit business grant. Level 0 is not public; administrators also need grants for ordinary reads.",
  ],
  "permissions.fixedHelp": [
    "各可读取的固定类别分别配置密级，未配置项不会自动设为 0。",
    "Configure every readable fixed category level. Unset levels are never defaulted to 0.",
  ],
  "permissions.initializeCategories": [
    "补齐资料类别",
    "Add missing categories",
  ],
  "permissions.initializeCategoriesHelp": [
    "补齐服务已支持的资料类别。新增类别的密级保持未配置；请随后设置密级和账号授权。",
    "Add supported categories that are missing. New levels stay unset; configure their levels and account grants afterward.",
  ],
  "permissions.initializeDrafts": [
    "请先保存或处理未保存的草稿，再补齐资料类别。",
    "Save or resolve unsaved drafts before adding missing categories.",
  ],
  "permissions.internalLedger": [
    "原始配送台账仅供内部处理，不提供原始明细、汇总或原件读取。",
    "Raw delivery ledgers remain internal and do not expose rows, summaries or originals.",
  ],
  "permissions.category.business": ["营业数据", "Business data"],
  "permissions.category.dishes": ["菜品销售", "Dish sales"],
  "permissions.category.delivery_ledger": [
    "原始配送台账（内部）",
    "Raw delivery ledger (internal)",
  ],
  "permissions.category.ledger_pdf": ["配送台账 PDF", "Delivery ledger PDF"],
  "permissions.category.quarantine_certificate": [
    "检疫证明",
    "Quarantine certificates",
  ],
  "permissions.category.vip": ["会员资料", "Member data"],
  "permissions.category.dish_catalog": ["菜品目录", "Dish catalog"],
  "permissions.category.supplier_catalog": ["供应商目录", "Supplier catalog"],
  "permissions.category.store_reviews": ["店铺评价", "Store reviews"],
  "permissions.category.cost_cards": ["成本卡", "Cost cards"],
  "permissions.category.takeaway_orders": [
    "平台外卖订单明细",
    "Platform takeaway order details",
  ],
  "permissions.category.in_store_orders": [
    "店内订单明细",
    "In-store order details",
  ],
  "permissions.name": ["名称", "Name"],
  "permissions.retired": ["已停用", "Retired"],
  "permissions.noActiveItems": ["暂无启用项。", "No active items."],
  "permissions.retiredLabel": ["（已停用）", " (retired)"],
  "permissions.retire": [
    "停用此项（保留历史引用）",
    "Retire this item (preserve historical references)",
  ],
  "permissions.active": ["可用", "Available"],
  "permissions.addCategory": ["新增普通文档类别", "Add document category"],
  "permissions.categoryName": ["文档类别名称", "Document category name"],
  "permissions.categoryNameHelp": [
    "例如：运营制度、培训资料",
    "For example: operating policies, training materials",
  ],
  "permissions.evidenceHelp": [
    "普通文档按文件设置密级。类别定义可用的归属与所需业务条件。",
    "Document levels are set per file. Categories define supported ownership and required business conditions.",
  ],
  "permissions.ownership": ["资料归属", "Ownership"],
  "permissions.store": ["门店资料", "Store materials"],
  "permissions.group": ["集团资料", "Group materials"],
  "permissions.groupHelp": [
    "集团资料需要单独授权，不等同于全部门店。",
    "Group materials need a separate grant; all stores does not include group materials.",
  ],
  "permissions.requiredConditions": ["必需业务条件", "Required conditions"],
  "permissions.addDimension": ["新增业务条件", "Add condition"],
  "permissions.addValue": ["新增取值", "Add value"],
  "permissions.values": ["可选取值", "Available values"],
  "permissions.dimensionHelp": [
    "例如项目或部门。不同条件组合用不同授权条目，避免把交叉范围扩大。",
    "For example, project or department. Use separate grants for different tuples to avoid expanding cross-combinations.",
  ],
  "permissions.enterprise": ["业务企业", "Business enterprise"],
  "permissions.enterpriseList": ["已登记的业务企业", "Registered businesses"],
  "permissions.enterpriseKey": ["企业标识", "Business key"],
  "permissions.declareEnterprise": ["新增业务企业", "Add business enterprise"],
  "permissions.newEnterprise": ["新增企业…", "New enterprise…"],
  "permissions.enterpriseName": ["业务企业名称", "Business name"],
  "permissions.enterpriseHelp": [
    "选择已有业务企业，或在新增门店时填写新企业名称。企业信息在保存时自动建立，与评价是否已有数据无关。",
    "Choose an existing business or enter a new business name when adding a store. Saving creates its enterprise information, even when no reviews exist.",
  ],
  "permissions.automaticEnterpriseHelp": [
    "新增企业时，企业名称与门店一起保存，无需额外登记。密级和账号读取权限仍由你单独设置。",
    "For a new enterprise, its name and store are saved together with no separate registration. Configure category levels and account read access separately.",
  ],
  "permissions.enterpriseNameRequired": [
    "请先在“门店与业务企业”保存企业名称或新增该企业的门店，再保存评价授权。现有权限未改变。",
    "Save the business name or its first store under Stores and businesses before saving review access. Existing permissions are unchanged.",
  ],
  "permissions.enterpriseNameConflict": [
    "企业名称与已有企业信息冲突。请重新读取配置，核对名称后再保存；系统不会自动更名或合并。",
    "The business name conflicts with the saved enterprise. Reload and confirm the name before saving; enterprises are never automatically renamed or merged.",
  ],
  "permissions.enterpriseNameInvalid": [
    "企业名称不合法，请填写完整的业务企业名称。",
    "The business name is invalid. Enter the full legal business name.",
  ],
  "permissions.enterpriseDeclared": [
    "确认后保存本组织的业务企业名称；此操作不授予任何读取权限。",
    "Confirmation saves this business name in the current organization. It does not grant read access.",
  ],
  "permissions.previewEnterprise": [
    "预览企业标识",
    "Preview business identity",
  ],
  "permissions.previewResult": ["预览结果", "Preview result"],
  "permissions.addStore": ["新增精确门店", "Add exact store"],
  "permissions.storeName": ["精确门店名称", "Exact store name"],
  "permissions.storeHelp": [
    "保留完整原名。停用不删除历史引用；更名或合并须另行核对迁移。",
    "Keep the exact full name. Retirement preserves historical references; renaming or merging requires a separate reviewed migration.",
  ],
  "permissions.account": ["账号", "Account"],
  "permissions.role": ["角色（只读）", "Role (read only)"],
  "permissions.admin": ["管理员", "Administrator"],
  "permissions.employee": ["员工", "Employee"],
  "permissions.disabled": ["账号已停用", "Account disabled"],
  "permissions.accountHelp": [
    "账号创建和角色变更由运维处理。每次保存替换该账号完整授权，未修改的条目会保留。",
    "Operators create accounts and change roles. Saving replaces this account's complete grant set while preserving entries you did not edit.",
  ],
  "permissions.selectAccount": ["选择账号", "Select an account"],
  "permissions.edit": ["编辑", "Edit"],
  "permissions.grants": ["读取授权", "Read grants"],
  "permissions.addGrant": ["新增授权条目", "Add grant"],
  "permissions.removeGrant": ["删除此授权条目", "Remove this grant"],
  "permissions.removeScope": ["删除此范围", "Remove this scope"],
  "permissions.noGrants": [
    "无读取授权。账号密级本身不授予资料读取权。",
    "No read grants. Account clearance alone does not grant access.",
  ],
  "permissions.noStoreRead": ["无门店读取权限", "No store read access"],
  "permissions.selectedStores": ["指定门店", "Selected stores"],
  "permissions.allStores": [
    "全部门店（包括以后新增）",
    "All stores (including future stores)",
  ],
  "permissions.selectedValues": ["指定取值", "Selected values"],
  "permissions.allValues": [
    "全部取值（包括以后新增）",
    "All values (including future values)",
  ],
  "permissions.noGrantOption": [
    "不需要读取某类资料时，不添加该类别授权；删除条目即撤权。",
    "For no access to a category, omit its grant. Removing a grant revokes that access.",
  ],
  "permissions.preserved": [
    "不可用条目（保留历史选择）",
    "Unavailable item (historical selection preserved)",
  ],
  "permissions.removeCondition": ["移除此条件", "Remove this condition"],
  "permissions.categoriesLabel": ["允许读取的类别", "Readable categories"],
  "permissions.grantCount": ["授权条目数", "Grant count"],
  "permissions.before": ["原配置", "Before"],
  "permissions.after": ["本次配置", "After"],
  "permissions.latest": ["最新服务端配置", "Latest server configuration"],
  "permissions.draft": ["当前未保存草稿", "Current unsaved draft"],
  "permissions.searchDocument": [
    "按文档名称或 ID 查找",
    "Find by document name or ID",
  ],
  "permissions.search": ["查找", "Search"],
  "permissions.nextPage": ["下一页", "Next page"],
  "permissions.firstPage": ["返回第一页", "First page"],
  "permissions.page": ["页码", "Page"],
  "permissions.document": ["文档", "Document"],
  "permissions.documentHelp": [
    "这里只显示权限属性，不提供正文或下载。每页最多 50 份文档；上传继续使用官方 MCP。",
    "Only permission metadata is shown, with no content or downloads. Pages contain up to 50 documents. Uploads continue through official MCP.",
  ],
  "permissions.documentCategory": ["普通文档类别", "Document category"],
  "permissions.scopes": ["整份文档的完整范围", "Complete document scopes"],
  "permissions.addScope": ["新增范围", "Add scope"],
  "permissions.documentStatus": ["处理状态", "Processing status"],
  "permissions.attributesNotReady": [
    "资料权限属性或处理状态尚未就绪。",
    "Document permission attributes or processing status are not ready.",
  ],
  "permissions.supplementReason": [
    "历史补齐原因（仅获准补齐时填写）",
    "Historical supplement reason (approved work only)",
  ],
  "permissions.supplementHelp": [
    "不自动猜测来源或回填真实资料；缺项先按准备报告另行核对并批准。",
    "Sources and real-data backfills are never inferred. Review missing items separately and obtain approval.",
  ],
  "permissions.check": ["运行只读准备检查", "Run read-only preparation check"],
  "permissions.ready": ["配置准备就绪", "Configuration ready"],
  "permissions.notReady": [
    "尚有缺项，暂不能启用",
    "Missing items prevent activation",
  ],
  "permissions.empty": ["暂无条目", "No items yet"],
  "permissions.target": ["对象", "Target"],
  "permissions.issue": ["待处理事项", "Required action"],
  "permissions.goToSection": ["前往处理", "Go to section"],
  "permissions.accountsWithoutGrants": [
    "以下账号没有读取授权（启用后仍无读取权）",
    "These accounts have no read grants (they remain unable to read after activation)",
  ],
  "permissions.activate": [
    "确认启用业务权限",
    "Confirm business permission activation",
  ],
  "permissions.activateConfirm": ["确认启用", "Activate"],
  "permissions.activateHelp": [
    "启用后本企业读取将按新业务权限判定。保存不等于启用；历史缺项必须先补齐。",
    "Activation switches this enterprise's reads to business permissions. Saving is not activation; historical missing items must be resolved first.",
  ],
  "permissions.alreadyEnabled": [
    "本企业已启用。新增账号只需保存授权，无需再次激活。",
    "This enterprise is already enabled. New accounts only need their grants saved, without reactivation.",
  ],
  "permissions.suspendedHelp": [
    "读取已暂停，请联系运维核对恢复要求。本页不回退旧规则或绕过准备恢复。",
    "Reads are suspended. Contact your operator about recovery. This page cannot restore legacy rules or bypass preparation.",
  ],
  "permissions.activated": [
    "已启用业务权限。请在批准范围内做最小读取验证。",
    "Business permissions enabled. Perform a minimal read verification within the approved scope.",
  ],
  "permissions.suspend": ["暂停业务读取", "Suspend business reads"],
  "permissions.suspendHelp": [
    "暂停后本企业的业务读取立即停止，只保留普通文档读取；恢复需要运维核对准备项。",
    "Suspending stops this enterprise's business reads immediately; only document reads remain. Recovery requires operator review.",
  ],
  "permissions.suspendedNotice": [
    "已暂停业务读取。",
    "Business reads suspended.",
  ],
  "permissions.noDataClaim": [
    "新空企业可先配置并启用；没有真实资料时只能声明配置就绪。",
    "An empty enterprise can be configured and activated first. With no real documents, only configuration readiness can be claimed.",
  ],
  "permissions.error.notReady": [
    "尚有缺项，暂不能启用",
    "Missing items prevent activation",
  ],
  "permissions.error.suspended": [
    "业务读取已暂停，请联系运维核对恢复要求。",
    "Business reads are suspended. Contact your operator about recovery.",
  ],
  "permissions.error.notEnabled": [
    "业务权限尚未启用。",
    "Business permissions are not enabled yet.",
  ],
  "permissions.error.invalid": [
    "配置不完整或引用不可用，请核对类别、门店和业务条件。",
    "Configuration is incomplete or references an unavailable item. Check categories, stores and conditions.",
  ],
  "permissions.error.unavailable": [
    "目标已不可用，请重新读取并核对。",
    "The target is unavailable. Reload and check it.",
  ],
  "permissions.status.uploading": ["上传中", "Uploading"],
  "permissions.status.pending_processing": [
    "等待处理",
    "Waiting for processing",
  ],
  "permissions.status.processing": ["处理中", "Processing"],
  "permissions.status.processing_failed": ["处理失败", "Processing failed"],
  "permissions.status.archived": ["已归档", "Archived"],
  "permissions.missing.INTERNAL_CATEGORY_REQUIRED": [
    "内部资料类别尚未初始化，请联系运维。",
    "An internal data category has not been initialized. Contact your operator.",
  ],
  "permissions.missing.FIXED_CATEGORY_CLEARANCE_REQUIRED": [
    "请配置固定类别密级",
    "Configure the fixed category level",
  ],
  "permissions.missing.DIMENSION_NOT_READY": [
    "请补齐类别所需业务条件",
    "Complete the category's required conditions",
  ],
  "permissions.missing.DIMENSION_VALUE_REQUIRED": [
    "请核对业务条件取值",
    "Check condition values",
  ],
  "permissions.missing.EXACT_STORE_REFERENCE_REQUIRED": [
    "请补齐精确门店引用",
    "Complete exact store references",
  ],
  "permissions.missing.GRANT_CONFIGURATION_REQUIRED": [
    "请修正账号的完整授权组合",
    "Correct the account's complete grant tuples",
  ],
  "permissions.missing.GRANT_DIMENSION_REQUIRED": [
    "请补齐授权的业务条件取值",
    "Complete grant condition values",
  ],
  "permissions.missing.PARTITION_ATTRIBUTES_REQUIRED": [
    "结构化资料属性缺失，请联系运维核对",
    "Structured material attributes are missing; contact your operator",
  ],
  "permissions.missing.COST_CARD_ATTRIBUTES_REQUIRED": [
    "成本卡权限属性缺失，请联系运维核对",
    "Cost card permission attributes are missing; contact your operator",
  ],
  "permissions.missing.PDF_ATTRIBUTES_REQUIRED": [
    "台账 PDF 属性缺失，请联系运维核对",
    "Ledger PDF attributes are missing; contact your operator",
  ],
  "permissions.missing.READ_ADAPTER_NOT_READY": [
    "服务读取能力尚未就绪，请联系运维",
    "Server read support is not ready; contact your operator",
  ],
  "permissions.missing.RESOURCE_ATTRIBUTES_REQUIRED": [
    "请补齐资料类别、密级和完整范围",
    "Complete the material's category, level and scopes",
  ],
  "permissions.missing.STORE_REVIEW_ATTRIBUTES_REQUIRED": [
    "店铺评价的企业或门店关联缺失，请核对",
    "Check the review’s enterprise and exact store references",
  ],
  "permissions.missing.RESOURCE_CATEGORY_MISMATCH": [
    "资料与类别不匹配，请核对",
    "Check the material's category mismatch",
  ],
  "permissions.missing.SINGLE_STORE_REQUIRED": [
    "此资料必须对应一个精确门店",
    "This material must belong to one exact store",
  ],
  "permissions.missing.SOURCE_LINEAGE_REQUIRED": [
    "原件来源关系缺失，须另行核对与批准补齐",
    "Source lineage is missing; review and approve any supplement separately",
  ],
  "permissions.missing.DOCUMENT_ATTRIBUTES_REQUIRED": [
    "文档权限属性缺失，请核对",
    "Document permission attributes are missing",
  ],
} as const satisfies TextDictionary;
