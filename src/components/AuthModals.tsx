import React, { useState } from 'react';
import { LoginModal } from '@/components/common/LoginModal';
import { RegisterModal } from '@/components/RegisterModal';
import { AuthModalContext } from '@/contexts/AuthModalContext';

interface AuthModalsProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  onRegisterSuccess?: (email?: string) => void;
}

const AuthModals: React.FC<AuthModalsProps> = ({
  open,
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
}) => {
  const [showLoginModal, setShowLoginModal] = React.useState(open);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Provide setShowLoginModal to context for global usage
  React.useEffect(() => {
    window.__setShowLoginModal = setShowLoginModal;
  }, [setShowLoginModal]);

  // Handle register success (e.g., redirect to verify email)
  const handleRegisterSuccess = (email: string) => {
    setShowRegisterModal(false);
    sessionStorage.setItem('registerEmail', email);
    if (onRegisterSuccess) onRegisterSuccess(email);
    if (onClose) onClose();
  };

  return (
    <AuthModalContext.Provider value={{ setShowLoginModal }}>
      <LoginModal
        open={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          if (onClose) onClose();
        }}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          if (onLoginSuccess) onLoginSuccess();
          if (onClose) onClose();
        }}
        onRegisterRedirect={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterModal
        open={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          if (onClose) onClose();
        }}
        onRegisterSuccess={handleRegisterSuccess}
        onLoginRedirect={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </AuthModalContext.Provider>
  );
};

export default AuthModals;
