import request from 'supertest';
import { NotFoundException } from '@nestjs/common';
import { it, vi, expect, describe, afterAll, beforeAll } from 'vitest';

import { ChaosService } from '@/core/chaos/chaos.service';
import { createTestApp } from '@/testing/test-app.spec-helper';
import { ProductsService } from '@/modules/products/products.service';
import { ProductsController } from '@/modules/products/products.controller';

import type { NestExpressApplication } from '@nestjs/platform-express';

const TEA_SET = {
  id: 1,
  name: 'Clay Terracotta Tea Set',
  description: 'Six cups and a pot thrown by potters in Dhamrai.',
  image_url: null,
  price: 980,
  stock: 40
};

const products = {
  list: vi.fn().mockResolvedValue([TEA_SET]),
  findOne: vi.fn((id: number) =>
    id === TEA_SET.id
      ? Promise.resolve(TEA_SET)
      : Promise.reject(new NotFoundException('Product not found.'))
  )
};

const chaos = { maybeDelay: vi.fn().mockResolvedValue(undefined) };

describe('ProductsController', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp(ProductsController, [
      { provide: ProductsService, useValue: products },
      { provide: ChaosService, useValue: chaos }
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products returns every product', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(response.body).toEqual([TEA_SET]);
  });

  it('GET /products/:id returns one product', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/1')
      .expect(200);

    expect(response.body).toEqual(TEA_SET);
    expect(chaos.maybeDelay).toHaveBeenCalled();
  });

  it('GET /products/:id answers 404 for an unknown product', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/999')
      .expect(404);

    expect(response.body.message).toBe('Product not found.');
  });

  it('GET /products/:id answers 400 for an id that is not a number', async () => {
    await request(app.getHttpServer()).get('/products/abc').expect(400);
  });

  it('GET /products/:id answers 400 for an id beyond the integer column', async () => {
    await request(app.getHttpServer()).get('/products/3000000000').expect(400);
  });
});
