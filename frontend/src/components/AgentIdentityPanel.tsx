import { useState, useEffect, useCallback } from 'react'
import type { AgentIdentity } from '../stores/useAgentStore'
import { ROLE_ICONS } from '../theme/colors'

interface Props {
  agentId: string
  agentName: string
  agentRole: string
  onClose: () => void
}

type Tab = 'soul' | 'memory' | 'program' | 'notes'

export function AgentIdentityPanel({ agentId, agentName, agentRole, onClose }: Props) {
  const [identity, setIdentity] = useState<AgentIdentity | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('soul')
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const icon = ROLE_ICONS[agentRole] || '●'

  // fetch full identity
  useEffect(() => {
    fetch(`/api/agents/${agentId}/identity`)
      .then((r) => r.json())
      .then((data) => setIdentity(data))
      .catch(console.error)
  }, [agentId])

  const getContent = useCallback((): string => {
    if (!identity) return ''
    if (activeTab === 'soul') return identity.soul
    if (activeTab === 'memory') return identity.memory
    if (activeTab === 'program') return identity.program
    if (activeTab === 'notes' && selectedDate) return identity.daily_notes[selectedDate] || ''
    return ''
  }, [identity, activeTab, selectedDate])

  const startEdit = () => {
    setEditContent(getContent())
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditContent('')
  }

  const save = async () => {
    if (!identity) return
    setSaving(true)

    let url = ''
    let body: Record<string, string> = {}

    if (activeTab === 'soul') {
      url = `/api/agents/${agentId}/soul`
      body = { content: editContent }
    } else if (activeTab === 'memory') {
      url = `/api/agents/${agentId}/memory`
      body = { content: editContent }
    } else if (activeTab === 'program') {
      url = `/api/agents/${agentId}/program`
      body = { content: editContent }
    } else if (activeTab === 'notes' && selectedDate) {
      url = `/api/agents/${agentId}/notes/${selectedDate}`
      body = { content: editContent }
    }

    if (url) {
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // update local state
      if (activeTab === 'soul') identity.soul = editContent
      else if (activeTab === 'memory') identity.memory = editContent
      else if (activeTab === 'program') identity.program = editContent
      else if (activeTab === 'notes' && selectedDate) identity.daily_notes[selectedDate] = editContent
    }

    setSaving(false)
    setEditing(false)
  }

  const dates = identity ? Object.keys(identity.daily_notes).sort().reverse() : []

  return (
    <div className="
      fixed top-0 right-0 w-96 h-full
      bg-parchment-50/98 backdrop-blur-sm
      border-l border-parchment-300
      z-[60] flex flex-col
      shadow-lg
    ">
      {/* Header */}
      <div className="px-4 py-3 border-b border-parchment-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <h2 className="font-typewriter text-sm font-bold">{agentName}</h2>
            <span className="text-xs font-mono text-parchment-500">{agentRole} · OpenClaw instance</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-parchment-400 hover:text-parchment-700 text-lg px-1"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-parchment-200 flex-shrink-0">
        {(['soul', 'memory', 'program', 'notes'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setEditing(false) }}
            className={`
              flex-1 py-2 text-xs font-typewriter transition-colors
              ${activeTab === tab
                ? 'text-blood border-b-2 border-blood'
                : 'text-parchment-400 hover:text-parchment-600'
              }
            `}
          >
            {tab === 'soul' ? '🪬 soul' :
             tab === 'memory' ? '🧠 memory' :
             tab === 'program' ? '📋 program' :
             `📝 notes (${dates.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!identity ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs font-mono text-parchment-400 animate-pulse">loading identity...</span>
          </div>
        ) : (
          <>
            {/* Date selector for notes tab */}
            {activeTab === 'notes' && (
              <div className="px-4 py-2 border-b border-parchment-200 flex-shrink-0">
                {dates.length === 0 ? (
                  <p className="text-xs font-mono text-parchment-400 italic">no daily notes yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {dates.map((date) => (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); setEditing(false) }}
                        className={`
                          text-xs font-mono px-2 py-0.5 rounded
                          ${selectedDate === date
                            ? 'bg-blood/10 text-blood border border-blood/30'
                            : 'bg-parchment-200 text-parchment-500 hover:bg-parchment-300'
                          }
                        `}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* File content */}
            <div className="flex-1 overflow-y-auto p-4">
              {editing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="
                    w-full h-full min-h-[300px]
                    font-mono text-xs text-parchment-800
                    bg-white/80 border border-parchment-300 rounded
                    p-3 resize-none
                    focus:outline-none focus:border-blood/50
                  "
                  spellCheck={false}
                />
              ) : (
                <pre className="text-xs font-mono text-parchment-700 whitespace-pre-wrap leading-relaxed">
                  {getContent() || (
                    <span className="italic text-parchment-400">
                      {activeTab === 'notes' && !selectedDate
                        ? 'select a date above'
                        : `no ${activeTab}.md yet`
                      }
                    </span>
                  )}
                </pre>
              )}
            </div>

            {/* Edit controls */}
            <div className="px-4 py-2 border-t border-parchment-200 flex items-center justify-end gap-2 flex-shrink-0">
              {activeTab === 'notes' && !selectedDate ? null : editing ? (
                <>
                  <button
                    onClick={cancelEdit}
                    className="text-xs font-mono px-3 py-1 rounded
                      bg-parchment-200 text-parchment-600 hover:bg-parchment-300"
                  >
                    cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="text-xs font-mono px-3 py-1 rounded
                      bg-blood text-white hover:bg-blood/80
                      disabled:opacity-50"
                  >
                    {saving ? 'saving...' : 'save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={startEdit}
                  className="text-xs font-mono px-3 py-1 rounded
                    bg-parchment-200 text-parchment-600 hover:bg-parchment-300"
                >
                  edit
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
