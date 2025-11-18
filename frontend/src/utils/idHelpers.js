export function nextSequentialId(items = []) {
  const numericIds = (items || [])
    .map((item) => Number.parseInt(item.id, 10))
    .filter((value) => Number.isFinite(value));

  const nextNumber = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  const width = Math.max(3, String(nextNumber).length);
  return String(nextNumber).padStart(width, '0');
}
