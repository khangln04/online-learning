// Global console suppressor for production-like experience
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

// Suppressed methods that do nothing
const suppressedMethods = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {}
};

// Function to suppress all console output
export const suppressConsole = () => {
  Object.keys(suppressedMethods).forEach(method => {
    console[method] = suppressedMethods[method];
  });
};

// Function to restore original console methods
export const restoreConsole = () => {
  Object.keys(originalConsole).forEach(method => {
    console[method] = originalConsole[method];
  });
};

// Auto-suppress on load
suppressConsole();
