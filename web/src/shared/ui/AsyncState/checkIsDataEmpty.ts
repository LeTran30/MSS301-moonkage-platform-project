export function checkIsDataEmpty<T>(
  data: T,
  isEmpty?: (data: T) => boolean,
): boolean {
  if (isEmpty) return isEmpty(data);
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === 'object') {
    if ('content' in data && Array.isArray((data as { content?: unknown[] }).content)) {
      return (data as { content: unknown[] }).content.length === 0;
    }
    if ('items' in data && Array.isArray((data as { items?: unknown[] }).items)) {
      return (data as { items: unknown[] }).items.length === 0;
    }
    if ('total' in data && (data as { total?: number }).total === 0) {
      return true;
    }
  }
  return false;
}
