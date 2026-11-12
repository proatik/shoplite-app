import { Get, Param, Controller, SerializeOptions } from '@nestjs/common';

import { ChaosService } from '@/core/chaos/chaos.service';
import { ProductsService } from '@/modules/products/products.service';
import {
  ProductSchema,
  ProductParamsSchema
} from '@/modules/products/products.schemas';

import type {
  Product,
  ProductParams
} from '@/modules/products/products.schemas';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly chaos: ChaosService,
    private readonly products: ProductsService
  ) {}

  // the serializer checks arrays item by item, so it takes the item schema.
  @Get()
  @SerializeOptions({ schema: ProductSchema })
  async list(): Promise<Product[]> {
    return await this.products.list();
  }

  @Get(':id')
  @SerializeOptions({ schema: ProductSchema })
  async findOne(
    @Param({ schema: ProductParamsSchema }) params: ProductParams
  ): Promise<Product> {
    await this.chaos.maybeDelay();

    return await this.products.findOne(params.id);
  }
}
