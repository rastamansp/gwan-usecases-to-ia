import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SearchStatus } from '../enums/search-status.enum';
import { SearchResult } from './search-result.entity';

@Entity('product_searches')
export class ProductSearch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName!: string;

  @Column({ type: 'varchar', length: 50, default: SearchStatus.QUEUED })
  status!: SearchStatus;

  @Column({ name: 'max_results', type: 'int', default: 50 })
  maxResults!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ name: 'price_min', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin?: number;

  @Column({ name: 'price_max', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @OneToMany(() => SearchResult, (result: SearchResult) => result.search)
  results!: SearchResult[];

  // Métodos de domínio
  public markAsProcessing(): void {
    this.status = SearchStatus.PROCESSING;
  }

  public markAsCompleted(): void {
    this.status = SearchStatus.COMPLETED;
    this.completedAt = new Date();
  }

  public markAsFailed(errorMessage: string): void {
    this.status = SearchStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  public markAsCancelled(): void {
    this.status = SearchStatus.CANCELLED;
  }

  public isCompleted(): boolean {
    return this.status === SearchStatus.COMPLETED;
  }

  public isFailed(): boolean {
    return this.status === SearchStatus.FAILED;
  }

  public isProcessing(): boolean {
    return this.status === SearchStatus.PROCESSING;
  }

  public isQueued(): boolean {
    return this.status === SearchStatus.QUEUED;
  }
}
