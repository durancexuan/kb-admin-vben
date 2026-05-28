export function useResponseSuccess<T>(data: T) {
  return {
    code: 0,
    data,
    error: null,
    message: 'ok',
  };
}

export function usePageResponseSuccess<T>(
  page: number,
  pageSize: number,
  list: T[],
) {
  const offset = (page - 1) * pageSize;
  const items =
    offset + pageSize >= list.length
      ? list.slice(offset)
      : list.slice(offset, offset + pageSize);

  return useResponseSuccess({
    items,
    total: list.length,
  });
}

export function useResponseError(message: string, error: unknown = null) {
  return {
    code: -1,
    data: null,
    error,
    message,
  };
}
