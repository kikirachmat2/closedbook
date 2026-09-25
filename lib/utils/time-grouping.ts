export type TimeGroupKey = "today" | "yesterday" | "thisWeek" | "older";

export interface TimeGroup<T> {
  key: TimeGroupKey;
  label: string;
  items: T[];
  isOlder?: boolean;
}

const GROUP_LABELS: Record<string, Record<TimeGroupKey, string>> = {
  id: {
    today: "Hari Ini",
    yesterday: "Kemarin",
    thisWeek: "Minggu Ini",
    older: "Lebih Lama",
  },
  en: {
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    older: "Older",
  },
  es: {
    today: "Hoy",
    yesterday: "Ayer",
    thisWeek: "Esta Semana",
    older: "Anterior",
  },
  ja: {
    today: "今日",
    yesterday: "昨日",
    thisWeek: "今週",
    older: "過去",
  },
};

/**
 * Group items chronologically based on a date extractor
 */
export function groupItemsByTime<T>(
  items: T[],
  getDate: (item: T) => Date | string | number | undefined,
  language: string = "id"
): TimeGroup<T>[] {
  const labels = GROUP_LABELS[language] || GROUP_LABELS.en;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOfThisWeek = startOfToday - 6 * oneDayMs;

  const groups: Record<TimeGroupKey, T[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  for (const item of items) {
    const rawDate = getDate(item);
    if (!rawDate) {
      groups.older.push(item);
      continue;
    }

    const date = new Date(rawDate);
    const time = date.getTime();

    if (isNaN(time)) {
      groups.older.push(item);
    } else if (time >= startOfToday) {
      groups.today.push(item);
    } else if (time >= startOfYesterday) {
      groups.yesterday.push(item);
    } else if (time >= startOfThisWeek) {
      groups.thisWeek.push(item);
    } else {
      groups.older.push(item);
    }
  }

  const result: TimeGroup<T>[] = [];

  const keys: TimeGroupKey[] = ["today", "yesterday", "thisWeek", "older"];
  for (const key of keys) {
    if (groups[key].length > 0) {
      result.push({
        key,
        label: labels[key],
        items: groups[key],
        isOlder: key === "older",
      });
    }
  }

  return result;
}
