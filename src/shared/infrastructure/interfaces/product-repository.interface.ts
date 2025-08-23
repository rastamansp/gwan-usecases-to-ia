import { ProductSearch } from '../../domain/entities/product-search.entity';
import { SearchResult } from '../../domain/entities/search-result.entity';

export interface IProductRepository {
  save(productSearch: ProductSearch): Promise<ProductSearch>;
  findById(id: string): Promise<ProductSearch | null>;
  findByStatus(status: string): Promise<ProductSearch[]>;
  updateStatus(id: string, status: string, errorMessage?: string): Promise<ProductSearch>;
  saveResults(searchId: string, results: SearchResult[]): Promise<SearchResult[]>;
  getResults(searchId: string): Promise<SearchResult[]>;
  getSearchWithResults(searchId: string): Promise<ProductSearch | null>;
}
