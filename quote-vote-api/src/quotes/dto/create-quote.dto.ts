import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsUrl,
  IsArray,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty({ message: 'Quote text cannot be empty.' })
  @MinLength(5, { message: 'Quote text must be at least 5 characters long.' })
  text!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}