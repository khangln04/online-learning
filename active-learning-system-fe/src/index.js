import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import console suppressor to clean up development logs
import './utils/console-suppressor';

// Global error handler to suppress SignalR connection errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && 
      event.error.message.includes('Invocation canceled due to the underlying connection being closed')) {
    event.preventDefault();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('Invocation canceled due to the underlying connection being closed')) {
    event.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
