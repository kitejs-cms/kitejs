"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFilterQuery = buildFilterQuery;
exports.buildCompleteQuery = buildCompleteQuery;
function buildFilterQuery(conditions) {
    return conditions.reduce((query, condition) => {
        if (isEmpty(condition.value))
            return query;
        const key = condition.operator === "equals"
            ? condition.field
            : `${condition.field}[${condition.operator}]`;
        query[key] = parseValue(condition.value);
        return query;
    }, {});
}
function buildCompleteQuery(conditions, options = {}) {
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
function parseValue(value) {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value))
        return value;
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string" && isDateString(value)) {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toISOString();
    }
    return value;
}
function isEmpty(value) {
    if (value === null || value === undefined || value === "")
        return true;
    if (Array.isArray(value))
        return value.length === 0;
    return false;
}
function isDateString(value) {
    return /^\d{4}-\d{2}-\d{2}/.test(value);
}
//# sourceMappingURL=query-builder.js.map