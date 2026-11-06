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
} as const satisfies TextDictionary;
