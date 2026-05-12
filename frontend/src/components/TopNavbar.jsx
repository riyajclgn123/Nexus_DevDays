/**
 * TopNavbar.jsx
 *
 * Horizontal top navigation bar used by all three dashboards.
 * Replaces the vertical sidebar.
 *
 * Features:
 *   - EduPulse logo (top left, links to dashboard)
 *   - Horizontal nav links with active state
 *   - Role badge
 *   - Dark/light mode toggle
 *   - DB live indicator
 *   - Profile avatar → opens ProfileModal
 *   - Responsive: collapses nav on smaller screens
 *
 * Props:
 *   navItems   → array of { key, label, icon }
 *   active     → current active key
 *   setActive  → setter
 *   roleConfig → { label, accentBg, accentText, activeBg, activeText }
 */

import { useState } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'
import Logo from './Logo'
import ProfileModal from './ProfileModal'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function TopNavbar({ navItems, active, setActive, roleConfig }) {
  const { isDark, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  // Theme-aware classes
  const navBg     = isDark ? 'bg-navy-2/95 border-white/8'  : 'bg-white/95 border-navy/10'
  const text      = isDark ? 'text-white'                    : 'text-navy'
  const muted     = isDark ? 'text-slate-brand'              : 'text-navy/50'
  const hoverBg   = isDark ? 'hover:bg-white/8'              : 'hover:bg-navy/5'
  const mobileBg  = isDark ? 'bg-navy-2 border-white/8'      : 'bg-white border-navy/10'

  return (
    <>
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-md ${navBg}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-center gap-4 px-6 h-14">

          {/* Logo */}
          <Logo size="sm" />

          {/* Divider */}
          <div className={`w-px h-5 flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-navy/10'}`} />

          {/* Role badge */}
          <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${roleConfig.badgeBg} ${roleConfig.badgeText}`}>
            {roleConfig.label}
          </span>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(item => {
              const Icon    = item.icon
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
                    ${isActive
                      ? `${roleConfig.activeBg} ${roleConfig.activeText}`
                      : `${muted} ${hoverBg} hover:${text}`
                    }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {item.label}
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* DB live badge */}
            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono border ${isDark ? 'bg-teal/8 border-teal/15 text-teal-3' : 'bg-teal-4 border-teal/20 text-teal'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-2 animate-pulse" />
              Live DB
            </span>

            {/* FY badge */}
            <span className={`hidden sm:inline-flex font-mono text-[10px] border rounded-md px-2 py-1 ${isDark ? 'text-slate-brand border-white/10' : 'text-navy/40 border-navy/10'}`}>
              FY 2025–26
            </span>

            {/* Dark/light toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all cursor-pointer ${isDark ? 'text-slate-brand hover:text-white hover:bg-white/8' : 'text-navy/40 hover:text-navy hover:bg-navy/8'}`}
              aria-label="Toggle dark/light mode"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Profile avatar */}
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 cursor-pointer group"
              aria-label="Open profile"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all group-hover:ring-2 ring-offset-1
                ${isDark ? 'ring-offset-navy-2' : 'ring-offset-white'} ${roleConfig.avatarRing}`}
                style={{ background: 'linear-gradient(135deg, #0D7377, #14A6AC)' }}>
                {initials}
              </div>
              <span className={`hidden sm:block text-sm font-medium ${text} group-hover:text-teal-2 transition-colors`}>
                {user?.name?.split(' ')[0]}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className={`md:hidden p-2 rounded-lg cursor-pointer ${muted} ${hoverBg}`}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className={`md:hidden border-t px-4 py-3 space-y-1 ${mobileBg}`}>
            {navItems.map(item => {
              const Icon    = item.icon
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => { setActive(item.key); setMobileOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                    ${isActive ? `${roleConfig.activeBg} ${roleConfig.activeText}` : `${muted} ${hoverBg}`}`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>
        )}
      </nav>

      {/* Profile modal */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
