import { PartialType } from '@nestjs/mapped-types';
import { CreateBoardMemberDto } from './create-board-member.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateBoardMemberDto extends PartialType(CreateBoardMemberDto) {
  @IsOptional()
  @IsEnum(['active', 'inactive', 'on_leave'])
  status?: string;
}
