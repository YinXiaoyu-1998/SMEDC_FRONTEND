import type { LedgerCoverageBody } from "@/api/generated/contract";

import { readLedgerCoverage } from "@/features/ledger/api";
import type {
  LedgerLimits,
  LedgerPartition,
  SelectedPartition,
} from "@/features/ledger/model";
import { selectionOrder } from "@/features/ledger/model";

interface RevalidateOptions {
  readonly csrfToken: string;
  readonly signal?: AbortSignal | undefined;
}

/**
 * 逐个分块复核已选文件：
 * - 每块不超过服务端的 pageSize / stores / dates 限额，绝不因为选择过多而丢项；
 * - 覆盖分页游标直到该块读完；
 * - 只返回服务端明确给出的分区，未返回的由 reconcileSelection 标记为不可核验。
 */
export async function revalidateSelection(
  selection: Iterable<SelectedPartition>,
  limits: LedgerLimits,
  options: RevalidateOptions,
): Promise<readonly LedgerPartition[]> {
  const ordered = selectionOrder(selection);
  const collected: LedgerPartition[] = [];
  const pageSize = Math.max(1, limits.pageSize);
  let index = 0;

  while (index < ordered.length) {
    const batch: SelectedPartition[] = [];
    const stores = new Set<string>();
    const dates = new Set<string>();

    while (index < ordered.length && batch.length < pageSize) {
      const item = ordered[index];
      if (item === undefined) break;
      const addsStore = !stores.has(item.storeName);
      const addsDate = !dates.has(item.purchaseDate);
      if (
        batch.length > 0 &&
        ((addsStore && stores.size >= limits.stores) ||
          (addsDate && dates.size >= limits.dates))
      ) {
        break;
      }
      batch.push(item);
      stores.add(item.storeName);
      dates.add(item.purchaseDate);
      index += 1;
    }

    let cursor: string | null = null;
    do {
      const body: LedgerCoverageBody = {
        selection: batch.map((item) => ({
          storeName: item.storeName,
          purchaseDate: item.purchaseDate,
        })),
        ...(cursor === null ? {} : { cursor }),
      };
      const response = await readLedgerCoverage(
        body,
        options.csrfToken,
        options.signal,
      );
      collected.push(...response.partitions);
      cursor = response.nextCursor;
    } while (cursor !== null);
  }

  return collected;
}
