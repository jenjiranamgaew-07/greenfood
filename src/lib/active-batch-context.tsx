import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type ActiveBatchContextType = {
  activeBatchId: number | null;
  setActiveBatchId: (id: number | null) => void;
};

const ActiveBatchContext = createContext<ActiveBatchContextType | undefined>(undefined);

export function ActiveBatchProvider({ children }: { children: ReactNode }) {
  const [activeBatchId, setActiveBatchId] = useState<number | null>(() => {
    const saved = localStorage.getItem('haccp_active_batch_id');
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    if (activeBatchId !== null) {
      localStorage.setItem('haccp_active_batch_id', activeBatchId.toString());
    } else {
      localStorage.removeItem('haccp_active_batch_id');
    }
  }, [activeBatchId]);

  return (
    <ActiveBatchContext.Provider value={{ activeBatchId, setActiveBatchId }}>
      {children}
    </ActiveBatchContext.Provider>
  );
}

export function useActiveBatch() {
  const context = useContext(ActiveBatchContext);
  if (context === undefined) {
    throw new Error('useActiveBatch must be used within an ActiveBatchProvider');
  }
  return context;
}
