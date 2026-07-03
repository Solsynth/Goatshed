function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function snakeToCamel<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => snakeToCamel(item)) as unknown as T;
  }
  if (input !== null && typeof input === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(input as object)) {
      const camelKey = camelCase(key);
      result[camelKey] = snakeToCamel((input as Record<string, any>)[key]);
    }
    return result as T;
  }
  return input;
}
