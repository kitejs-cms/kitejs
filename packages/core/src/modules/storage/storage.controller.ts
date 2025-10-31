import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "./storage.service";
import { RemoveFileDto } from "./dto/remove-file.dto";
import { CreateDirectoryDto } from "./dto/create-directory.dto";
import { RenamePathDto } from "./dto/rename-path.dto";
import { MovePathDto } from "./dto/move-path.dto";
import { CopyPathDto } from "./dto/copy-path.dto";
import { StorageResponseDto } from "./dto/storage-response.dto";
import { UpdateStorageMetadataDto } from "./dto/update-storage-metadata.dto";
import { JwtAuthGuard, PermissionsGuard } from "../auth";
import { Permissions } from "../../common";
import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { StorageResponseModel } from "./models/storage-response.model";

@ApiTags("Storage")
@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload")
  @ApiOperation({ summary: "Upload a file to storage" })
  @ApiResponse({ status: 200, description: "File uploaded successfully" })
  @ApiResponse({ status: 400, description: "No file uploaded" })
  @ApiResponse({
    status: 500,
    description: "Internal server error during file upload",
  })
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        dir: {
          type: "string",
          description: "Optional subdirectory to store the file",
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.upload")
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body("dir") dir?: string
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    try {
      const result = await this.storageService.uploadFile(file, dir);
      return {
        message: "File uploaded successfully",
        ...result,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during file upload: ${error}`
      );
    }
  }

  @Delete("remove")
  @ApiOperation({ summary: "Remove a file from storage" })
  @ApiResponse({ status: 200, description: "File removed successfully" })
  @ApiResponse({ status: 400, description: "Bad request or file not found" })
  @ApiBody({ type: RemoveFileDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.manage")
  @ApiBearerAuth()
  async removeFile(@Body() removeFileDto: RemoveFileDto) {
    const { filePath } = removeFileDto;
    try {
      await this.storageService.removeFile(filePath);
      return { message: "File removed successfully" };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error during file removal: ${error}`
      );
    }
  }

  @Get("directory")
  @ApiOperation({ summary: "Get directory structure from a given root" })
  @ApiResponse({
    status: 200,
    description: "Directory structure retrieved successfully",
    type: StorageResponseDto,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.read")
  @ApiBearerAuth()
  async getDirectoryStructure(): Promise<StorageResponseModel> {
    try {
      return await this.storageService.getDirectoryStructure();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error retrieving directory structure: ${error}`
      );
    }
  }

  @Post("directory")
  @ApiOperation({ summary: "Create an empty directory in storage" })
  @ApiResponse({ status: 200, description: "Directory created successfully" })
  @ApiResponse({
    status: 400,
    description: "Bad request or error creating directory",
  })
  @ApiBody({ type: CreateDirectoryDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.manage")
  @ApiBearerAuth()
  async createEmptyDirectory(@Body() createDirectoryDto: CreateDirectoryDto) {
    try {
      await this.storageService.createEmptyDirectory(
        createDirectoryDto.directoryPath
      );
      return { message: "Directory created successfully" };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating directory: ${error}`
      );
    }
  }

  @Post("rename")
  @ApiOperation({ summary: "Rename a file or directory in storage" })
  @ApiResponse({ status: 200, description: "Item renamed successfully" })
  @ApiResponse({
    status: 400,
    description: "Bad request or error renaming item",
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.manage")
  @ApiBearerAuth()
  @ApiBody({ type: RenamePathDto })
  async renamePath(@Body() renameDto: RenamePathDto) {
    try {
      await this.storageService.renamePath(
        renameDto.oldPath,
        renameDto.newPath
      );
      return { message: "Item renamed successfully" };
    } catch (error) {
      throw new InternalServerErrorException(`Error renaming item: ${error}`);
    }
  }

  @Post("move")
  @ApiOperation({ summary: "Move a file or directory to a new location" })
  @ApiResponse({ status: 200, description: "Item moved successfully" })
  @ApiResponse({ status: 400, description: "Bad request or error moving item" })
  @ApiBody({ type: MovePathDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.manage")
  @ApiBearerAuth()
  async movePath(@Body() moveDto: MovePathDto) {
    try {
      await this.storageService.movePath(
        moveDto.sourcePath,
        moveDto.destinationPath
      );
      return { message: "Item moved successfully" };
    } catch (error) {
      throw new InternalServerErrorException(`Error moving item: ${error}`);
    }
  }

  @Post("copy")
  @ApiOperation({ summary: "Copy a file or directory to a new location" })
  @ApiResponse({ status: 200, description: "Item copied successfully" })
  @ApiResponse({
    status: 400,
    description: "Bad request or error copying item",
  })
  @ApiBody({ type: CopyPathDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.manage")
  @ApiBearerAuth()
  async copyPath(@Body() copyDto: CopyPathDto) {
    try {
      await this.storageService.copyPath(
        copyDto.sourcePath,
        copyDto.destinationPath
      );
      return { message: "Item copied successfully" };
    } catch (error) {
      throw new InternalServerErrorException(`Error copying item: ${error}`);
    }
  }

  @Patch(":id/metadata")
  @ApiOperation({ summary: "Update SEO metadata for a media asset" })
  @ApiResponse({ status: 200, description: "Metadata updated successfully" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  @ApiParam({ name: "id", description: "Asset ID" })
  @ApiBody({ type: UpdateStorageMetadataDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:storage.manage")
  @ApiBearerAuth()
  async updateMetadata(
    @Param("id") id: string,
    @Body() dto: UpdateStorageMetadataDto
  ) {
    try {
      const result = await this.storageService.updateMetadata(
        id,
        dto
      );
      return {
        message: "Metadata updated successfully",
        data: result,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating metadata: ${error}`
      );
    }
  }
}
