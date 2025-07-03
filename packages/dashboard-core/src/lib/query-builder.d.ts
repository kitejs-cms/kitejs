import type { FilterCondition } from "@kitejs-cms/core/index";
export declare function buildFilterQuery(conditions: FilterCondition[]): Record<string, any>;
export declare function buildCompleteQuery(conditions: FilterCondition[], options?: {
    page?: number;
    pageSize?: number;
    sort?: string;
}): Record<string, any>;
//# sourceMappingURL=query-builder.d.ts.map