import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const Root = () => {
  // Determine initial view based on URL
  const getInitialView = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const isPathAdmin = window.location.pathname.endsWith('admin.html') || window.location.pathname.endsWith('/admin');
        const isQueryAdmin = params.get('app') === 'admin';
        return (isPathAdmin || isQueryAdmin) ? 'admin' : 'app';
    } catch (e) {
        return 'app';
    }
  };

  const [view, setView] = useState<'app' | 'admin'>(getInitialView);

  useEffect(() => {
    // Listen for custom navigation events from the app components
    const handleRouteChange = (event: CustomEvent) => {
      const targetView = event.detail?.view;
      if (targetView === 'admin' || targetView === 'app') {
        // Try to update URL to match state (optional, but good for bookmarking)
        // Wrapped in try-catch to prevent SecurityError in sandboxed/preview environments
        try {
            const newUrl = targetView === 'admin' 
              ? '?app=admin' 
              : window.location.pathname; // Clear query param for app
            
            window.history.pushState({}, '', newUrl);
        } catch (e) {
            console.log("Environment restricted URL updates. Switching view in-memory only.");
        }
        
        setView(targetView);
      }
    };

    // Listen for browser back/forward buttons
    const handlePopState = () => {
      setView(getInitialView());
    };

    window.addEventListener('lumina-route-change' as any, handleRouteChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('lumina-route-change' as any, handleRouteChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <React.StrictMode>
      {view === 'admin' ? <AdminApp /> : <App />}
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);