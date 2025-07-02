import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

