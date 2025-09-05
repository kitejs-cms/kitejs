import { NotesService } from './notes.service';
import { NoteResponseDto } from './dto/note-response.dto';
import { NoteCreateDto } from './dto/note-create.dto';
import { NoteUpdateDto } from './dto/note-update.dto';
import { NoteSource } from './models/note-source.enum';
import { JwtAuthGuard, JwtPayloadModel } from '../auth';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import {
  GetAuthUser,
  ValidateObjectIdPipe,
} from '../../common';

@ApiTags('Notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create note' })
  @ApiResponse({ status: 201, type: NoteResponseDto })
  async createNote(
    @Body() dto: NoteCreateDto,
    @GetAuthUser() user: JwtPayloadModel
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.createNote(dto, user);
    return new NoteResponseDto(note);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update note' })
  @ApiResponse({ status: 200, type: NoteResponseDto })
  async updateNote(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: NoteUpdateDto
  ): Promise<NoteResponseDto> {
    const note = await this.notesService.updateNote(id, dto.content);
    return new NoteResponseDto(note);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve notes' })
  @ApiQuery({ name: 'targetId', required: true, type: String })
  @ApiQuery({ name: 'targetType', required: true, type: String })
  @ApiQuery({ name: 'source', required: false, enum: NoteSource })
  @ApiResponse({ status: 200, type: [NoteResponseDto] })
  async getNotes(
    @Query('targetId', ValidateObjectIdPipe) targetId: string,
    @Query('targetType') targetType: string,
    @Query('source') source?: NoteSource
  ) {
    const notes = await this.notesService.findNotes(targetId, targetType, source);
    return notes.map((n) => new NoteResponseDto(n));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete note' })
  @ApiResponse({ status: 200 })
  async deleteNote(@Param('id', ValidateObjectIdPipe) id: string) {
    await this.notesService.deleteNote(id);
  }
}
