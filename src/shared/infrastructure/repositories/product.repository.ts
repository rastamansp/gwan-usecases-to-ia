import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProductRepository } from '../interfaces/product-repository.interface';
import { ProductSearch } from '../../domain/entities/product-search.entity';
import { SearchResult } from '../../domain/entities/search-result.entity';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductSearch)
    private readonly productSearchRepository: Repository<ProductSearch>,
    
    @InjectRepository(SearchResult)
    private readonly searchResultRepository: Repository<SearchResult>,
  ) {}

  public async save(productSearch: ProductSearch): Promise<ProductSearch> {
    return await this.productSearchRepository.save(productSearch);
  }

  public async findById(id: string): Promise<ProductSearch | null> {
    return await this.productSearchRepository.findOne({
      where: { id },
      relations: ['results'],
    });
  }

  public async findByStatus(status: string): Promise<ProductSearch[]> {
    return await this.productSearchRepository.find({
      where: { status: status as any },
      relations: ['results'],
      order: { createdAt: 'DESC' },
    });
  }

  public async updateStatus(
    id: string, 
    status: string, 
    errorMessage?: string
  ): Promise<ProductSearch> {
    const productSearch = await this.findById(id);
    if (!productSearch) {
      throw new Error(`Busca com ID ${id} não encontrada`);
    }

    productSearch.status = status as any;
    if (errorMessage) {
      productSearch.errorMessage = errorMessage;
    }

    return await this.save(productSearch);
  }

  public async saveResults(
    searchId: string, 
    results: SearchResult[]
  ): Promise<SearchResult[]> {
    const searchResults = results.map(result => {
      result.searchId = searchId;
      return result;
    });

    return await this.searchResultRepository.save(searchResults);
  }

  public async getResults(searchId: string): Promise<SearchResult[]> {
    return await this.searchResultRepository.find({
      where: { searchId },
      order: { createdAt: 'ASC' },
    });
  }

  public async getSearchWithResults(searchId: string): Promise<ProductSearch | null> {
    return await this.productSearchRepository.findOne({
      where: { id: searchId },
      relations: ['results'],
    });
  }
}
