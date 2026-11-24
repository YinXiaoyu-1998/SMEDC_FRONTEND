import type { TextDictionary } from "@/i18n/text";
export const registrationMessages = {
  "registration.title": [
    "注册并创建企业",
    "Register and create an organization",
  ],
  "registration.employee": [
    "已有企业的员工请联系运维开户。",
    "Joining an existing organization? Contact your operator for an account.",
  ],
  "registration.send": ["发送验证码", "Send verification code"],
  "registration.resend": ["重新发送验证码", "Resend code"],
  "registration.expires": ["验证码到期时间", "Code expires at"],
  "registration.wait": ["秒后可重发", "seconds until resend"],
  "registration.verify": ["验证邮箱", "Verify email"],
  "registration.code": ["邮箱验证码", "Email verification code"],
  "registration.change": ["更改邮箱", "Change email"],
  "registration.resume": ["继续注册", "Continue registration"],
  "registration.org": ["企业名称", "Organization name"],
  "registration.name": ["本人显示名", "Your display name"],
  "registration.owner": [
    "你将成为这家新企业的首位管理员，以下邮箱用于登录。",
    "You will be the first administrator of this new organization. Sign in with this email.",
  ],
  "registration.create": ["创建企业", "Create organization"],
  "registration.login": ["返回登录", "Back to sign in"],
  "registration.existing": [
    "该邮箱已有账号。请登录或联系运维。",
    "An account already uses this email. Sign in or contact your operator.",
  ],
  "registration.restart": [
    "重新开始邮箱验证",
    "Start email verification again",
  ],
  "registration.challengeError": [
    "人机验证加载失败，请刷新本页后重试。",
    "The human check could not load. Refresh this page to try again.",
  ],
  "registration.unavailable": [
    "自助注册暂未开放，请联系运维开户。",
    "Self-registration is unavailable. Contact your operator to open an account.",
  ],
  "registration.rate": [
    "请求过于频繁，请稍后重试。",
    "Too many requests. Please try again later.",
  ],
  "registration.delivery": [
    "邮件发送失败，请稍后重试。",
    "The email could not be sent. Try again later.",
  ],
  "registration.invalid": [
    "验证码不正确，请核对邮件。",
    "Incorrect code. Check the email and try again.",
  ],
  "registration.expired": [
    "验证码已失效，请重新发送。",
    "This code is no longer valid. Request another code.",
  ],
  "registration.sessionExpired": [
    "注册会话已失效，请重新开始邮箱验证。",
    "Your registration session expired. Start email verification again.",
  ],
  "registration.passwordError": [
    "请输入 8 至 128 个字符，并避开常见密码。",
    "Choose 8–128 characters and avoid common passwords.",
  ],
  "registration.failed": [
    "请求未完成，请重试。如果已经提交创建，可返回登录。",
    "The request did not complete. Try again, or sign in if you already submitted the form.",
  ],
} satisfies TextDictionary;
