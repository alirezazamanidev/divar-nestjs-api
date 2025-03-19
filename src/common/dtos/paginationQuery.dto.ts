import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ type: 'integer' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ type: 'integer' })
  @IsOptional()
  @IsNumber()
  limit: number;
}
