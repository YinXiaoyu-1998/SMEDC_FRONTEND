import type {
  MailConfiguration,
  SourceAccount,
  SourceIdentity,
} from "@/features/workflows/model";

export function storeOptions(
  stores: readonly { readonly name: string; readonly retired: boolean }[],
  selected: readonly string[],
): { readonly value: string; readonly label: string }[] {
  const names = new Set(
    stores
      .filter((store) => !store.retired || selected.includes(store.name))
      .map((store) => store.name),
  );
  for (const name of selected) names.add(name);
  return [...names].map((name) => ({ value: name, label: name }));
}

export function withMail(
  mail: MailConfiguration,
  patch: {
    readonly enabled?: boolean;
    readonly recipients?: readonly string[];
    readonly allowedSender?: string;
  },
): MailConfiguration {
  const enabled = patch.enabled ?? mail.enabled;
  const recipients = patch.recipients ?? mail.recipients;
  const sender = patch.allowedSender ?? mail.allowedSender;
  return {
    enabled,
    recipients: [...recipients],
    ...(sender === undefined || sender === "" ? {} : { allowedSender: sender }),
  };
}

export interface SourcePatch {
  readonly product?: SourceIdentity["product"];
  readonly channel?: SourceIdentity["channel"];
  readonly accountRef?: string;
  readonly sourceStoreName?: string;
  readonly sourceStoreId?: string;
}

export function withSource(
  source: SourceIdentity,
  patch: SourcePatch,
): SourceIdentity {
  const sourceStoreId = patch.sourceStoreId ?? source.sourceStoreId;
  return {
    product: patch.product ?? source.product,
    channel: patch.channel ?? source.channel,
    accountRef: patch.accountRef ?? source.accountRef,
    sourceStoreName: patch.sourceStoreName ?? source.sourceStoreName,
    ...(sourceStoreId === undefined || sourceStoreId === ""
      ? {}
      : { sourceStoreId }),
  };
}

export interface SourceAccountPatch {
  readonly product?: SourceAccount["product"];
  readonly accountRef?: string;
  readonly displayName?: string;
  readonly sourceEnterpriseName?: string;
  readonly sourceGroupName?: string;
}

export function withSourceAccount(
  account: SourceAccount,
  patch: SourceAccountPatch,
): SourceAccount {
  const sourceGroupName = patch.sourceGroupName ?? account.sourceGroupName;
  return {
    product: patch.product ?? account.product,
    accountRef: patch.accountRef ?? account.accountRef,
    displayName: patch.displayName ?? account.displayName,
    sourceEnterpriseName:
      patch.sourceEnterpriseName ?? account.sourceEnterpriseName,
    ...(sourceGroupName === undefined || sourceGroupName === ""
      ? {}
      : { sourceGroupName }),
  };
}
