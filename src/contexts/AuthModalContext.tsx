import React, { createContext, useContext } from 'react';

interface AuthModalContextType {
  setShowLoginModal: (show: boolean) => void;
}

export const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
};

interface AuthModalProviderProps {
  setShowLoginModal: (show: boolean) => void;
  children: React.ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ setShowLoginModal, children }) => {
  return (
    <AuthModalContext.Provider value={{ setShowLoginModal }}>
      {children}
    </AuthModalContext.Provider>
  );
};
