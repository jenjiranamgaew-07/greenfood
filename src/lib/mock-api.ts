export const useGetBatch = () => ({
  data: {
    batch: {
      id: 1,
      batchNumber: "GF-001",
      product: "Greenfood",
      status: "Running",
    },
  },
  isLoading: false,
});

export const getGetBatchQueryKey = () => ["batch"];

export const useCreateCheck = () => ({
  mutate: () => {},
});

export const useCreateYieldReport = () => ({
  mutate: () => {},
});

export const useUpdateBatch = () => ({
  mutate: () => {},
});

export const getListBatchesQueryKey = () => ["batches"];

export const getListDeviationsQueryKey = () => ["deviations"];

export const useCreateDeviation = () => ({
  mutate: () => {},
});
