import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function ApiPagination() {
  return applyDecorators(
    ApiQuery({
      name: "page[number]",
      required: false,
      type: Number,
      description: "Page number",
      example: 1,
    }),
    ApiQuery({
      name: "page[size]",
      required: false,
      type: Number,
      description: "Page size (max: 100)",
      example: 10,
    })
  );
}
