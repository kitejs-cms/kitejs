import { isISODateString, isNumericString, isObjectIdString } from "./string.util";
import { Logger } from '@nestjs/common';

/**
 * Interface representing the configuration for parsing queries
 */
export interface QueryParsingConfig {
  /** Default sorting when no sort is provided */
  defaultSort?: Record<string, 1 | -1>;
  /** List of allowed filter fields to prevent unwanted database queries */
  allowedFilters?: string[];
  /** Maximum number of items that can be requested in a single query */
  maxLimit?: number;
  /** Default limit when none is specified */
  defaultLimit?: number;
}

/**
 * Interface representing the parsed MongoDB query parameters
 */
export interface ParsedMongoQuery {
  /** MongoDB filter object */
  filter: Record<string, any>;
  /** MongoDB sort object */
  sort: Record<string, 1 | -1>;
  /** Number of documents to skip (for pagination) */
  skip: number;
  /** Number of documents to take/limit */
  take: number;
}

/**
 * Main utility class for parsing HTTP query parameters into MongoDB query objects
 */
export class QueryParserUtil {
  private static readonly logger = new Logger(QueryParserUtil.name)

  /**
   * Parse HTTP query parameters into a MongoDB-compatible query object
   * 
   * @param queryParams - Raw query parameters from HTTP request
   * @param config - Configuration for parsing behavior
   * @returns Parsed MongoDB query object
   * 
   * @example
   * ```typescript
   * const queryParams = {
   *   'page[number]': '2',
   *   'page[size]': '10',
   *   status: 'active',
   *   'createdAt[gte]': '2023-01-01',
   *   sort: '-createdAt,name'
   * };
   * 
   * const config = {
   *   allowedFilters: ['status', 'createdAt', 'role'],
   *   maxLimit: 100
   * };
   * 
   * const result = QueryParserUtil.parseQuery(queryParams, config);
   * // Result:
   * // {
   * //   filter: { 
   * //     status: 'active', 
   * //     createdAt: { $gte: Date }
   * //   },
   * //   sort: { createdAt: -1, name: 1 },
   * //   skip: 10,
   * //   take: 10
   * // }
   * ```
   */
  static parseQuery(
    queryParams: Record<string, any>,
    config: QueryParsingConfig = {}
  ): ParsedMongoQuery {
    const {
      defaultSort = { createdAt: -1 },
      allowedFilters = [],
      maxLimit = 100,
      defaultLimit = 10
    } = config;

    const result: ParsedMongoQuery = {
      filter: {},
      sort: defaultSort,
      skip: 0,
      take: defaultLimit
    };

    // Parse pagination parameters FIRST
    this.parsePagination(queryParams, result, maxLimit, defaultLimit);

    // Parse sorting parameters
    this.parseSorting(queryParams, result, defaultSort);

    // Parse filter parameters (skip special parameters)
    this.parseFilters(queryParams, result, allowedFilters);

    return result;
  }

  /**
   * Parse pagination parameters (JSON:API standard only)
   * Supports: page[number], page[size], page[offset], page[limit]
   */
  private static parsePagination(
    queryParams: Record<string, any>,
    result: ParsedMongoQuery,
    maxLimit: number,
    defaultLimit: number
  ): void {
    if (queryParams['page[number]'] !== undefined || queryParams['page[size]'] !== undefined) {
      const pageNumber = this.parseInteger(queryParams['page[number]'], 1);
      const pageSize = Math.min(
        this.parseInteger(queryParams['page[size]'], defaultLimit),
        maxLimit
      );
      result.skip = (pageNumber - 1) * pageSize;
      result.take = pageSize;
    }
    else {
      result.skip = 0;
      result.take = defaultLimit;
    }
  }

  /**
   * Parse sorting parameters
   */
  private static parseSorting(
    queryParams: Record<string, any>,
    result: ParsedMongoQuery,
    defaultSort: Record<string, 1 | -1>
  ): void {
    if (!queryParams.sort) {
      result.sort = defaultSort;
      return;
    }

    const sort: Record<string, 1 | -1> = {};
    const sortFields = Array.isArray(queryParams.sort)
      ? queryParams.sort
      : queryParams.sort.split(',');

    sortFields.forEach((field: string) => {
      const trimmedField = field.trim();
      if (trimmedField.startsWith('-')) {
        // Descending order
        sort[trimmedField.substring(1)] = -1;
      } else {
        // Ascending order
        sort[trimmedField] = 1;
      }
    });

    // Use parsed sort if not empty, otherwise use default
    result.sort = Object.keys(sort).length > 0 ? sort : defaultSort;
  }

  /**
   * Parse filter parameters and convert them to MongoDB filter conditions
   */
  private static parseFilters(
    queryParams: Record<string, any>,
    result: ParsedMongoQuery,
    allowedFilters: string[]
  ): void {
    Object.keys(queryParams).forEach(key => {
      // Skip special parameters
      if (this.isSpecialParameter(key)) {
        return;
      }

      // Skip empty values
      const value = queryParams[key];
      if (value === undefined || value === null || value === '') return;

      // Extract field name for validation
      const fieldName = key.includes('[') ? key.split('[')[0] : key;

      // Security: Validate field name
      if (!this.isValidFieldName(fieldName)) {
        this.logger.warn(`Invalid field name '${fieldName}' detected and ignored`);
        return;
      }

      // Check if filter is allowed (if allowedFilters is specified)
      if (allowedFilters.length > 0 && !allowedFilters.includes(fieldName)) {
        this.logger.warn(`Filter '${fieldName}' is not in allowedFilters list and will be ignored`);
        return;
      }

      // Handle operator-based filters (e.g., createdAt[gte])
      if (key.includes('[') && key.includes(']')) {
        this.parseOperatorFilter(key, value, result.filter);
      } else {
        // Handle simple equality filters
        result.filter[key] = this.parseValue(value);
      }
    });
  }

  /**
   * Parse operator-based filter (e.g., field[gte]=value)
   */
  private static parseOperatorFilter(
    key: string,
    value: any,
    filter: Record<string, any>
  ): void {
    const [field, operator] = key.split('[');
    const op = operator.replace(']', '');

    // Check if this is actually a special parameter before processing
    if (this.isSpecialParameter(key)) {
      return;
    }
    // Security: Validate operator
    if (!this.isValidOperator(op)) {
      this.logger.warn(`Invalid operator '${op}' detected and ignored`);
      return;
    }

    // Initialize field object if it doesn't exist
    if (!filter[field]) {
      filter[field] = {};
    }

    const mongoCondition = this.buildMongoOperator(op, value);

    // Merge with existing conditions for the same field
    if (typeof filter[field] === 'object' && !Array.isArray(filter[field])) {
      Object.assign(filter[field], mongoCondition);
    } else {
      filter[field] = mongoCondition;
    }
  }

  /**
   * Convert operator and value to MongoDB operator object
   */
  private static buildMongoOperator(operator: string, value: any): Record<string, any> {
    const parsedValue = this.parseValue(value);

    switch (operator.toLowerCase()) {
      case 'gte':
        return { $gte: parsedValue };
      case 'lte':
        return { $lte: parsedValue };
      case 'gt':
        return { $gt: parsedValue };
      case 'lt':
        return { $lt: parsedValue };
      case 'ne':
        return { $ne: parsedValue };
      case 'in':
        return { $in: Array.isArray(value) ? value.map(v => this.parseValue(v)) : [parsedValue] };
      case 'nin':
        return { $nin: Array.isArray(value) ? value.map(v => this.parseValue(v)) : [parsedValue] };
      case 'contains':
      case 'like':
        return { $regex: value, $options: 'i' };
      case 'startswith':
        return { $regex: `^${value}`, $options: 'i' };
      case 'endswith':
        return { $regex: `${value}$`, $options: 'i' };
      case 'exists':
        return { $exists: value === 'true' || value === true };
      case 'size':
        return { $size: this.parseInteger(value, 0) };
      case 'regex':
        return { $regex: value, $options: 'i' };
      default:
        this.logger.warn(`Unknown operator '${operator}', treating as equality`);
        return { $eq: parsedValue };
    }
  }

  /**
   * Parse and convert string values to appropriate types with security checks
   */
  private static parseValue(value: any): any {
    if (value === null || value === undefined) return value;

    // Security: Block complex objects that could contain injection
    if (typeof value === 'object') {
      this.logger.warn('Object values not allowed in filters, converting to string');
      return String(value);
    }

    // Security: Limit string length
    if (typeof value === 'string' && value.length > 1000) {
      this.logger.warn('String too long, truncating');
      value = value.substring(0, 1000);
    }

    // Handle boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Handle ISO date strings
    if (typeof value === 'string' && isISODateString(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }

    // Handle numeric strings
    if (typeof value === 'string' && isNumericString(value)) {
      const num = Number(value);
      // Security: Limit very large numbers
      if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
        this.logger.warn('Number too large, using MAX_SAFE_INTEGER');
        return num > 0 ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER;
      }
      return num;
    }

    // Handle MongoDB ObjectId format
    if (typeof value === 'string' && isObjectIdString(value)) {
      return value; // Keep as string, MongoDB will handle conversion
    }

    // Security: Escape potentially dangerous characters
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      value = value.replace(/[<>'"&]/g, '');
    }

    return value;
  }

  /**
   * Parse integer with fallback to default value
   */
  private static parseInteger(value: any, defaultValue: number): number {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Check if parameter is a special query parameter that should be skipped during filtering
   * Handles both URL-encoded and decoded forms, plus common typos
   */
  private static isSpecialParameter(key: string): boolean {
    // Normalize the key by URL-decoding if needed
    const normalizedKey = decodeURIComponent(key).toLowerCase();

    // Standard special parameters
    const specialParams = [
      'page[size]',
      'page[number]',
      'sort'
    ];

    // Check exact matches (case-insensitive)
    if (specialParams.includes(normalizedKey)) {
      return true;
    }

    // Check for common pagination parameter patterns
    const paginationPatterns = [
      /^page\[size\]$/i,
      /^page\[number\]$/i,
      /^sort$/i,
      // Handle common typos
      /^pgae\[size\]$/i,    // typo: pgae instead of page
      /^pgae\[number\]$/i,  // typo: pgae instead of page
      /^page\[szie\]$/i,    // typo: szie instead of size
      /^page\[nubmer\]$/i,  // typo: nubmer instead of number
    ];

    return paginationPatterns.some(pattern => pattern.test(normalizedKey));
  }

  /**
   * Sanitize and validate filter field names to prevent injection
   */
  private static isValidFieldName(fieldName: string): boolean {
    // Only letters, numbers, underscore and dot notation for nested fields
    const validFieldRegex = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

    // Block dangerous MongoDB operators
    const dangerousFields = [
      '$where', '$expr', '$jsonSchema', '$regex', '$options',
      '$elemMatch', '$all', '$size', '$mod', '$type', '$exists',
      'constructor', 'prototype', '__proto__'
    ];

    return validFieldRegex.test(fieldName) && !dangerousFields.includes(fieldName);
  }

  /**
   * Sanitize operator to prevent injection
   */
  private static isValidOperator(operator: string): boolean {
    const allowedOperators = [
      'gte', 'lte', 'gt', 'lt', 'ne', 'in', 'nin',
      'contains', 'like', 'startswith', 'endswith',
      'exists', 'size', 'regex'
    ];

    return allowedOperators.includes(operator.toLowerCase());
  }

}

/**
 * Convenience function for parsing queries with default configuration
 */
export function parseQuery(
  queryParams: Record<string, any>,
  config?: QueryParsingConfig
): ParsedMongoQuery {
  return QueryParserUtil.parseQuery(queryParams, config);
}
