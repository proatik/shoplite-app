import { Module } from '@nestjs/common';

import { OrdersService } from '@/modules/orders/orders.service';
import { ProductsModule } from '@/modules/products/products.module';
import { OrdersController } from '@/modules/orders/orders.controller';

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
