import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function ApiSort(allowedFields: string[] = []) {
  let description = 'Sort fields. Use "-" for descending. Comma separated.';
  if (allowedFields.length > 0) {
    description += ` Allowed: ${allowedFields.join(", ")}`;
  }

  return applyDecorators(
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description,
      example: "-createdAt,title",
    })
  );
}
