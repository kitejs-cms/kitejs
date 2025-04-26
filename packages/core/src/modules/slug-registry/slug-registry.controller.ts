import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SlugRegistryService } from "./slug-registry.service";

@ApiTags("Slug Management")
@Controller("paslugsges")
export class SlugRegistryController {
  constructor(private readonly slugService: SlugRegistryService) {}

  @Get("check")
  @ApiOperation({
    summary: "Check slug availability",
    description:
      "Verifies if a slug is available and suggests alternatives if taken",
  })
  @ApiQuery({ name: "slug", required: true, example: "my-page" })
  @ApiQuery({ name: "namespace", required: true, example: "pages" })
  @ApiQuery({ name: "language", required: false, example: "en" })
  @ApiQuery({ name: "maxSuggestions", required: false, example: 3 })
  @ApiResponse({
    status: 200,
    description: "Returns slug availability status",
    schema: {
      example: {
        available: false,
        originalSlug: "my-page",
        suggestions: ["my-page-1", "my-page-2", "my-page-3"],
      },
    },
  })
  async checkSlug(
    @Query("slug") slug: string,
    @Query("namespace") namespace: string,
    @Query("language") language?: string,
    @Query("maxSuggestions") maxSuggestions: number = 3
  ) {
    const { exists, originalSlug, alternatives } =
      await this.slugService.checkSlugAvailability(
        slug,
        namespace,
        language,
        maxSuggestions
      );

    return {
      available: !exists,
      originalSlug,
      suggestions: alternatives,
    };
  }
}
