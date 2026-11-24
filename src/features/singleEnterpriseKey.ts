export function singleEnterpriseKey(
  enterprises: readonly { readonly enterpriseKey: string }[],
): string {
  return enterprises.length === 1 ? (enterprises[0]?.enterpriseKey ?? "") : "";
}
