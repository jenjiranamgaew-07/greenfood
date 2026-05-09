export function useGetBatch() {
  return {
    data: null,
    isLoading: false,
  };
}

export function useCreateDeviation() {
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
