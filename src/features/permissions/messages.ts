import type { TextDictionary } from "@/i18n/text";

// 权限设置页的文案：键名按区块分组，措辞沿用旧管理页，避免迁移时改变用户看到的话术
export const permissionsMessages = {
  // 区域导航
  // 权限设置页（F4）：键名按区块分组，文案沿用旧管理页的措辞
  "permissions.tabs.label": ["权限设置区域", "Permission settings sections"],
  "permissions.tabs.categories": ["类别与密级", "Categories and levels"],
  "permissions.tabs.stores": ["门店与业务企业", "Stores and businesses"],
  "permissions.tabs.dimensions": ["业务条件", "Business conditions"],
  "permissions.tabs.accounts": ["账号授权", "Account permissions"],
  "permissions.tabs.documents": ["普通文档", "Documents"],
  "permissions.mode.legacy": [
    "未启用 · 仍按原有规则读取",
    "Not activated · original read rules apply",
  ],
  "permissions.mode.preparing": [
    "准备中 · 仍按原有规则读取",
    "Preparing · original read rules apply",
  ],
  "permissions.mode.suspended": ["业务读取已暂停", "Business reads suspended"],
  "permissions.statusHint": [
    "如需切换或恢复，请联系管理员或运维处理。",
    "Contact your administrator or operator to switch or restore access.",
  ],
  "permissions.loading": ["正在读取配置…", "Loading configuration…"],
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
  "permissions.grantRetiredReference": [
    "这条授权新增了已停用的目录项，请修改选择。",
    "This grant adds a retired directory item. Update the selection.",
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
  "permissions.category.inspection_questionnaire": [
    "门店巡检问卷",
    "Store inspection questionnaires",
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
  "permissions.addCategory": ["新增文档类别", "Add document category"],
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
  "permissions.empty": ["暂无条目", "No items yet"],
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

  // 页面外壳（原型 v2）：页头、状态区、分区导航
  "permissions.banner.label": ["业务权限状态", "Business permission status"],
  "permissions.closePanel": ["关闭编辑面板", "Close editor"],
  "permissions.discardDescription": [
    "切换分区会关闭当前编辑并丢弃未保存的草稿。请比较后选择是否放弃；不会自动合并或覆盖。",
    "Switching sections closes the current editor and discards unsaved changes. Compare before discarding; nothing is merged or overwritten automatically.",
  ],
  "permissions.fullConfig": ["查看完整配置", "View full configuration"],
  "permissions.diff.added": ["新增", "Added"],
  "permissions.diff.removed": ["删除", "Removed"],
  "permissions.diff.changed": ["变更", "Changed"],
  "permissions.none": ["无", "None"],
  "permissions.grant": ["授权", "Grant"],
  "permissions.conflict.choose": [
    "同一条在服务器和本地都被改动，请选择保留哪一侧",
    "The same item changed on both sides. Choose which version to keep",
  ],
  "permissions.conflict.keepServer": ["保留服务器", "Keep server"],
  "permissions.conflict.keepDraft": ["保留我的", "Keep mine"],
  "permissions.conflict.loadServer": [
    "载入服务器值并放弃草稿",
    "Load server values and discard draft",
  ],
  "permissions.conflict.applyMine": [
    "以最新配置为基线重新应用我的改动",
    "Reapply my changes on the latest configuration",
  ],
  "permissions.conflict.loaded": [
    "已载入服务器最新值。",
    "Loaded the latest server values.",
  ],
  "permissions.conflict.nothingApplied": [
    "合并后没有剩余的改动。",
    "No changes remain after merging.",
  ],
  "permissions.conflict.decideFirst": [
    "请先为每一项冲突选择保留哪一侧",
    "Choose a side for every conflict first",
  ],
  "permissions.conflict.removed": ["（已删除）", "(removed)"],
  "permissions.conflict.serverRemoved": [
    "服务器已删除授权「{grant}」，本地改动不再生效。",
    'The server removed grant "{grant}"; your local change no longer applies.',
  ],
  "permissions.conflict.serverChanged": [
    "服务器同时修改了未编辑的授权「{grant}」，已保留服务器版本。",
    'The server also changed the unedited grant "{grant}"; the server version is kept.',
  ],
  "permissions.savedNotice": ["已保存。", "Saved."],

  // 列表通用
  "permissions.count": ["条", "items"],
  "permissions.rowCount": ["共", "Total"],
  "permissions.statusLabel": ["状态", "Status"],
  "permissions.actions": ["操作", "Actions"],
  "permissions.view": ["查看", "View"],
  "permissions.panel.documentCategories": ["文档类别", "Document categories"],
  "permissions.panel.fixedCategories": ["固定类别", "Fixed categories"],
  "permissions.segmented.document": ["文档类别", "Document categories"],
  "permissions.segmented.fixed": ["固定类别", "Fixed categories"],
  "permissions.searchCategory": ["搜索类别", "Search categories"],
  "permissions.docCategoryHint": [
    "文档类别定义可用的资料归属与必需业务条件。",
    "Document categories define supported ownership and required conditions.",
  ],
  "permissions.editCategory": ["编辑文档类别", "Edit document category"],
  "permissions.addDocumentCategory": ["新增文档类别", "Add document category"],
  "permissions.retireCategory": ["停用类别", "Retire category"],
  "permissions.restoreCategory": ["恢复类别", "Restore category"],
  "permissions.categoryFields": ["类别名称", "Category name"],
  "permissions.noCategories": ["暂无文档类别", "No document categories"],
  "permissions.archivedCategories": ["已停用类别", "Retired categories"],

  // 业务条件与取值
  "permissions.conditionList": ["业务条件", "Business conditions"],
  "permissions.searchCondition": ["搜索业务条件", "Search conditions"],
  "permissions.editCondition": ["编辑业务条件", "Edit condition"],
  "permissions.addCondition": ["新增业务条件", "Add condition"],
  "permissions.retireCondition": ["停用条件", "Retire condition"],
  "permissions.restoreCondition": ["恢复条件", "Restore condition"],
  "permissions.conditionName": ["条件名称", "Condition name"],
  "permissions.conditionValues": ["可选取值", "Available values"],
  "permissions.conditionValuesHint": [
    "取值先保存条件后单独维护，每次写入只影响一个对象。",
    "Values are maintained separately after the condition is saved; each write affects one object only.",
  ],
  "permissions.editValue": ["编辑取值", "Edit value"],
  "permissions.retireValue": ["停用取值", "Retire value"],
  "permissions.restoreValue": ["恢复取值", "Restore value"],
  "permissions.archivedValues": ["已停用取值", "Retired values"],
  "permissions.emptyValues": ["暂无取值", "No values"],
  "permissions.valueName": ["取值名称", "Value name"],
  "permissions.conditionSaveFirst": [
    "请先保存或放弃条件名称的改动，再编辑取值。",
    "Save or discard the condition name change before editing values.",
  ],
  "permissions.valueWritten": ["取值已保存。", "Value saved."],
  "permissions.conditionWritten": ["业务条件已保存。", "Condition saved."],
  "permissions.conditionCreated": [
    "业务条件已创建，可以继续添加取值。",
    "Condition created; you can add values now.",
  ],

  // 门店与业务企业
  "permissions.enterpriseSection": [
    "已登记的业务企业",
    "Registered businesses",
  ],
  "permissions.storeDirectory": ["门店目录", "Store directory"],
  "permissions.storeDirectoryHint": [
    "这里只读展示精确门店；维护正式门店请前往企业资料。",
    "Exact stores are read-only here; maintain official stores under the enterprise directory.",
  ],
  "permissions.goToDirectory": ["前往企业资料", "Go to enterprise directory"],
  "permissions.storeEnterprise": ["业务企业", "Business"],
  "permissions.storeState": ["状态", "Status"],
  "permissions.storeConfirmed": ["已确认", "Confirmed"],
  "permissions.storePending": ["待确认", "Pending"],
  "permissions.storeHistorical": ["历史", "Historical"],
  "permissions.searchStore": ["搜索门店", "Search stores"],
  "permissions.enterprisePreviewInvalid": [
    "请先填写业务企业名称。",
    "Enter a business name first.",
  ],
  "permissions.enterpriseDeclaredNotice": [
    "业务企业已登记。",
    "Business registered.",
  ],

  // 账号授权
  "permissions.searchAccount": ["搜索账号", "Search accounts"],
  "permissions.accountPanel": ["编辑账号授权", "Edit account grants"],
  "permissions.accountRoleHint": [
    "角色由运维维护。账号密级与业务授权共同决定读取范围。",
    "Roles are maintained by operators. Account clearance and grants jointly determine read access.",
  ],
  "permissions.addGrantEntry": ["新增授权条目", "Add grant"],
  "permissions.editGrantEntry": ["编辑授权条目", "Edit grant"],
  "permissions.grantComplete": ["完成条目", "Done"],
  "permissions.grantRemoveConfirm": ["删除此授权条目？", "Remove this grant?"],
  "permissions.grantRemoveImpact": [
    "保存账号授权后，这条授权才会撤销。",
    "This grant is revoked only after the account is saved.",
  ],
  "permissions.grantCountLabel": ["{count} 条授权", "{count} grants"],
  "permissions.storeMode": ["门店范围", "Store scope"],
  "permissions.valueMode": ["取值范围", "Value scope"],
  "permissions.conditionRequired": ["（必需）", " (required)"],
  "permissions.grantNeedsIdentity": [
    "请选择业务企业、资料归属和至少一个资料类别。",
    "Choose a business, ownership and at least one category.",
  ],
  "permissions.grantNeedsStore": ["请选择门店范围。", "Choose a store scope."],
  "permissions.grantNeedsConditions": [
    "请补齐业务条件与指定取值。",
    "Complete the conditions and selected values.",
  ],
  "permissions.draftChanged": ["有未保存的更改", "Unsaved changes"],
  "permissions.levelField": ["密级", "Level"],

  // 普通文档
  "permissions.editDocument": ["编辑文档配置", "Edit document"],
  "permissions.addDocumentScope": ["新增范围", "Add scope"],
  "permissions.editScope": ["编辑范围", "Edit scope"],
  "permissions.scopeComplete": ["完成范围", "Done"],
  "permissions.scopeEnterprise": ["业务企业", "Business"],
  "permissions.scopeStore": ["精确门店名称", "Exact store name"],
  "permissions.scopeMissing": [
    "请选择业务企业、资料归属，并补齐门店和必需条件。",
    "Choose a business and ownership, then complete stores and required conditions.",
  ],
  "permissions.scopeRequired": [
    "请补齐当前类别的资料归属和必需业务条件。",
    "Complete the current category's ownership and required conditions.",
  ],
  "permissions.scopeChangedRequiresReason": [
    "改动涉及停用的目录项，请填写历史补录理由。",
    "This change touches retired catalog items; enter the historical supplement reason.",
  ],
  "permissions.documentSaved": ["文档配置已保存。", "Document settings saved."],
  "permissions.documentCursorReset": [
    "当前分页已失效，已回到第一页。",
    "The current page expired; returned to the first page.",
  ],
  "permissions.documentNoResults": ["没有匹配的文档", "No matching documents"],
  "permissions.documentMeta": ["文档属性", "Document attributes"],

  "permissions.status.active": ["使用中", "In use"],
  "permissions.status.off": ["已停用", "Retired"],

  "permissions.remove": ["删除", "Remove"],
  "permissions.conflict.scopeServerRemoved": [
    "服务器已删除一个你未改动的范围，已按服务器结果移除。",
    "The server removed a scope you did not change; it is removed.",
  ],
  "permissions.conflict.scopeNeedsReview": [
    "服务器可能同时修改了同一范围，且无法唯一配对，请核对重新确认摘要后再保存。",
    "The server may have changed the same scope and it cannot be paired uniquely. Review the summary before saving.",
  ],
  "permissions.backToFirstPage": ["返回第一页", "Back to first page"],
  "permissions.currentMode": ["当前模式", "Current mode"],
  "permissions.reloadDone": ["已重新读取配置。", "Configuration reloaded."],

  "permissions.scopeRemoveImpact": [
    "保存文档配置后，这个范围才会移除。",
    "This scope is removed only after the document is saved.",
  ],
  "permissions.valueWriteImpact": [
    "本次只写这一个取值；已保存的授权引用保持不变。",
    "Only this value is written; existing grant references stay unchanged.",
  ],
  "permissions.conditionCreateImpact": [
    "新条件保存后可以继续添加取值，并可被类别和授权引用。",
    "After saving, add values and reference the condition from categories and grants.",
  ],
  "permissions.conditionSaveImpact": [
    "本次只写条件名称；取值请单独保存。",
    "Only the condition name is written; save values separately.",
  ],
  "permissions.retireImpact": [
    "停用后会移入「已停用」，历史引用会保留。",
    "Retiring moves it under retired items; historical references are preserved.",
  ],
  "permissions.restoreImpact": [
    "恢复后会回到默认列表，可供后续配置使用。",
    "Restoring returns it to the default list for future configuration.",
  ],
  "permissions.valueRetireImpact": [
    "停用或恢复取值后，已保存的历史引用仍会保留。",
    "Retiring or restoring a value keeps existing historical references.",
  ],

  "permissions.discardTitle": [
    "放弃未保存的更改？",
    "Discard unsaved changes?",
  ],
  "permissions.discardChanges": ["放弃更改", "Discard changes"],

  "permissions.diff.addedItem": ["新增{label}", "Added {label}"],
  "permissions.diff.removedItem": ["删除{label}", "Removed {label}"],
  "permissions.inspection.open": ["巡检权限", "Inspection permissions"],
  "permissions.inspection.missing": ["巡检配置缺项", "Inspection setup gaps"],
  "permissions.inspection.missingEnterprise": [
    "请先在「门店与业务企业」确认业务企业。",
    "Confirm the business enterprise under Stores and businesses first.",
  ],
  "permissions.inspection.missingCategory": [
    "未找到已登记的门店巡检问卷类别，请联系运维检查发布迁移。",
    "The registered store inspection questionnaire category was not found. Contact your operator to check the release migration.",
  ],
  "permissions.inspection.missingLevel": [
    "门店巡检问卷密级尚未配置，请在「类别与密级」设置巡检密级；设置前仍可继续配置巡检授权。",
    "The store inspection questionnaire level is not configured. Set it under Categories and levels; inspection access can still be configured beforehand.",
  ],
  "permissions.inspection.unavailable": [
    "巡检授权数据暂不可用，请联系运维核对账号权限服务。",
    "Inspection access data is unavailable. Contact your operator to check the account permission service.",
  ],
  "permissions.inspection.enterprise": ["巡检企业", "Inspection enterprise"],
  "permissions.inspection.templates": ["可维护模板", "Can maintain templates"],
  "permissions.inspection.all": [
    "全部门店（包括以后新增）",
    "All stores, including future stores",
  ],
  "permissions.inspection.fixed": ["指定门店", "Selected stores"],
  "permissions.inspection.none": ["无权限", "No access"],
  "permissions.inspection.read": ["可看", "Can read"],
  "permissions.inspection.write": ["可看和填写", "Can read and fill"],
  "permissions.inspection.save": [
    "保存巡检权限",
    "Save inspection permissions",
  ],
  "permissions.inspection.coverage": ["查看范围", "Read coverage"],
  "permissions.inspection.saveImpact": [
    "巡检填写权限按门店设置。模板维护权限对所选企业生效。",
    "Fill access is set by store. Template maintenance applies to the selected enterprise.",
  ],
  "permissions.inspection.futureImpact": [
    "改为指定门店后，以后新增的门店需要单独授权。请核对下方保留的门店名单。",
    "After switching to selected stores, grant access to newly added stores individually. Review the retained stores below.",
  ],
  "permissions.inspection.noStores": [
    "该企业暂无已确认门店，请先在「门店与业务企业」维护精确门店。",
    "This business has no confirmed stores. Add exact stores under Stores and businesses first.",
  ],
  "permissions.inspection.tooMany": [
    "指定查看门店和填写门店分别最多 1,000 家。",
    "Select at most 1,000 read stores and 1,000 fill stores.",
  ],
} as const satisfies TextDictionary;
