import type { FilterCondition } from "@kitejs-cms/core/index";

/**
 * Convert FilterConditions to query parameters
 */
export function buildFilterQuery(
  conditions: FilterCondition[]
): Record<string, unknown> {
  return conditions.reduce(
    (query, condition) => {
      if (isEmpty(condition.value)) return query;

      const key =
        condition.operator === "equals"
          ? condition.field
          : `${condition.field}[${condition.operator}]`;

      query[key] = parseValue(condition.value);
      return query;
    },
    {} as Record<string, unknown>
  );
}

/**
 * Build complete query with pagination and sorting
 */
export function buildCompleteQuery(
  conditions: FilterCondition[],
  options: {
    page?: number;
    pageSize?: number;
    sort?: string;
  } = {}
): Record<string, unknown> {
  const query = buildFilterQuery(conditions);

  if (options.page !== undefined) {
    query["page[number]"] = options.page;
  }

  if (options.pageSize !== undefined) {
    query["page[size]"] = options.pageSize;
  }

  if (options.sort) {
    query.sort = options.sort;
  }

  return query;
}

/**
 * Parse value based on type
 */
function parseValue(value: unknown) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "string" && isDateString(value)) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString();
  }
  return value;
}

/**
 * Check if value is empty
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Check if string is a date
 */
function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}
