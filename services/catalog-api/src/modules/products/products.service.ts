import { eq, asc } from 'drizzle-orm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { dbSpan } from '@shoplite/shared';
import { products } from '@shoplite/database';

import { DatabaseService } from '@/core/database/database.service';

import type { Product } from '@/modules/products/products.schemas';

const PAISA_PER_TAKA = 100;

const PRODUCT_COLUMNS = {
  id: products.id,
  name: products.name,
  description: products.description,
  image_url: products.imageUrl,
  price: products.price,
  stock: products.stock
};

@Injectable()
export class ProductsService {
  constructor(private readonly database: DatabaseService) {}

  async list(): Promise<Product[]> {
    const rows = await dbSpan(
      'SELECT',
      'products',
      async () =>
        await this.database.db
          .select(PRODUCT_COLUMNS)
          .from(products)
          .orderBy(asc(products.id))
    );

    return rows.map(inBdt);
  }

  async findOne(id: number): Promise<Product> {
    const [product] = await dbSpan(
      'SELECT',
      'products',
      async () =>
        await this.database.db
          .select(PRODUCT_COLUMNS)
          .from(products)
          .where(eq(products.id, id))
    );

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return inBdt(product);
  }
}

function inBdt(product: Product): Product {
  return { ...product, price: product.price / PAISA_PER_TAKA };
}
