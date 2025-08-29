import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ExecuteProductSearchUseCase } from '../../shared/application/use-cases/execute-product-search.use-case';
import { CreateSearchDto } from '../../shared/presentation/dto/create-search.dto';
import { SearchResponseDto } from '../../shared/presentation/dto/search-response.dto';
import {
  SearchResultsResponseDto,
  ProductResultDto,
  SearchInfoDto,
  SearchResultsDataDto,
} from '../../shared/presentation/dto/search-results-response.dto';
import { ExecuteSearchCommand } from '../../shared/application/commands/execute-search.command';
import { IProductRepository } from '../../shared/infrastructure/interfaces/product-repository.interface';

@ApiTags('search-product')
@Controller('search-product')
export class SearchProductController {
  constructor(
    private readonly executeSearchUseCase: ExecuteProductSearchUseCase,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Criar nova busca de produto',
    description: 'Inicia uma nova busca automatizada de produtos usando Playwright',
  })
  @ApiBody({
    type: CreateSearchDto,
    description: 'Dados para criar a busca de produto',
  })
  @ApiResponse({
    status: 202,
    description: 'Busca criada com sucesso',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na validação',
  })
  public async createSearch(@Body() createSearchDto: CreateSearchDto): Promise<SearchResponseDto> {
    const command = new ExecuteSearchCommand(createSearchDto);
    const result = await this.executeSearchUseCase.execute(command);

    return SearchResponseDto.fromResult(
      result.searchId,
      result.productName,
      result.status,
      result.createdAt,
    );
  }

  @Get(':searchId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar status de uma busca',
    description: 'Recupera o status atual e detalhes de uma busca específica',
  })
  @ApiParam({
    name: 'searchId',
    description: 'ID único da busca',
    example: 'bfc05476-0cd9-4371-b5e9-baaf9deaea0e',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da busca recuperado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Busca não encontrada',
  })
  public async getSearchStatus(@Param('searchId') searchId: string): Promise<any> {
    try {
      const search = await this.productRepository.findById(searchId);

      if (!search) {
        throw new NotFoundException(`Busca com ID ${searchId} não encontrada`);
      }

      return {
        statusCode: 200,
        message: 'Status da busca recuperado com sucesso',
        data: {
          searchId: search.id,
          productName: search.productName,
          status: search.status,
          maxResults: search.maxResults,
          category: search.category,
          priceMin: search.priceMin,
          priceMax: search.priceMax,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt,
          completedAt: search.completedAt,
          errorMessage: search.errorMessage,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new NotFoundException(`Erro ao recuperar status da busca: ${errorMessage}`);
    }
  }

  @Get(':searchId/results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter resultados de uma busca',
    description: 'Recupera todos os produtos encontrados em uma busca específica',
  })
  @ApiParam({
    name: 'searchId',
    description: 'ID único da busca',
    example: 'bfc05476-0cd9-4371-b5e9-baaf9deaea0e',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados da busca recuperados com sucesso',
    type: SearchResultsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Busca não encontrada ou sem resultados',
  })
  public async getSearchResults(
    @Param('searchId') searchId: string,
  ): Promise<SearchResultsResponseDto> {
    try {
      // Primeiro verificar se a busca existe
      const search = await this.productRepository.findById(searchId);

      if (!search) {
        throw new NotFoundException(`Busca com ID ${searchId} não encontrada`);
      }

      // Buscar os resultados dos produtos
      const results = await this.productRepository.getResults(searchId);

      if (results.length === 0) {
        const searchInfo = new SearchInfoDto();
        searchInfo.createdAt = search.createdAt;
        searchInfo.completedAt = search.completedAt;
        searchInfo.maxResults = search.maxResults;

        return SearchResultsResponseDto.fromResults(
          search.id,
          search.productName,
          search.status,
          [],
          searchInfo,
        );
      }

      // Formatar os resultados dos produtos
      const formattedResults: ProductResultDto[] = results.map(result => {
        const productResult = new ProductResultDto();
        productResult.id = result.id;
        productResult.title = result.title;
        productResult.price = result.price;
        productResult.originalPrice = result.originalPrice;
        productResult.discountPercentage = result.discountPercentage;
        productResult.sellerName = result.sellerName;
        productResult.sellerRating = result.sellerRating;
        productResult.freeShipping = result.freeShipping;
        productResult.condition = result.condition;
        productResult.imageUrl = result.imageUrl;
        productResult.productUrl = result.productUrl;
        productResult.createdAt = result.createdAt;
        return productResult;
      });

      const searchInfo = new SearchInfoDto();
      searchInfo.createdAt = search.createdAt;
      searchInfo.completedAt = search.completedAt;
      searchInfo.maxResults = search.maxResults;

      return SearchResultsResponseDto.fromResults(
        search.id,
        search.productName,
        search.status,
        formattedResults,
        searchInfo,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new NotFoundException(`Erro ao recuperar resultados da busca: ${errorMessage}`);
    }
  }
}
