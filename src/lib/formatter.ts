type WithId<T> = T & { id: string };
type WithUnderscoreId<T> = Omit<T, "id"> & { _id: string };

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

	if (typeof input === "string") {
		return input
			.split(/[\n,.]+/)
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return [];
};

export function formatId<T extends Record<string, any>>(
	data: WithId<T> | WithId<T>[] | null | undefined,
): WithUnderscoreId<T> | WithUnderscoreId<T>[] | null {
	// Handle null or undefined
	if (data == null) {
		return null;
	}

	// Single transform function with _id presence check
	const transform = (item: WithId<T>): WithUnderscoreId<T> => {
		// If _id already exists, return as is (already formatted)
		if ("_id" in item) {
			return item as unknown as WithUnderscoreId<T>;
		}

		// Otherwise transform id to _id
		const { id, ...rest } = item;
		return {
			_id: id?.toString() ?? "",
			...rest,
		} as WithUnderscoreId<T>;
	};

	// Handle both array and single object
	return Array.isArray(data) ? data.map(transform) : transform(data);
}
