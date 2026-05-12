/**
 * ThemeContext.jsx
 *
 * Global dark/light mode toggle.
 * Persists preference to localStorage.
 * Adds/removes 'dark' class on <html> element
 * so all Tailwind dark: variants work automatically.
 *
 * Usage in any component:
 *   const { theme, toggleTheme, isDark } = useTheme()
 */

import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('edupulse_theme') || 'dark'
  })

  const isDark = theme === 'dark'

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('edupulse_theme', theme)
  }, [theme, isDark])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
