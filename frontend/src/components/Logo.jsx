/**
 * Logo.jsx
 *
 * Louisiana EduPulse logo mark + wordmark.
 * Clicking navigates to the user's dashboard.
 * Adapts to dark/light mode automatically.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Logo({ size = 'md' }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate   = useNavigate()

  function handleClick() {
    if (user?.role) navigate(`/dashboard/${user.role}`)
    else navigate('/auth')
  }

  const sizes = {
    sm: { icon: 28, text: 'text-sm',  sub: 'text-[9px]'  },
    md: { icon: 34, text: 'text-base',sub: 'text-[10px]' },
    lg: { icon: 42, text: 'text-lg',  sub: 'text-xs'     },
  }
  const s = sizes[size] ?? sizes.md

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2.5 group cursor-pointer select-none"
      aria-label="Louisiana EduPulse — Go to dashboard"
    >
      {/* Icon mark */}
      <div
        className="relative flex-shrink-0 rounded-xl flex items-center justify-center"
        style={{ width: s.icon, height: s.icon, background: 'linear-gradient(135deg, #0D7377 0%, #14A6AC 100%)' }}
      >
        {/* LA letters */}
        <span className="font-mono font-bold text-white" style={{ fontSize: s.icon * 0.38 }}>EP</span>
        {/* Gold accent dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold border-2"
          style={{ borderColor: isDark ? '#0B1628' : '#ffffff' }} />
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className={`font-display font-bold leading-tight ${s.text} ${isDark ? 'text-white' : 'text-navy'} group-hover:text-teal-2 transition-colors`}>
          Edu<span className="text-gold">Pulse</span>
        </span>
        <span className={`font-mono tracking-widest uppercase ${s.sub} ${isDark ? 'text-slate-brand' : 'text-navy/40'}`}>
          Louisiana
        </span>
      </div>
    </button>
  )
}
