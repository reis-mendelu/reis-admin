import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'mendelu-dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'mendelu-dark' ? 'mendelu' : 'mendelu-dark'));
  };

  return (
    <button 
      className="btn btn-ghost btn-circle" 
      onClick={toggleTheme} 
      title="Přepnout téma"
    >
      {theme === 'mendelu-dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
