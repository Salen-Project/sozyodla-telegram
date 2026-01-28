const LAST_VISITED_KEY = 'sozyola_last_visited';

export interface LastVisited {
  bookId: number;
  unitId: number;
  bookTitle: string;
  unitTitle: string;
  timestamp: number;
}

export function saveLastVisited(data: Omit<LastVisited, 'timestamp'>) {
  try {
    const record: LastVisited = { ...data, timestamp: Date.now() };
    localStorage.setItem(LAST_VISITED_KEY, JSON.stringify(record));
  } catch (e) {
    console.error('Failed to save last visited:', e);
  }
}

export function getLastVisited(): LastVisited | null {
  try {
    const stored = localStorage.getItem(LAST_VISITED_KEY);
    if (stored) {
      const record = JSON.parse(stored) as LastVisited;
      // Only return if visited in last 7 days
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - record.timestamp < sevenDays) {
        return record;
      }
    }
  } catch (e) {
    console.error('Failed to get last visited:', e);
  }
  return null;
}
