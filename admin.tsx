import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("找不到 root 节点，请检查 admin.html");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
