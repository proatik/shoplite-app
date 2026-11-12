import {
  Get,
  Body,
  Post,
  Param,
  Controller,
  SerializeOptions
} from '@nestjs/common';

import { ChaosService } from '@/core/chaos/chaos.service';
import { OrdersService } from '@/modules/orders/orders.service';
import {
  OrderSchema,
  CreateOrderSchema,
  OrderParamsSchema,
  CreatedOrderSchema
} from '@/modules/orders/orders.schemas';

import type {
  Order,
  CreateOrder,
  OrderParams,
  CreatedOrder
} from '@/modules/orders/orders.schemas';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly chaos: ChaosService,
    private readonly orders: OrdersService
  ) {}

  @Post()
  @SerializeOptions({ schema: CreatedOrderSchema })
  async create(
    @Body({ schema: CreateOrderSchema }) body: CreateOrder
  ): Promise<CreatedOrder> {
    this.chaos.maybeFail();

    return await this.orders.create(body);
  }

  @Get(':id')
  @SerializeOptions({ schema: OrderSchema })
  async findOne(
    @Param({ schema: OrderParamsSchema }) params: OrderParams
  ): Promise<Order> {
    return await this.orders.findOne(params.id);
  }
}
