export const hasAllFields = <T extends object>(
	obj: Partial<T>,
	requiredKeys: (keyof T)[]
): obj is T => {
	return requiredKeys.every((key) => key in obj);
};
