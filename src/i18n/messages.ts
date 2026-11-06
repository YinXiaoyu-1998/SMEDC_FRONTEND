import { ledgerMessages } from "@/features/ledger/messages";
import { permissionsMessages } from "@/features/permissions/messages";
import type { TextDictionary } from "@/i18n/text";

// 这里只放跨业务复用的通用 UI 文案；业务文案由各 feature 通过 mergeText 合并进字典
export const baseMessages = {
  "app.brand": ["SMEDC", "SMEDC"],
  "app.skipToContent": ["跳到主要内容", "Skip to main content"],
  "app.loading": ["正在加载", "Loading"],
  "nav.primary": ["主导航", "Main navigation"],
  "nav.openMenu": ["展开导航", "Open navigation"],
  "nav.closeMenu": ["收起导航", "Close navigation"],
  "nav.management": ["管理设置", "Administration"],
  "nav.permissions": ["权限设置", "Permissions"],
  "nav.workflows": ["自动任务", "Automations"],
  "nav.ledger": ["台账下载中心", "Ledger downloads"],
  "nav.logout": ["退出登录", "Sign out"],
  "nav.logoutFailed": [
    "退出失败，请重试",
    "Sign-out failed. Please try again.",
  ],
  "language.label": ["语言", "Language"],
  "language.zh": ["中文", "中文"],
  "language.en": ["English", "English"],
  "session.identity": ["当前身份", "Signed in as"],
  "login.title": ["登录 SMEDC", "Sign in to SMEDC"],
  "login.email": ["邮箱", "Email"],
  "login.password": ["密码", "Password"],
  "login.submit": ["登录", "Sign in"],
  "login.expired": [
    "登录状态已过期，请重新登录",
    "Your session has expired. Sign in again.",
  ],
  "login.error.generic": [
    "邮箱或密码不正确，请重试",
    "Incorrect email or password. Please try again.",
  ],
  "login.error.emailRequired": ["请输入邮箱", "Enter your email address."],
  "login.error.emailInvalid": [
    "请输入有效的邮箱地址",
    "Enter a valid email address.",
  ],
  "login.error.passwordRequired": ["请输入密码", "Enter your password."],
  "login.error.passwordTooLong": [
    "密码长度不能超过 128 个字符",
    "Password must be no more than 128 characters.",
  ],
  "pages.content": ["内容区域", "Content"],
  "pages.permissions.title": ["权限设置", "Permissions"],
  "pages.workflows.title": ["自动任务", "Automations"],
  "pages.ledger.title": ["台账下载中心", "Ledger downloads"],
  "errors.notFound.title": ["页面不存在", "Page not found"],
  "errors.notFound.description": [
    "你访问的地址不存在或已被移除。",
    "The address does not exist or has been removed.",
  ],
  "errors.forbidden.title": ["无访问权限", "No access"],
  "errors.forbidden.description": [
    "当前账号没有权限查看该内容。",
    "Your account does not have permission to view this content.",
  ],
  "errors.forbidden.retry": ["重试", "Try again"],
  "errors.session.title": ["无法读取登录状态", "Unable to load your session"],
  "errors.session.description": [
    "请检查网络连接后重试。",
    "Check your network connection and try again.",
  ],
  "errors.session.retry": ["重新加载", "Reload"],
  "errors.boundary.title": [
    "页面暂时无法显示",
    "This page is temporarily unavailable",
  ],
  "errors.boundary.description": [
    "发生了意外错误，请重试。",
    "Something went wrong. Please try again.",
  ],
  "errors.boundary.retry": ["重试", "Try again"],
  "errors.home": ["返回首页", "Go home"],
  "errors.action.generic": [
    "操作失败，请重试",
    "The action failed. Please try again.",
  ],
  "errors.action.network": [
    "无法连接服务器，请检查网络后重试",
    "Unable to reach the server. Check your network and try again.",
  ],
  "errors.action.internal": [
    "服务器暂时无法处理该操作，请稍后重试",
    "The server could not complete the action. Please try again later.",
  ],
  "errors.action.invalidResponse": [
    "服务器返回了无法解析的响应，请重试",
    "The server returned a response that could not be read. Please try again.",
  ],
  "errors.action.invalidRequest": [
    "提交的内容无效，请检查后重试",
    "The submitted content is invalid. Check it and try again.",
  ],
  "errors.action.invalidCredentials": [
    "邮箱或密码不正确，请重试",
    "Incorrect email or password. Please try again.",
  ],
  "errors.action.security": [
    "安全校验失败，请重新加载页面后重试",
    "The security check failed. Reload the page and try again.",
  ],
  "errors.action.sessionExpired": [
    "登录状态已过期，请重新登录",
    "Your session has expired. Sign in again.",
  ],
  "errors.action.versionConflict": [
    "配置已在你编辑期间更新，请比较后再提交",
    "The configuration changed while you were editing. Compare the versions before submitting.",
  ],
  "ui.conflict.title": ["版本冲突", "Version conflict"],
  "ui.conflict.description": [
    "服务器上的配置已被更新。请比较下列字段，再选择是重新加载还是用你的改动重新提交。",
    "The configuration on the server has changed. Compare the fields below, then reload or resubmit your changes.",
  ],
  "ui.conflict.field": ["字段", "Field"],
  "ui.conflict.server": ["服务器最新值", "Latest on server"],
  "ui.conflict.draft": ["我的草稿", "My draft"],
  "ui.conflict.reload": ["重新加载", "Reload"],
  "ui.conflict.resubmit": ["用我的改动重新提交", "Resubmit my changes"],
  "ui.table.selectAll": ["全选当前页", "Select all on this page"],
  "ui.table.selectRow": ["选择行", "Select row"],
  "ui.table.empty": ["暂无数据", "No data"],
  "ui.table.loading": ["正在加载", "Loading"],
  "ui.table.previous": ["上一页", "Previous page"],
  "ui.table.next": ["下一页", "Next page"],
  "ui.table.pagination": ["分页", "Pagination"],
  // 台账下载中心的业务文案由 feature 自带的元组补充
  ...ledgerMessages,
  // 权限设置页的业务文案由 feature 自带的元组补充
  ...permissionsMessages,
} as const satisfies TextDictionary;
