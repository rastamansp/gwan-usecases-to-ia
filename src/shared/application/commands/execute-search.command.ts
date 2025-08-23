import { CreateSearchDto } from '../../presentation/dto/create-search.dto';

export class ExecuteSearchCommand {
  constructor(
    public readonly data: CreateSearchDto,
    public readonly searchId: string = crypto.randomUUID(),
    public readonly timestamp: Date = new Date(),
  ) {}

  public get productName(): string {
    return this.data.productName;
  }

  public get maxResults(): number {
    return this.data.maxResults || 50;
  }

  public get category(): string | undefined {
    return this.data.category;
  }

  public get priceRange(): CreateSearchDto['priceRange'] {
    return this.data.priceRange;
  }

  public hasPriceRange(): boolean {
    return !!this.priceRange && (!!this.priceRange.min || !!this.priceRange.max);
  }

  public isValidPriceRange(): boolean {
    if (!this.hasPriceRange()) return true;
    if (this.priceRange!.min && this.priceRange!.max) {
      return this.priceRange!.min < this.priceRange!.max;
    }
    return true;
  }
}
