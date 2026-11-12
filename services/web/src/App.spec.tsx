import userEvent from '@testing-library/user-event';
import { act, render, screen, cleanup } from '@testing-library/react';
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

function storedOrderIds(): number[] {
  const stored: { id: number }[] = JSON.parse(
    window.localStorage.getItem('shoplite.orders') ?? '[]'
  );

  return stored.map((entry) => entry.id);
}

function failure(status: number, message: string) {
  return jsonResponse({ statusCode: status, message, error: 'Error' }, status);
}

const isOrderRequest = (url: unknown) => String(url).startsWith('/api/orders');

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
  it('places an order and opens its status page', async () => {
    window.history.pushState(null, '', '/products/1');
    fetchMock.mockImplementation((input, init) => {
      if (init?.method === 'POST') {
        return jsonResponse({ id: 42, status: 'PENDING' }, 201);
      }
      return isOrderRequest(input)
        ? jsonResponse(order('PENDING'))
        : jsonResponse(products[0]);
    });
    const user = userEvent.setup();
    renderApp();

    const quantity = await screen.findByLabelText('Quantity');
    await user.clear(quantity);
    await user.type(quantity, '2');
    await user.click(screen.getByText('Place order'));

    expect(await screen.findByLabelText('Order progress')).toBeTruthy();
    const posts = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === 'POST'
    );
    expect(posts.map(([input, init]) => [input, init?.body])).toEqual([
      ['/api/orders', JSON.stringify({ product_id: 1, quantity: 2 })]
    ]);
    expect(currentUrl()).toBe('/orders/42');
    expect(storedOrderIds()).toEqual([42]);
  });

  it('shows the API message and stays when the order fails', async () => {
    window.history.pushState(null, '', '/products/1');
    fetchMock.mockImplementation((_input, init) =>
      init?.method === 'POST'
        ? failure(409, 'Not enough stock for this product.')
        : jsonResponse(products[0])
    );
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByText('Place order'));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Not enough stock for this product.'
    );
    expect(currentUrl()).toBe('/products/1');
    expect(storedOrderIds()).toEqual([]);
  });

  it('disables the button while the order is pending', async () => {
    window.history.pushState(null, '', '/products/1');
    fetchMock.mockImplementation((_input, init) =>
      init?.method === 'POST'
        ? new Promise<Response>(() => {})
        : jsonResponse(products[0])
    );
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByText('Place order'));

    const button = screen.getByText('Place order').closest('button')!;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('disables the button when the product is out of stock', async () => {
    window.history.pushState(null, '', '/products/2');
    fetchMock.mockImplementation(() => jsonResponse(products[1]));
    renderApp();

    const button = (await screen.findByText('Place order')).closest('button')!;
    expect(button.disabled).toBe(true);
    expect(
      screen.getByText("This product can't be ordered right now.", {
        exact: false
      })
    ).toBeTruthy();
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

    expect(await screen.findByText('Place order')).toBeTruthy();
  });
});

describe('order page', () => {
  it('polls every 2 seconds and stops at COMPLETED', async () => {
    window.history.pushState(null, '', '/orders/42');
    vi.useFakeTimers();
    const statuses = ['PENDING', 'PROCESSING', 'COMPLETED'];
    let polls = 0;
    fetchMock.mockImplementation((input) => {
      if (!isOrderRequest(input)) {
        return jsonResponse(products[0]);
      }
      const status = statuses[Math.min(polls, statuses.length - 1)]!;
      polls += 1;
      return jsonResponse(order(status));
    });
    renderApp();

    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toBe(
      'Pending'
    );
    await act(() => vi.advanceTimersByTimeAsync(2100));
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toBe(
      'Processing'
    );
    await act(() => vi.advanceTimersByTimeAsync(2100));
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);

    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(polls).toBe(3);
    expect(screen.getAllByText('BDT 900.00').length).toBeGreaterThan(0);
  });

  it('shows the failed state', async () => {
    window.history.pushState(null, '', '/orders/42');
    fetchMock.mockImplementation((input) =>
      isOrderRequest(input)
        ? jsonResponse(order('FAILED'))
        : jsonResponse(products[0])
    );
    renderApp();

    expect(await screen.findByText('Order failed')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
    expect(screen.queryByLabelText('Order progress')).toBeNull();
  });

  it('shows an error for an unknown order', async () => {
    window.history.pushState(null, '', '/orders/99');
    fetchMock.mockImplementation(() =>
      jsonResponse(
        { statusCode: 404, message: 'Order not found.', error: 'Not Found' },
        404
      )
    );
    renderApp();

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Order not found.'
    );
  });
});

describe('my orders', () => {
  it('lists stored ids with fetched statuses', async () => {
    window.history.pushState(null, '', '/orders');
    window.localStorage.setItem(
      'shoplite.orders',
      JSON.stringify([
        { id: 43, placedAt: '2026-11-12T11:00:00.000Z' },
        { id: 42, placedAt: '2026-11-12T10:00:00.000Z' }
      ])
    );
    fetchMock.mockImplementation((input) => {
      if (isUrl(input, '/api/orders/43')) {
        return jsonResponse({ ...order('COMPLETED'), id: 43 });
      }
      if (isUrl(input, '/api/orders/42')) {
        return jsonResponse(order('PENDING'));
      }
      return jsonResponse(products);
    });
    renderApp();

    expect(await screen.findByText('Completed')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(await screen.findAllByText('Jute Tote Bag')).toHaveLength(2);
    expect(screen.getAllByText('BDT 900.00')).toHaveLength(2);
    expect(screen.getByText('#42').getAttribute('href')).toBe('/orders/42');
    expect(screen.getAllByRole('row')[1]!.textContent).toContain('#43');
  });

  it('shows the empty state when nothing was placed', () => {
    window.history.pushState(null, '', '/orders');
    renderApp();

    expect(screen.getByText('No orders yet')).toBeTruthy();
  });
});

describe('browser storage', () => {
  it('still opens the order and tells the user when storage is blocked', async () => {
    window.history.pushState(null, '', '/products/1');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    fetchMock.mockImplementation((input, init) => {
      if (init?.method === 'POST') {
        return jsonResponse({ id: 42, status: 'PENDING' }, 201);
      }
      return isOrderRequest(input)
        ? jsonResponse(order('PENDING'))
        : jsonResponse(products[0]);
    });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByText('Place order'));

    expect((await screen.findByRole('alert')).textContent).toContain(
      "Your browser is blocking storage, so this order can't be added"
    );
    expect(currentUrl()).toBe('/orders/42');
  });

  it('resets a corrupt or invalid stored order list', () => {
    window.history.pushState(null, '', '/orders');
    window.localStorage.setItem('shoplite.orders', '{not json');
    renderApp();

    expect(screen.getByText('No orders yet')).toBeTruthy();
    expect(window.localStorage.getItem('shoplite.orders')).toBeNull();
    cleanup();

    window.localStorage.setItem('shoplite.orders', '[{"id":"x"}]');
    renderApp();

    expect(screen.getByText('No orders yet')).toBeTruthy();
    expect(window.localStorage.getItem('shoplite.orders')).toBeNull();
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
    ).toEqual(['Catalogue', 'My orders']);
  });
});
