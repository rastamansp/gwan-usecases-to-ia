import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductSearch } from './product-search.entity';

@Entity('search_results')
export class SearchResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'search_id', type: 'uuid' })
  searchId!: string;

  @Column({ name: 'product_id', type: 'varchar', length: 100, nullable: true })
  productId?: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ name: 'original_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage?: number;

  @Column({ name: 'seller_name', type: 'varchar', length: 255, nullable: true })
  sellerName?: string;

  @Column({ name: 'seller_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  sellerRating?: number;

  @Column({ name: 'free_shipping', type: 'boolean', default: false })
  freeShipping!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition?: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string;

  @Column({ name: 'product_url', type: 'text', nullable: true })
  productUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => ProductSearch, (search) => search.results)
  @JoinColumn({ name: 'search_id' })
  search!: ProductSearch;

  // Métodos de domínio
  public calculateDiscount(): number | null {
    if (this.price && this.originalPrice && this.originalPrice > this.price) {
      return ((this.originalPrice - this.price) / this.originalPrice) * 100;
    }
    return null;
  }

  public hasDiscount(): boolean {
    return this.calculateDiscount() !== null;
  }

  public getFinalPrice(): number {
    return this.price || 0;
  }
}
