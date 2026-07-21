// ─── Validation Guard Service ───────────────────────────────────────
// Post-processes AI response to enforce data integrity constraints.

import { WorkshopContext } from './context-builder.service';

interface RecommendationItem {
  workshopId: string;
  matchScore?: number;
  reason?: string;
  bestFor?: string;
  suggestedTime?: string;
  matchedFactors?: string[];
  tradeOffs?: string[];
}

interface TimelineItem {
  id: string;
  time?: string;
  type: string;
  activity: string;
  workshopId?: string | null;
  note?: string;
  estimatedCost?: number;
  whyThisActivity?: string;
}

// ─── Validate Recommendations ───────────────────────────────────────
export function validateRecommendations(
  recommendations: RecommendationItem[],
  contextWorkshops: WorkshopContext[],
  slots: { location?: string; maxPrice?: number; sort?: string }
): RecommendationItem[] {
  const validIds = new Set(contextWorkshops.map((w) => w._id));
  const wsMap = new Map(contextWorkshops.map((w) => [w._id, w]));

  let validated = recommendations
    // Remove workshops not in context (AI fabricated)
    .filter((r) => validIds.has(r.workshopId))
    // Remove duplicates
    .filter((r, i, arr) => arr.findIndex((x) => x.workshopId === r.workshopId) === i);

  // Hard filter: location
  if (slots.location) {
    validated = validated.filter((r) => {
      const ws = wsMap.get(r.workshopId);
      return ws && ws.locationLabel.toLowerCase().includes(slots.location!.toLowerCase());
    });
  }

  // Hard filter: price
  if (slots.maxPrice) {
    validated = validated.filter((r) => {
      const ws = wsMap.get(r.workshopId);
      return ws && ws.price <= slots.maxPrice!;
    });
  }

  // Force sort if needed
  if (slots.sort === 'PRICE_ASC') {
    validated.sort((a, b) => {
      const pa = wsMap.get(a.workshopId)?.price ?? 0;
      const pb = wsMap.get(b.workshopId)?.price ?? 0;
      return pa - pb;
    });
  } else if (slots.sort === 'RATING_DESC') {
    validated.sort((a, b) => {
      const ra = wsMap.get(a.workshopId)?.averageRating ?? 0;
      const rb = wsMap.get(b.workshopId)?.averageRating ?? 0;
      return rb - ra;
    });
  }

  return validated;
}

// ─── Validate Timeline ──────────────────────────────────────────────
export function validateTimeline(
  timeline: TimelineItem[],
  contextWorkshops: WorkshopContext[]
): TimelineItem[] {
  const validIds = new Set(contextWorkshops.map((w) => w._id));
  const seenWorkshopIds = new Set<string>();
  const seenItemIds = new Set<string>();

  return timeline
    .filter((item) => {
      // Dedup by item.id
      if (seenItemIds.has(item.id)) return false;
      seenItemIds.add(item.id);

      // If WORKSHOP type, validate workshopId
      if (item.type === 'WORKSHOP' && item.workshopId) {
        if (!validIds.has(item.workshopId)) return false;
        if (seenWorkshopIds.has(item.workshopId)) return false;
        seenWorkshopIds.add(item.workshopId);
      }

      return true;
    })
    .map((item, idx) => ({
      ...item,
      id: item.id || `item-${idx}`,
    }));
}
