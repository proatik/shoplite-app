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
