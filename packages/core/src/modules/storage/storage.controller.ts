import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "./storage.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";

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
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
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
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "The full path or key of the file to remove",
        },
      },
    },
  })
  async removeFile(@Body("filePath") filePath: string) {
    if (!filePath) throw new BadRequestException("File path is required");

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
  })
  @ApiResponse({
    status: 400,
    description: "Bad request or error retrieving directory structure",
  })
  async getDirectoryStructure() {
    try {
      const structure = await this.storageService.getDirectoryStructure();
      return structure;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error retrieving directory structure: ${error}`
      );
    }
  }

  @Post("directory")
  @ApiOperation({ summary: "Create an empty directory in storage" })
  @ApiResponse({
    status: 200,
    description: "Directory created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request or error creating directory",
  })
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        directoryPath: {
          type: "string",
          description: "The path where the empty directory should be created",
        },
      },
    },
  })
  async createEmptyDirectory(@Body("directoryPath") directoryPath: string) {
    if (!directoryPath)
      throw new BadRequestException("Directory path is required");

    try {
      await this.storageService.createEmptyDirectory(directoryPath);
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
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        oldPath: {
          type: "string",
          description: "The current path of the item",
        },
        newPath: {
          type: "string",
          description: "The desired new path of the item",
        },
      },
    },
  })
  async renamePath(
    @Body("oldPath") oldPath: string,
    @Body("newPath") newPath: string
  ) {
    if (!oldPath || !newPath)
      throw new BadRequestException("Both oldPath and newPath are required");

    try {
      await this.storageService.renamePath(oldPath, newPath);
      return { message: "Item renamed successfully" };
    } catch (error) {
      throw new InternalServerErrorException(`Error renaming item: ${error}`);
    }
  }

  @Post("move")
  @ApiOperation({ summary: "Move a file or directory to a new location" })
  @ApiResponse({ status: 200, description: "Item moved successfully" })
  @ApiResponse({ status: 400, description: "Bad request or error moving item" })
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        sourcePath: {
          type: "string",
          description: "The current path of the item",
        },
        destinationPath: {
          type: "string",
          description: "The new destination path for the item",
        },
      },
    },
  })
  async movePath(
    @Body("sourcePath") sourcePath: string,
    @Body("destinationPath") destinationPath: string
  ) {
    if (!sourcePath || !destinationPath)
      throw new BadRequestException(
        "Both sourcePath and destinationPath are required"
      );

    try {
      await this.storageService.movePath(sourcePath, destinationPath);
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
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        sourcePath: {
          type: "string",
          description: "The current path of the item",
        },
        destinationPath: {
          type: "string",
          description: "The destination path for the copy",
        },
      },
    },
  })
  async copyPath(
    @Body("sourcePath") sourcePath: string,
    @Body("destinationPath") destinationPath: string
  ) {
    if (!sourcePath || !destinationPath)
      throw new BadRequestException(
        "Both sourcePath and destinationPath are required"
      );

    try {
      await this.storageService.copyPath(sourcePath, destinationPath);
      return { message: "Item copied successfully" };
    } catch (error) {
      throw new InternalServerErrorException(`Error copying item: ${error}`);
    }
  }
}
