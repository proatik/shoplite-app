import { navigate } from '@/lib/navigation';

export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export const DEFAULT_PAGE_SIZE = 12;

export type PageParams = {
  page: number;
  pageSize: number;
};

export function parsePageParams(params: URLSearchParams): PageParams {
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('size'));

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: PAGE_SIZE_OPTIONS.some((size) => size === pageSize)
      ? pageSize
      : DEFAULT_PAGE_SIZE
  };
}

export function toPageQuery({ page, pageSize }: PageParams): string {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set('page', String(page));
  }

  if (pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('size', String(pageSize));
  }

  const query = params.toString();

  return query ? `?${query}` : '';
}

export function pageCountOf(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function pageItems(page: number, pageCount: number): (number | 'gap')[] {
  const pages = [1, page - 1, page, page + 1, pageCount]
    .filter(
      (value, index, list) =>
        value >= 1 && value <= pageCount && list.indexOf(value) === index
    )
    .sort((a, b) => a - b);

  return pages.flatMap((value, index) => {
    const previous = pages[index - 1];

    return previous !== undefined && value - previous > 1
      ? ['gap' as const, value]
      : [value];
  });
}

export function showPage(path: string, params: PageParams) {
  navigate(`${path}${toPageQuery(params)}`);
}
