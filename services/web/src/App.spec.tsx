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

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(Response.json(body, { status }));
}

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
