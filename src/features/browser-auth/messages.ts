import type { TextDictionary } from "@/i18n/text";

export const browserAuthMessages = {
  "passwordSetup.title": ["设置企业智脑密码", "Set your SMEDC password"],
  "passwordSetup.account": ["账户", "Account"],
  "passwordSetup.displayName": ["显示名称", "Display name"],
  "passwordSetup.organization": ["组织", "Organization"],
  "passwordSetup.role": ["角色", "Role"],
  "passwordSetup.admin": ["管理员", "Admin"],
  "passwordSetup.employee": ["员工", "Employee"],
  "passwordSetup.newPassword": ["新密码", "New password"],
  "passwordSetup.confirmPassword": ["确认新密码", "Confirm new password"],
  "passwordSetup.requirements": [
    "请使用 8–128 个字符，避免使用常见密码。",
    "Use 8–128 characters and avoid commonly used passwords.",
  ],
  "passwordSetup.submit": ["设置密码", "Set password"],
  "passwordSetup.mismatch": [
    "两次输入的密码不一致。",
    "The passwords do not match.",
  ],
  "passwordSetup.rejected": [
    "密码不符合要求。",
    "The password does not meet the requirements.",
  ],
  "passwordSetup.expired": [
    "此密码设置链接无效或已过期。请联系管理员获取新链接。",
    "This password setup link is invalid or expired. Contact your administrator for a new link.",
  ],
  "passwordSetup.exchangeFailed": [
    "暂时无法打开设密码页。请重新打开原链接。如果链接已失效，请联系管理员。",
    "Password setup is temporarily unavailable. Reopen the original link. If it has expired, contact your administrator.",
  ],
  "passwordSetup.saved": ["密码已保存", "Password saved"],
  "passwordSetup.login": ["前往登录", "Go to sign in"],
  "deviceVerification.confirm": [
    "登录后将授权以下设备。",
    "Signing in authorizes the following device.",
  ],
  "deviceVerification.device": ["设备", "Device"],
  "deviceVerification.host": ["主机", "Host"],
  "deviceVerification.expired": [
    "此设备登录链接无效或已过期。请返回你的 Agent 重新发起登录。",
    "This device sign-in link is invalid or expired. Return to your agent and start sign-in again.",
  ],
  "deviceVerification.complete": ["登录完成", "Sign-in complete"],
  "deviceVerification.return": [
    "你可以关闭此页面并返回你的 Agent。",
    "You can close this page and return to your agent.",
  ],
} as const satisfies TextDictionary;
