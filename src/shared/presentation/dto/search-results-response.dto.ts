import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class ProductResultDto {
  @ApiProperty({
    description: 'ID único do resultado',
    example: 'b376282a-59c3-415c-88e6-37bac7331e3b',
  })
  id!: string;

  @ApiProperty({
    description: 'Título do produto',
    example: 'Apple iPad Pro 13" Chip M4 Com Wifi + 5g Nano-texture 1tb',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Preço atual do produto em reais',
    example: 19477.0,
  })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  price?: number;

  @ApiPropertyOptional({
    description: 'Preço original do produto em reais',
    example: 22099.0,
  })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  originalPrice?: number;

  @ApiPropertyOptional({
    description: 'Percentual de desconto',
    example: 11.86,
  })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Nome do vendedor',
    example: 'Loja Oficial',
  })
  sellerName?: string;

  @ApiPropertyOptional({
    description: 'Avaliação do vendedor (0-5)',
    example: 4.8,
  })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  sellerRating?: number;

  @ApiProperty({
    description: 'Frete grátis disponível',
    example: true,
  })
  freeShipping!: boolean;

  @ApiPropertyOptional({
    description: 'Condição do produto',
    example: 'Novo',
  })
  condition?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem do produto',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'URL do produto no Mercado Livre',
  })
  productUrl?: string;

  @ApiProperty({
    description: 'Data de criação do resultado',
    example: '2025-08-23T01:03:12.500Z',
  })
  createdAt!: Date;

  // Métodos auxiliares para formatação
  public getFormattedPrice(): string {
    if (!this.price) return 'Preço não disponível';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.price);
  }

  public getFormattedOriginalPrice(): string {
    if (!this.originalPrice) return 'Preço original não disponível';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.originalPrice);
  }

  public getFormattedDiscount(): string {
    if (!this.discountPercentage) return '';
    return `${this.discountPercentage.toFixed(2)}% OFF`;
  }
}

export class SearchInfoDto {
  @ApiProperty({
    description: 'Data de criação da busca',
    example: '2025-08-23T01:02:42.861Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Data de conclusão da busca',
    example: '2025-08-23T01:03:12.677Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Número máximo de resultados solicitados',
    example: 50,
  })
  maxResults!: number;
}

export class SearchResultsDataDto {
  @ApiProperty({
    description: 'ID único da busca',
    example: 'c4532f29-104d-4328-9669-de038d1b7988',
  })
  searchId!: string;

  @ApiProperty({
    description: 'Nome do produto buscado',
    example: 'IPAD pro M4 516gb',
  })
  productName!: string;

  @ApiProperty({
    description: 'Status atual da busca',
    example: 'completed',
  })
  status!: string;

  @ApiProperty({
    description: 'Total de resultados encontrados',
    example: 1,
  })
  totalResults!: number;

  @ApiProperty({
    description: 'Lista de produtos encontrados',
    type: [ProductResultDto],
  })
  results!: ProductResultDto[];

  @ApiProperty({
    description: 'Informações da busca',
    type: SearchInfoDto,
  })
  searchInfo!: SearchInfoDto;
}

export class SearchResultsResponseDto {
  @ApiProperty({
    description: 'Código de status da resposta',
    example: 200,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensagem de resposta',
    example: 'Resultados da busca recuperados com sucesso',
  })
  message!: string;

  @ApiProperty({
    description: 'Dados da resposta',
    type: SearchResultsDataDto,
  })
  data!: SearchResultsDataDto;

  static fromResults(
    searchId: string,
    productName: string,
    status: string,
    results: ProductResultDto[],
    searchInfo: SearchInfoDto,
  ): SearchResultsResponseDto {
    const response = new SearchResultsResponseDto();
    response.statusCode = 200;
    response.message = 'Resultados da busca recuperados com sucesso';

    const data = new SearchResultsDataDto();
    data.searchId = searchId;
    data.productName = productName;
    data.status = status;
    data.totalResults = results.length;
    data.results = results;
    data.searchInfo = searchInfo;

    response.data = data;
    return response;
  }
}
