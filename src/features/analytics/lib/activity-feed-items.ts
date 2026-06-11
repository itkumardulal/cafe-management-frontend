import type { AnalyticsActivityFeed } from "@/src/features/analytics/types/analytics.types";

type ActivityFeedItem = AnalyticsActivityFeed["items"][number];

export function activityFeedItemKey(item: ActivityFeedItem): string {
  return `${item.eventType}:${item.id}`;
}

export function dedupeActivityFeedItems(items: ActivityFeedItem[]): ActivityFeedItem[] {
  const seen = new Set<string>();
  const deduped: ActivityFeedItem[] = [];

  for (const item of items) {
    const key = activityFeedItemKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function mergeActivityFeedItems(
  existing: ActivityFeedItem[],
  incoming: ActivityFeedItem[],
): ActivityFeedItem[] {
  return dedupeActivityFeedItems([...existing, ...incoming]);
}
