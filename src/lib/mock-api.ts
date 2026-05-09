export function useGetBatch() {
  return {
    data: null,
    isLoading: false,
  };
}

export function useListProducts() {
  return {
    data: [],
    isLoading: false,
  };
}

export function useListUsers() {
  return {
    data: [],
    isLoading: false,
  };
}

export function useCreateBatch() {
  return {
    mutateAsync: async () => ({ id: 1 }),
    isPending: false,
  };
}

export function useCreateDeviation() {
  return {
    mutateAsync: async () => ({}),
    isPending: false,
  };
}

export function useCreateCheck() {
  return {
    mutateAsync: async () => ({}),
    isPending: false,
  };
}

export function useCreateYieldReport() {
  return {
    mutateAsync: async () => ({}),
    isPending: false,
  };
}

export function useUpdateBatch() {
  return {
    mutateAsync: async () => ({}),
    isPending: false,
  };
}

export function getGetBatchQueryKey() {
  return ["batch"];
}

export function getListDeviationsQueryKey() {
  return ["deviations"];
}

export function getListBatchesQueryKey() {
  return ["batches"];
}

export function getListChecksQueryKey() {
  return ["checks"];
}
