import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SearchStatus } from '../enums/search-status.enum';
import { SearchResult } from './search-result.entity';

@Entity('product_searches')
export class ProductSearch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  productName!: string;

  @Column({ type: 'varchar', length: 50, default: SearchStatus.QUEUED })
  status!: SearchStatus;

  @Column({ type: 'int', default: 50 })
  maxResults!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
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
