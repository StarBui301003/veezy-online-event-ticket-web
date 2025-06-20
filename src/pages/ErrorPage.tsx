import { useNavigate } from 'react-router-dom';

export const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-6xl font-bold tracking-tight text-foreground sm:text-7xl">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Oops, it looks like the page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center rounded-[4px] bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-medium text-primary-foreground shadow-sm transition-colors focus:outline-none"
            onClick={() => {
              const accStr = localStorage.getItem('account');
              if (!accStr) {
                navigate('/');
                return;
              }
              try {
                const accObj = JSON.parse(accStr);
                if (accObj.role === 0) {
                  navigate('/admin');
                } else if (accObj.role === 1) {
                  navigate('/');
                }
                // } else if { accObj.role === 2 } {
                //   navigate('/event-manager');
                // }
                // else{
                //   navigate('/');
                // }
              } catch {
                navigate('/');
              }
            }}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
