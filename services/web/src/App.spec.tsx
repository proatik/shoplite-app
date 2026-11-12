import userEvent from '@testing-library/user-event';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';

import { App } from '@/App';

const products = [
  {
    id: 1,
    name: 'Jute Tote Bag',
    description: 'Sturdy golden-jute tote with cotton handles.',
    image_url: 'https://images.unsplash.com/photo-1787074656306-67d69f3d8576',
    price: 450,
    stock: 40
  },
  {
    id: 2,
    name: 'Brass Pitcher',
    description: '',
    image_url: null,
    price: 2400,
    stock: 0
  }
];

const order = (status: string) => ({
  id: 42,
  product_id: 1,
  quantity: 2,
  status,
  created_at: '2026-11-12T10:00:00.000Z',
  completed_at: status === 'COMPLETED' ? '2026-11-12T10:00:05.000Z' : null
});

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(Response.json(body, { status }));
}

const isUrl = (url: unknown, expected: string) => String(url) === expected;

const fetchMock = vi.fn<typeof fetch>();

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

function currentUrl() {
  return `${window.location.pathname}${window.location.search}`;
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState(null, '', '/');
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  fetchMock.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('catalogue', () => {
  it('renders products with an image and a fallback tile', async () => {
    fetchMock.mockImplementation(() => jsonResponse(products));
    renderApp();

    expect(await screen.findByText('Jute Tote Bag')).toBeTruthy();
    expect(screen.getByText('450.00', { exact: false })).toBeTruthy();
    expect(screen.getByText('In stock')).toBeTruthy();
    expect(screen.getByText('Out of stock')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Jute Tote Bag' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Brass Pitcher' })).toBeNull();
    expect(screen.getByTitle('Jute Tote Bag').getAttribute('href')).toBe(
      '/products/1'
    );
  });
});

describe('catalogue pagination', () => {
  const many = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    name: `Product ${index + 1}`,
    description: '',
    image_url: null,
    price: 100,
    stock: 5
  }));

  it('moves with next, previous and page numbers', async () => {
    fetchMock.mockImplementation(() => jsonResponse(many));
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Product 1')).toBeTruthy();
    expect(screen.getByText('Product 12')).toBeTruthy();
    expect(screen.queryByText('Product 13')).toBeNull();
    expect(
      (screen.getByLabelText('Previous page') as HTMLButtonElement).disabled
    ).toBe(true);

    await user.click(screen.getByLabelText('Next page'));

    expect(await screen.findByText('Product 13')).toBeTruthy();
    expect(screen.queryByText('Product 1')).toBeNull();
    expect(currentUrl()).toBe('/?page=2');

    await user.click(screen.getByLabelText('Page 3'));

    expect(await screen.findByText('Product 30')).toBeTruthy();
    expect(screen.queryByText('Product 24')).toBeNull();
    expect(
      (screen.getByLabelText('Next page') as HTMLButtonElement).disabled
    ).toBe(true);

    await user.click(screen.getByLabelText('Previous page'));

    expect(await screen.findByText('Product 13')).toBeTruthy();
    expect(screen.queryByText('Product 30')).toBeNull();
  });

  it('changes the page size and returns to the first page', async () => {
    window.history.pushState(null, '', '/?page=2');
    fetchMock.mockImplementation(() => jsonResponse(many));
    const user = userEvent.setup();
    renderApp();

    await screen.findByText('Product 13');
    await user.click(screen.getByRole('combobox', { name: 'Rows per page' }));
    await user.click(
      await screen.findByRole('option', { name: '24 per page' })
    );

    expect(await screen.findByText('Product 24')).toBeTruthy();
    expect(screen.getByText('Product 1')).toBeTruthy();
    expect(screen.queryByText('Product 25')).toBeNull();
    expect(currentUrl()).toBe('/?size=24');
  });

  it('falls back to the last page when the page is out of range', async () => {
    window.history.pushState(null, '', '/?page=99');
    fetchMock.mockImplementation(() => jsonResponse(many));
    renderApp();

    expect(await screen.findByText('Product 30')).toBeTruthy();
    expect(screen.queryByText('Product 12')).toBeNull();
  });

  it('falls back to the first page for an invalid page and size', async () => {
    window.history.pushState(null, '', '/?page=abc&size=7');
    fetchMock.mockImplementation(() => jsonResponse(many));
    renderApp();

    expect(await screen.findByText('Product 1')).toBeTruthy();
    expect(screen.getByText('Product 12')).toBeTruthy();
    expect(screen.queryByText('Product 13')).toBeNull();
  });
});

describe('product page', () => {
  it('adds to the cart and updates the badge', async () => {
    window.history.pushState(null, '', '/products/1');
    fetchMock.mockImplementation(() => jsonResponse(products[0]));
    const user = userEvent.setup();
    renderApp();

    const quantity = await screen.findByLabelText('Quantity');
    await user.clear(quantity);
    await user.type(quantity, '2');
    await user.click(screen.getByText('Add to cart'));

    expect(screen.getByLabelText('Cart, 2 items')).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem('shoplite.cart')!)).toEqual([
      { productId: 1, quantity: 2 }
    ]);

    await user.click(screen.getByText('Add to cart'));

    expect(screen.getByLabelText('Cart, 4 items')).toBeTruthy();
  });

  it('shows the description for a product that has one', async () => {
    window.history.pushState(null, '', '/products/1');
    fetchMock.mockImplementation(() => jsonResponse(products[0]));
    renderApp();

    expect(
      await screen.findByText('Sturdy golden-jute tote with cotton handles.')
    ).toBeTruthy();
    expect(screen.queryByText('Read more')).toBeNull();
  });

  it('collapses the description block when it is empty', async () => {
    window.history.pushState(null, '', '/products/2');
    fetchMock.mockImplementation(() => jsonResponse(products[1]));
    renderApp();

    const title = await screen.findByRole('heading', {
      name: 'Brass Pitcher'
    });

    expect(title.nextElementSibling?.className).toContain('mt-auto');
  });

  it('clamps a long description and repeats it below', async () => {
    window.history.pushState(null, '', '/products/1');
    const description = 'Handwoven cotton. '.repeat(20).trim();
    fetchMock.mockImplementation(() =>
      jsonResponse({ ...products[0], description })
    );
    renderApp();

    expect(await screen.findByText('Read more')).toBeTruthy();
    expect(screen.getAllByText(description)).toHaveLength(2);
    expect(screen.getByText('About this product')).toBeTruthy();
  });

  it('shows not found only for a 404', async () => {
    window.history.pushState(null, '', '/products/9');
    fetchMock.mockImplementation(() =>
      jsonResponse(
        { statusCode: 404, message: 'Product not found.', error: 'Not Found' },
        404
      )
    );
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Product not found' })
    ).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: 'Product unavailable' })
    ).toBeNull();
  });

  it('shows unavailable with a retry for other errors', async () => {
    window.history.pushState(null, '', '/products/1');
    fetchMock
      .mockImplementationOnce(() =>
        jsonResponse({ statusCode: 503, message: 'Service down.' }, 503)
      )
      .mockImplementationOnce(() => jsonResponse(products[0]));
    const user = userEvent.setup();
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Product unavailable' })
    ).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: 'Product not found' })
    ).toBeNull();

    await user.click(screen.getByText('Try again'));

    expect(await screen.findByText('Add to cart')).toBeTruthy();
  });
});

const cartLine = (productId: number, quantity: number) => ({
  productId,
  quantity
});

function seedCart(...lines: ReturnType<typeof cartLine>[]) {
  window.localStorage.setItem('shoplite.cart', JSON.stringify(lines));
}

function storedOrderIds(): number[] {
  const stored: { id: number }[] = JSON.parse(
    window.localStorage.getItem('shoplite.orders') ?? '[]'
  );

  return stored.map((entry) => entry.id);
}

const twoProducts = [
  products[0]!,
  {
    id: 3,
    name: 'Clay Pot',
    description: '',
    image_url: null,
    price: 100,
    stock: 5
  }
];

function failure(status: number, message: string) {
  return jsonResponse({ statusCode: status, message, error: 'Error' }, status);
}

describe('cart', () => {
  it('shows lines with the total', async () => {
    window.history.pushState(null, '', '/cart');
    seedCart(cartLine(1, 2), cartLine(3, 1));
    fetchMock.mockImplementation(() => jsonResponse(twoProducts));
    renderApp();

    expect(await screen.findByText('Jute Tote Bag')).toBeTruthy();
    expect(screen.getByText('BDT 900.00')).toBeTruthy();
    expect(screen.getAllByText('BDT 1,000.00').length).toBeGreaterThan(0);
    expect(screen.getByText('(3 items)')).toBeTruthy();
    expect(screen.getByText('Place order')).toBeTruthy();
  });

  it('changes quantity and removes a line', async () => {
    window.history.pushState(null, '', '/cart');
    seedCart(cartLine(1, 2), cartLine(3, 1));
    fetchMock.mockImplementation(() => jsonResponse(twoProducts));
    const user = userEvent.setup();
    renderApp();

    await user.click(
      await screen.findByLabelText('Increase quantity of jute tote bag')
    );

    expect(await screen.findByText('(4 items)')).toBeTruthy();

    await user.click(screen.getByLabelText('Remove Clay Pot'));

    expect(screen.queryByText('Clay Pot')).toBeNull();
    expect(JSON.parse(window.localStorage.getItem('shoplite.cart')!)).toEqual([
      { productId: 1, quantity: 3 }
    ]);
  });

  it('flags a line that is not available and blocks placing', async () => {
    window.history.pushState(null, '', '/cart');
    seedCart(cartLine(2, 1));
    fetchMock.mockImplementation(() => jsonResponse(products));
    renderApp();

    expect(
      await screen.findByText('Not enough stock for this quantity.')
    ).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain(
      'One item needs your attention'
    );
    expect(
      (screen.getByText('Place order') as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('shows the empty state without calling the API', () => {
    window.history.pushState(null, '', '/cart');
    renderApp();

    expect(screen.getByText('Your cart is empty')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('placing an order from the cart', () => {
  it('sends one order per line and lists both on the placed page', async () => {
    window.history.pushState(null, '', '/cart');
    seedCart(cartLine(1, 2), cartLine(3, 1));
    let nextId = 41;
    fetchMock.mockImplementation((input, init) => {
      if (init?.method === 'POST') {
        nextId += 1;
        return jsonResponse({ id: nextId, status: 'PENDING' }, 201);
      }
      if (isUrl(input, '/api/orders/42')) {
        return jsonResponse(order('PENDING'));
      }
      if (isUrl(input, '/api/orders/43')) {
        return jsonResponse({
          ...order('PENDING'),
          id: 43,
          product_id: 3,
          quantity: 1
        });
      }
      return jsonResponse(twoProducts);
    });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByText('Place order'));

    expect(await screen.findByText('Order Placed')).toBeTruthy();
    const posts = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === 'POST'
    );
    expect(posts.map(([, init]) => init?.body)).toEqual([
      JSON.stringify({ product_id: 1, quantity: 2 }),
      JSON.stringify({ product_id: 3, quantity: 1 })
    ]);
    expect(currentUrl()).toBe('/placed?ids=42,43');
    expect(await screen.findByText('#42, #43')).toBeTruthy();
    expect(await screen.findByText('Clay Pot')).toBeTruthy();
    expect(screen.getByText('Jute Tote Bag')).toBeTruthy();
    expect(window.localStorage.getItem('shoplite.cart')).toBe('[]');
    expect(storedOrderIds()).toEqual([43, 42]);
  });

  it('keeps a failed line in the cart and toasts the API message', async () => {
    window.history.pushState(null, '', '/cart');
    seedCart(cartLine(1, 2), cartLine(3, 1));
    fetchMock.mockImplementation((_input, init) => {
      if (init?.method !== 'POST') {
        return jsonResponse(twoProducts);
      }
      return typeof init.body === 'string' &&
        init.body.includes('"product_id":1')
        ? jsonResponse({ id: 42, status: 'PENDING' }, 201)
        : failure(409, 'Not enough stock for this product.');
    });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByText('Place order'));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Clay Pot: Not enough stock for this product.'
    );
    expect(currentUrl()).toBe('/cart');
    expect(JSON.parse(window.localStorage.getItem('shoplite.cart')!)).toEqual([
      { productId: 3, quantity: 1 }
    ]);
    expect(storedOrderIds()).toEqual([42]);
  });
});

describe('footer', () => {
  it('shows one line of text and the shop links', () => {
    fetchMock.mockImplementation(() => jsonResponse(products));
    renderApp();

    const footer = screen.getByRole('contentinfo');
    const year = new Date().getFullYear();

    expect(footer.textContent).toContain(
      `ShopLite · Handmade goods from across Bangladesh · © ${year} ShopLite`
    );
    expect(footer.textContent).not.toContain('BDT');
    expect(
      Array.from(footer.querySelectorAll('a')).map((link) => link.textContent)
    ).toEqual(['Catalogue', 'Cart', 'My orders']);
  });
});
