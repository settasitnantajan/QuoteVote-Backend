import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetQuotesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['date_desc', 'votes', 'date_asc'])
  sort?: 'date_desc' | 'votes' | 'date_asc' = 'date_desc';
}
