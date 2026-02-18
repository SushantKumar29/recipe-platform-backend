export const normalizeTextList = (input?: string | string[]): string[] => {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.flatMap((item) =>
      item
        .split(/[\n,.]+/)
        .map((i) => i.trim())
        .filter(Boolean),
    );
  }

  if (typeof input === 'string') {
    return input
      .split(/[\n,.]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};
