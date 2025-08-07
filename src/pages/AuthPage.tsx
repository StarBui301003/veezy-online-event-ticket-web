import AuthModals from '@/components/AuthModals';
// Add global type for window.__setShowLoginModal
declare global {
  interface Window {
    __setShowLoginModal?: (show: boolean) => void;
  }
}


const AuthPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Auth Demo</h1>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all mb-4"
        onClick={() => window.__setShowLoginModal?.(true)}
      >
        Open Login Modal
      </button>
      <AuthModals />
    </div>
  );
};

export default AuthPage;
