import request from 'supertest';
import {
  it,
  vi,
  expect,
  describe,
  afterAll,
  beforeAll,
  beforeEach
} from 'vitest';
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';

import { ChaosService } from '@/core/chaos/chaos.service';
import { createTestApp } from '@/testing/test-app.spec-helper';
import { OrdersService } from '@/modules/orders/orders.service';
import { OrdersController } from '@/modules/orders/orders.controller';

import type { NestExpressApplication } from '@nestjs/platform-express';

const orders = {
  create: vi.fn(),
  findOne: vi.fn()
};

const chaos = { maybeFail: vi.fn() };

describe('OrdersController', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp(OrdersController, [
      { provide: OrdersService, useValue: orders },
      { provide: ChaosService, useValue: chaos }
    ]);
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /orders answers 201 with the new PENDING order', async () => {
    orders.create.mockResolvedValue({ id: 42, status: 'PENDING' });

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({ product_id: 1, quantity: 2 })
      .expect(201);

    expect(response.body).toEqual({ id: 42, status: 'PENDING' });
    expect(orders.create).toHaveBeenCalledWith({ product_id: 1, quantity: 2 });
  });

  it('POST /orders answers 400 for a quantity below one', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ product_id: 1, quantity: 0 })
      .expect(400);

    expect(orders.create).not.toHaveBeenCalled();
  });

  it('POST /orders answers 400 without a product_id', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ quantity: 2 })
      .expect(400);
  });

  it('POST /orders answers 400 for a product_id beyond the integer column', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ product_id: 3000000000, quantity: 1 })
      .expect(400);

    expect(orders.create).not.toHaveBeenCalled();
  });

  it('POST /orders answers 409 when the stock is too low', async () => {
    orders.create.mockRejectedValue(
      new ConflictException('Not enough stock for this product.')
    );

    await request(app.getHttpServer())
      .post('/orders')
      .send({ product_id: 1, quantity: 99 })
      .expect(409);
  });

  it('POST /orders answers 500 when CHAOS_ERROR_RATE fails the request', async () => {
    chaos.maybeFail.mockImplementation(() => {
      throw new InternalServerErrorException();
    });

    await request(app.getHttpServer())
      .post('/orders')
      .send({ product_id: 1, quantity: 2 })
      .expect(500);

    expect(orders.create).not.toHaveBeenCalled();
  });

  it('GET /orders/:id returns the order status', async () => {
    orders.findOne.mockResolvedValue({
      id: 42,
      product_id: 1,
      quantity: 2,
      status: 'COMPLETED',
      created_at: new Date('2026-11-11T10:00:00Z'),
      completed_at: new Date('2026-11-11T10:00:02Z')
    });

    const response = await request(app.getHttpServer())
      .get('/orders/42')
      .expect(200);

    expect(response.body).toMatchObject({ id: 42, status: 'COMPLETED' });
  });

  it('GET /orders/:id answers 404 for an unknown order', async () => {
    orders.findOne.mockRejectedValue(new NotFoundException('Order not found.'));

    await request(app.getHttpServer()).get('/orders/7').expect(404);
  });

  it('GET /orders/:id answers 400 for an id beyond the integer column', async () => {
    await request(app.getHttpServer()).get('/orders/3000000000').expect(400);

    expect(orders.findOne).not.toHaveBeenCalled();
  });
});
