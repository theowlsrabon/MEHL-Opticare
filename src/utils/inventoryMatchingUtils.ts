import { InventoryItem } from '../types';

/**
 * Normalizes string tokens for robust fuzzy matching between
 * job lens names and inventory catalog items.
 */
function cleanTokens(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, ' ')
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 1 &&
        !['lens', 'lenses', 'with', 'and', 'the', 'for', 'pair', 'single', 'vision'].includes(t)
    );
}

/**
 * Matches a job's lensName string to an actual InventoryItem in the inventory registry.
 */
export function findLensInventoryItem(
  lensName: string | undefined,
  inventory: InventoryItem[]
): InventoryItem | undefined {
  if (!lensName || !inventory || inventory.length === 0) return undefined;

  const normalized = lensName.trim().toLowerCase();

  // 1. Exact match on item name or SKU
  const exact = inventory.find(
    (i) => i.name.toLowerCase() === normalized || i.sku.toLowerCase() === normalized
  );
  if (exact) return exact;

  // Filter to lens items (or fallback to full inventory if none found)
  const lensItems = inventory.filter(
    (i) =>
      i.category === 'Finished Lens' ||
      i.category === 'Contact Lens' ||
      i.name.toLowerCase().includes('lens')
  );
  const pool = lensItems.length > 0 ? lensItems : inventory;

  // 2. Substring match
  const sub = pool.find(
    (i) =>
      i.name.toLowerCase().includes(normalized) ||
      normalized.includes(i.name.toLowerCase())
  );
  if (sub) return sub;

  // 3. Token-based weighted match
  const queryTokens = cleanTokens(lensName);
  let bestMatch: InventoryItem | undefined;
  let highestScore = 0;

  for (const item of pool) {
    const itemTokens = cleanTokens(
      `${item.name} ${item.brand || ''} ${item.model || ''} ${item.specs || ''}`
    );
    let score = 0;

    for (const q of queryTokens) {
      if (itemTokens.includes(q)) {
        // High index specifications (1.61, 1.67, 1.56, 1.74, 1.76, 1.50) and major brands get extra weight
        if (/\d\.\d+/.test(q) || ['essilor', 'zeiss', 'rodenstock', 'tokai', 'crizal', 'nupolar'].includes(q)) {
          score += 3;
        } else {
          score += 1;
        }
      }
    }

    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * Checks whether an inventory item's stock count has dropped below its configured minimum threshold.
 */
export function isLensBelowThreshold(item: InventoryItem | undefined): boolean {
  if (!item) return false;
  return item.stockQty < item.minThreshold;
}
