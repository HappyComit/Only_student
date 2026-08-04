import React, { createContext, useContext, useMemo, useState } from 'react';

type AppModeContextValue = {
  isFreelancerMode: boolean;
  setIsFreelancerMode: (value: boolean) => void;
};

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

export function AppModeProvider({ children, initialMode = true }: { children: React.ReactNode; initialMode?: boolean }) {
  const [isFreelancerMode, setIsFreelancerMode] = useState(initialMode);

  const value = useMemo(
    () => ({ isFreelancerMode, setIsFreelancerMode }),
    [isFreelancerMode],
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}


export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within AppModeProvider');
  }
  return context;
}
