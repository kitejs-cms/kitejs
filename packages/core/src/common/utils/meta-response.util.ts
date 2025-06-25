import { PaginationModel } from "../models/pagination.model";
import { MetaModel } from "../models/api-response.model";
import { ParsedMongoQuery } from "./query-parser.util";

/**
 * Helper function to create pagination metadata from parsed query and total count
 */
export function createPaginationMeta(
  parsedQuery: ParsedMongoQuery,
  totalItems: number
): PaginationModel {
  const currentPage = Math.floor(parsedQuery.skip / parsedQuery.take) + 1;
  const totalPages = Math.ceil(totalItems / parsedQuery.take);

  return {
    currentPage,
    totalPages,
    pageSize: parsedQuery.take,
    totalItems,
  };
}

/**
 * Helper function to create complete MetaModel from parsed query and total count
 */
export function createMetaModel(
  parsedQuery: ParsedMongoQuery,
  totalItems?: number,
): MetaModel {
  const pagination = totalItems ? createPaginationMeta(parsedQuery, totalItems) : undefined

  // Convert MongoDB sort object to human-readable format
  const humanReadableSort = Object.entries(parsedQuery.sort).reduce((acc, [field, direction]) => {
    acc[field] = direction === 1 ? 'asc' : 'desc';
    return acc;
  }, {} as Record<string, string>);

  return {
    timestamp: new Date().toISOString(),
    query: parsedQuery.filter,
    pagination,
    sort: humanReadableSort,
  };
}