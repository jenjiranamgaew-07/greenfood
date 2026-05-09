export function useGetBatch() {
  return {
    data: {
      batch: {
        batchNumber: "GF-001",
        operatorName: "Operator",
      },
      product: {
        productName: "Demo Product",
      },
    },
    isLoading: false,
  };
}

export function useCreateCheck() {
  return {
    mutateAsync: async () => ({}),
    isPending: false,
  };
}

export function useCreateBatch() {
  return {
    mutateAsync: async () => ({ id: 1 }),
    isPending: false,
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

export function useGetBatchQueryKey() {
  return [];
}

export function getGetBatchQueryKey() {
  return [];
}

export function getListChecksQueryKey() {
  return [];
}

export function getListBatchesQueryKey() {
  return [];
}

export function getListDeviationsQueryKey() {
  return [];
}

export function useCreateDeviation() {
  return {
    mutateAsync: async () => ({}),
  };
}
