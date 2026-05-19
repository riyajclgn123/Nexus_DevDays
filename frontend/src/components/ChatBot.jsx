/**
 * ChatBot.jsx
 *
 * EduPulse AI — Gemini-powered chatbot floating on all dashboards.
 *
 * Features:
 *   - Role-aware (different suggestions for policymaker/funder/operator)
 *   - Sends conversation history so Gemini has memory within session
 *   - Shows sources cited by the AI
 *   - Typing indicator while waiting for response
 *   - Dark/light mode aware
 *   - Suggested questions before first message
 *   - Markdown-style formatting for AI responses
 *   - Floating button with unread badge
 */

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { sendChatMessage, getChatSuggestions } from '../services/api'
import {
  MessageCircle, X, Send, Sparkles,
  ChevronDown, Database, RefreshCw, Copy, Check
} from 'lucide-react'

// ─── Role config ──────────────────────────────────────────────────
const ROLE_CONFIG = {
  policymaker: {
    name:    'Policy Intelligence',
    tagline: 'Ask about parishes, SPS scores, gaps, and alerts',
    color:   'from-teal to-teal-2',
    badge:   'bg-teal/15 text-teal-2 border-teal/20',
  },
  funder: {
    name:    'Investment Intelligence',
    tagline: 'Ask about opportunities, impact scores, and ROI',
    color:   'from-[#8B6914] to-gold',
    badge:   'bg-gold/15 text-[#8B6914] border-gold/20',
  },
  operator: {
    name:    'Site Intelligence',
    tagline: 'Ask about expansion sites, demand, and forecasts',
    color:   'from-teal to-teal-3',
    badge:   'bg-teal/12 text-teal border-teal/15',
  },
}

// ─── Format AI response text ──────────────────────────────────────
// Converts **bold**, bullet points, and line breaks to JSX
function FormattedText({ text, isDark }) {
  const muted = isDark ? 'text-slate-brand' : 'text-navy/70'
  const bold  = isDark ? 'text-white'       : 'text-navy'

  const lines = text.split('\n').filter(l => l.trim())

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Bullet point
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          const content = line.replace(/^[-•]\s*/, '')
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-teal-2 flex-shrink-0 mt-0.5">•</span>
              <span className={`text-xs leading-relaxed ${muted}`}
                dangerouslySetInnerHTML={{ __html: formatInline(content, isDark) }} />
            </div>
          )
        }
        // Numbered list
        if (/^\d+\./.test(line.trim())) {
          const num     = line.match(/^(\d+)\./)?.[1]
          const content = line.replace(/^\d+\.\s*/, '')
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-teal-2 font-mono text-xs flex-shrink-0 w-4">{num}.</span>
              <span className={`text-xs leading-relaxed ${muted}`}
                dangerouslySetInnerHTML={{ __html: formatInline(content, isDark) }} />
            </div>
          )
        }
        // Heading (starts with **)
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className={`text-xs font-semibold ${bold} mt-2`}>{line.replace(/\*\*/g, '')}</p>
        }
        // Regular paragraph
        return (
          <p key={i} className={`text-xs leading-relaxed ${muted}`}
            dangerouslySetInnerHTML={{ __html: formatInline(line, isDark) }} />
        )
      })}
    </div>
  )
}

function formatInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-inherit font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="text-teal-2 bg-teal/10 px-1 rounded text-[10px]">$1</code>')
}

// ─── Single message bubble ────────────────────────────────────────
function MessageBubble({ msg, isDark }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  function handleCopy() {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-teal text-white text-xs leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col mb-4">
      {/* AI label */}
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal to-teal-2 flex items-center justify-center flex-shrink-0">
          <Sparkles size={10} className="text-white" />
        </div>
        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-brand' : 'text-navy/40'}`}>EduPulse AI</span>
      </div>

      {/* Bubble */}
      <div className={`max-w-[90%] px-3.5 py-3 rounded-2xl rounded-tl-sm border ${isDark ? 'bg-navy-3/60 border-white/8' : 'bg-white border-navy/8 shadow-sm'}`}>
        <FormattedText text={msg.content} isDark={isDark} />

        {/* Sources */}
        {msg.sources?.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t ${isDark ? 'border-white/8' : 'border-navy/8'}`}>
            <Database size={10} className={isDark ? 'text-slate-brand mt-0.5' : 'text-navy/30 mt-0.5'} />
            {msg.sources.map(s => (
              <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border ${isDark ? 'bg-teal/8 border-teal/15 text-teal-3' : 'bg-teal-4 border-teal/15 text-teal'}`}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Copy button */}
        <button onClick={handleCopy}
          className={`flex items-center gap-1 mt-2 text-[10px] transition-colors cursor-pointer ${isDark ? 'text-slate-brand/50 hover:text-slate-brand' : 'text-navy/20 hover:text-navy/40'}`}>
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────
function TypingIndicator({ isDark }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal to-teal-2 flex items-center justify-center flex-shrink-0">
        <Sparkles size={10} className="text-white" />
      </div>
      <div className={`flex items-center gap-1 px-3.5 py-2.5 rounded-2xl rounded-tl-sm border ${isDark ? 'bg-navy-3/60 border-white/8' : 'bg-white border-navy/8'}`}>
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-teal-2 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main ChatBot component ───────────────────────────────────────
export default function ChatBot() {
  const { isDark }  = useTheme()
  const { user }    = useAuth()
  const userRole    = user?.role ?? 'policymaker'
  const roleConf    = ROLE_CONFIG[userRole] ?? ROLE_CONFIG.policymaker

  const STORAGE_KEY = `edupulse_chat_${userRole}`

  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [unread, setUnread]         = useState(0)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  // Persist last 20 messages to localStorage
  useEffect(() => {
    try {
      const toSave = messages.slice(-20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch { /* ignore quota errors */ }
  }, [messages, STORAGE_KEY])

  // Clear history on logout
  useEffect(() => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY)
      setMessages([])
    }
  }, [user, STORAGE_KEY])

  // Load suggestions on mount
  useEffect(() => {
    getChatSuggestions(userRole).then(d => setSuggestions(d?.suggestions ?? []))
  }, [userRole])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  // Welcome message when first opened (only if no history)
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id:      Date.now(),
        role:    'assistant',
        content: `Hello! I'm EduPulse AI, your ${roleConf.name} assistant.\n\nI have access to live Louisiana education data from our PostgreSQL database — including LDOE 2024 school performance scores, Census demographics, workforce gaps, and more.\n\nWhat would you like to know?`,
        sources: [],
      }])
    }
  }, [open])

  async function handleSend(messageText) {
    const text = (messageText || input).trim()
    if (!text || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: text, sources: [] }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Build history (exclude first welcome message, keep last 10 turns)
    const history = messages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && m.id !== messages[0]?.id))
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    const result = await sendChatMessage({
      message:             text,
      userRole,
      conversationHistory: history,
    })

    const aiMsg = {
      id:      Date.now() + 1,
      role:    'assistant',
      content: result.reply,
      sources: result.sources ?? [],
    }
    setMessages(prev => [...prev, aiMsg])
    setLoading(false)

    // Increment unread if chat is closed
    if (!open) setUnread(u => u + 1)
  }

  function handleOpen() {
    setOpen(true)
    setUnread(0)
  }

  function handleClear() {
    setMessages([])
    setTimeout(() => setOpen(true), 50)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Theme classes
  const panelBg  = isDark ? 'bg-navy-2 border-white/10' : 'bg-white border-navy/10'
  const headerBg = isDark ? 'bg-navy-3/80'               : 'bg-slate-3/60'
  const inputBg  = isDark ? 'bg-navy border-white/10 text-white placeholder-slate-brand' : 'bg-white border-navy/10 text-navy placeholder-navy/30'
  const msgArea  = isDark ? 'bg-navy/50'                  : 'bg-slate-3/20'

  return (
    <>
      {/* ── Floating button ─────────────────────────────────── */}
      {!open && (
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 bg-gradient-to-br ${roleConf.color}`}
          aria-label="Open EduPulse AI"
        >
          <MessageCircle size={24} className="text-white" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* ── Chat panel ──────────────────────────────────────── */}
      {open && (
        <div className={`fixed z-50 rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-fade-up ${panelBg}
          bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 w-full`}
          style={{ height: '580px', maxHeight: '90vh', fontFamily: "'DM Sans', sans-serif" }}>

          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3.5 border-b ${isDark ? 'border-white/8' : 'border-navy/8'} ${headerBg}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${roleConf.color}`}>
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className={`text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-navy'}`}>
                  EduPulse AI
                </p>
                <p className={`text-[10px] ${isDark ? 'text-slate-brand' : 'text-navy/50'}`}>
                  {roleConf.tagline}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Live DB indicator */}
              <span className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${isDark ? 'bg-teal/8 border-teal/15 text-teal-3' : 'bg-teal-4 border-teal/15 text-teal'}`}>
                <span className="w-1 h-1 rounded-full bg-teal-2 animate-pulse" />
                Live DB
              </span>
              <button onClick={handleClear} title="Clear chat"
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? 'text-slate-brand hover:text-white hover:bg-white/8' : 'text-navy/40 hover:text-navy hover:bg-navy/8'}`}>
                <RefreshCw size={13} />
              </button>
              <button onClick={() => setOpen(false)}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? 'text-slate-brand hover:text-white hover:bg-white/8' : 'text-navy/40 hover:text-navy hover:bg-navy/8'}`}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className={`flex-1 overflow-y-auto px-4 py-4 ${msgArea}`}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isDark={isDark} />
            ))}

            {loading && <TypingIndicator isDark={isDark} />}

            {/* Suggested questions — shown before any user message */}
            {messages.length <= 1 && !loading && suggestions.length > 0 && (
              <div className="mt-2">
                <p className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${isDark ? 'text-slate-brand/60' : 'text-navy/30'}`}>
                  Try asking
                </p>
                <div className="space-y-1.5">
                  {suggestions.slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer
                        ${isDark
                          ? 'bg-navy/60 border-white/8 text-slate-brand hover:border-teal-2/40 hover:text-white'
                          : 'bg-white border-navy/8 text-navy/60 hover:border-teal/30 hover:text-navy shadow-sm'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className={`px-4 py-3 border-t ${isDark ? 'border-white/8 bg-navy-2' : 'border-navy/8 bg-white'}`}>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Louisiana education data..."
                rows={1}
                className={`flex-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none transition-all resize-none focus:border-teal-2 focus:ring-1 focus:ring-teal-2/20 ${inputBg}`}
                style={{ maxHeight: '80px', minHeight: '40px' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer
                  ${input.trim() && !loading
                    ? `bg-gradient-to-br ${roleConf.color} text-white hover:scale-105 active:scale-95`
                    : isDark ? 'bg-white/8 text-slate-brand/40' : 'bg-navy/8 text-navy/25'
                  }`}
                aria-label="Send message"
              >
                {loading
                  ? <div className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin-slow" />
                  : <Send size={14} />
                }
              </button>
            </div>
            <p className={`text-[9px] text-center mt-2 ${isDark ? 'text-slate-brand/40' : 'text-navy/20'}`}>
              Powered by Groq llama-3.3-70b · Answers based on LDOE 2024 data
            </p>
          </div>
        </div>
      )}
    </>
  )
}
