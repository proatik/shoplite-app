// k6 load test: a shop-like mix of product pages, catalogue views and orders at a steady rate.
//
//   BASE_URL  where the shop answers, e.g. http://localhost:8080 or http://<alb> (required)
//   RATE      requests per second across the whole mix (default 25, above the brief's 20)
//   DURATION  how long to keep the rate, e.g. 15m (default 15m)
//
// Orders stay near 2 per second, so the 3171 units of seeded stock last a 15-minute run.
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL;
const RATE = Number(__ENV.RATE || 25);
const DURATION = __ENV.DURATION || '15m';

if (!BASE_URL) {
  throw new Error('set BASE_URL, for example http://localhost:8080');
}

const SHARE = { productPage: 0.6, catalogue: 0.32, order: 0.08 };
const JSON_HEADERS = { 'Content-Type': 'application/json' };

function steady(exec, share) {
  return {
    executor: 'constant-arrival-rate',
    exec,
    rate: Math.max(1, Math.round(RATE * share)),
    timeUnit: '1s',
    duration: DURATION,
    preAllocatedVUs: 20,
    maxVUs: 200
  };
}

export const options = {
  scenarios: {
    product_page: steady('productPage', SHARE.productPage),
    catalogue: steady('catalogue', SHARE.catalogue),
    order: steady('order', SHARE.order)
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'max']
};

export function setup() {
  const response = http.get(`${BASE_URL}/api/products`);

  if (response.status !== 200) {
    throw new Error(`GET /api/products answered ${response.status}`);
  }

  return { ids: response.json().map((product) => product.id) };
}

function pick(ids) {
  return ids[Math.floor(Math.random() * ids.length)];
}

export function productPage(data) {
  const response = http.get(`${BASE_URL}/api/products/${pick(data.ids)}`, {
    tags: { name: 'GET /products/{id}' }
  });

  check(response, { 'product 200': (r) => r.status === 200 });
}

export function catalogue() {
  const response = http.get(`${BASE_URL}/api/products`, {
    tags: { name: 'GET /products' }
  });

  check(response, { 'catalogue 200': (r) => r.status === 200 });
}

export function order(data) {
  const body = JSON.stringify({ product_id: pick(data.ids), quantity: 1 });
  const response = http.post(`${BASE_URL}/api/orders`, body, {
    headers: JSON_HEADERS,
    tags: { name: 'POST /orders' }
  });

  // 409 is a correct answer once a product sells out; anything else is a failure.
  check(response, {
    'order 201, or 409 when sold out': (r) =>
      r.status === 201 || r.status === 409
  });
}
