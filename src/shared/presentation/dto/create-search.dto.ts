import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  IsObject,
  Validate,
  registerDecorator,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceRangeDto {
  @ApiPropertyOptional({
    description: 'Preço mínimo do produto',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Preço mínimo deve ser um número' })
  @Min(0, { message: 'Preço mínimo deve ser maior ou igual a 0' })
  min?: number;

  @ApiPropertyOptional({
    description: 'Preço máximo do produto',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Preço máximo deve ser um número' })
  @Min(0, { message: 'Preço máximo deve ser maior ou igual a 0' })
  max?: number;
}

// Validador customizado para faixa de preço
function IsValidPriceRange(validationOptions?: any) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidPriceRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value || typeof value !== 'object') return true;
          if (value.min !== undefined && value.max !== undefined) {
            return value.min < value.max;
          }
          return true;
        },
        defaultMessage() {
          return 'Faixa de preço inválida: valor mínimo deve ser menor que o máximo';
        },
      },
    });
  };
}

export class CreateSearchDto {
  @ApiProperty({
    description: 'Nome do produto a ser buscado',
    example: 'PS5',
    maxLength: 255,
  })
  @IsString({ message: 'Nome do produto deve ser uma string' })
  @IsNotEmpty({ message: 'Nome do produto é obrigatório' })
  @MaxLength(255, { message: 'Nome do produto deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  productName!: string;

  @ApiPropertyOptional({
    description: 'Número máximo de resultados a retornar',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'MaxResults deve ser um número' })
  @Min(1, { message: 'MaxResults deve ser no mínimo 1' })
  @Max(100, { message: 'MaxResults deve ser no máximo 100' })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 50 : parsed;
    }
    return value || 50;
  })
  maxResults?: number = 50;

  @ApiPropertyOptional({
    description: 'Categoria do produto',
    example: 'Gaming',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Categoria deve ter no máximo 100 caracteres' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Faixa de preço para filtrar resultados',
    type: PriceRangeDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  @IsValidPriceRange({
    message: 'Faixa de preço inválida: valor mínimo deve ser menor que o máximo',
  })
  priceRange?: PriceRangeDto;
}
