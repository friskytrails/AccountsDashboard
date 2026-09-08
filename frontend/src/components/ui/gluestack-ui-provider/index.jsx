import React, { createContext, useContext, useState, useEffect } from 'react';

const GluestackUIContext = createContext({
  colorMode: 'dark',
  toggleColorMode: () => {},
});

export const useGluestackUI = () => useContext(GluestackUIContext);

export const GluestackUIProvider = ({
  colorMode: initialMode = 'dark',
  children,
  className = '',
  ...props
}) => {
  const [colorMode, setColorMode] = useState(initialMode);

  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <GluestackUIContext.Provider value={{ colorMode, toggleColorMode }}>
      <div
        className={`min-h-screen bg-background text-foreground antialiased ${className}`.trim()}
        data-theme={colorMode}
        {...props}
      >
        {children}
      </div>
    </GluestackUIContext.Provider>
  );
};
