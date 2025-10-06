import { IsString, IsEmail, IsEnum, IsArray, IsOptional, IsNumber } from 'class-validator';

export class CreateBoardMemberDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(['editor_in_chief', 'associate_editor', 'editorial_assistant', 'reviewer'])
  role: string;

  @IsString()
  affiliation: string;

  @IsArray()
  @IsString({ each: true })
  expertise: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  publications?: number;

  @IsOptional()
  @IsNumber()
  hIndex?: number;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
