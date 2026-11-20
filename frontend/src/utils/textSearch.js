export function normalizeVietnamese(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export function matchesSearch(text, query) {
  const normalizedQuery = normalizeVietnamese(query);
  if (!normalizedQuery) return true;
  return normalizeVietnamese(text).includes(normalizedQuery);
}

