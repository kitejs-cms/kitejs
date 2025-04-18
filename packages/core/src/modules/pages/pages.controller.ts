import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { PagesService } from "./services/pages.service";
import { ValidateObjectIdPipe } from "../../common";
import { PageResponseDto } from "./dto/page-response.dto";

import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  HttpCode,
} from "@nestjs/common";

@ApiTags("Pages")
@Controller("pages")
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get("web/:slug")
  @ApiOperation({
    summary: "Retrieve page for public web in specific language",
  })
  @ApiQuery({
    name: "lang",
    required: true,
    description: "Language code to get the correct translation (e.g. en, it)",
    type: String,
  })
  @ApiQuery({
    name: "fallback",
    required: false,
    description:
      "Optional fallback language code if requested translation is missing",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Page response with selected translation",
    type: PageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Page or translation not found" })
  async getPageForWeb(
    @Param("slug") slug: string,
    @Query("lang") language: string,
    @Query("fallback") fallbackLanguage?: string
  ) {
    try {
      const response = await this.pagesService.findPageForWeb(
        slug,
        language,
        fallbackLanguage
      );
      return new PageResponseDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve page for web.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a page" })
  @ApiResponse({ status: 200, description: "The page has been deleted" })
  @ApiResponse({ status: 404, description: "Page not found" })
  @HttpCode(200)
  async deletePage(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const result = await this.pagesService.deletePage(id);
      if (!result) {
        throw new NotFoundException(`Page with ID "${id}" not found.`);
      }
      return { message: `Page with ID "${id}" has been deleted.` };
    } catch (error) {
      throw new BadRequestException("Failed to delete the page.");
    }
  }
}
