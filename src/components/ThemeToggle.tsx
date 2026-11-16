'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Ждем монтирования на клиенте, чтобы избежать ошибки гидратации
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Показываем заглушку (или ничего), пока не узнали тему
    return <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
        }`}
      >
        <Sun className="w-4 h-4" /> Светлая
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
        }`}
      >
        <Moon className="w-4 h-4" /> Темная
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
        }`}
      >
        <Monitor className="w-4 h-4" /> Системная
      </button>
    </div>
  );
}
