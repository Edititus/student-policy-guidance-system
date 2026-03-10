import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../context/AuthContext'
import { Icon } from './atoms'
import { useConversations, useChatHistory } from '../hooks/useChat'
import { ChatMessage } from '../api/client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'adminResponse'
  content: string
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  sources?: Array<{
    policyTitle: string
    excerpt: string
    pageReference?: string
  }>
  timestamp: Date
  /** Present when the AI flagged this message for escalation */
  queryId?: string
  isEscalated?: boolean
  /** Set to true once the admin response has been fetched & injected */
  adminResolved?: boolean
  /** True while SSE tokens are still arriving */
  streaming?: boolean
}

/** Maps a policy category to a specific, meaningful question template. */
const CATEGORY_QUESTION_TEMPLATES: Record<
  string,
  (title: string) => { label: string; question: string }
> = {
  ACADEMIC: (title) => ({
    label: 'Graduation Requirements',
    question: `What is the minimum CGPA required to graduate according to the ${title}?`,
  }),
  FINANCIAL: (title) => ({
    label: 'Tuition & Fees',
    question: `What are the tuition payment deadlines and late payment penalties in the ${title}?`,
  }),
  EXAMINATION: (title) => ({
    label: 'Exam Misconduct',
    question: `What is the policy on plagiarism and exam misconduct according to the ${title}?`,
  }),
  ADMINISTRATIVE: (title) => ({
    label: 'Leave of Absence',
    question: `How do I apply for a leave of absence or defer my studies according to the ${title}?`,
  }),
  STUDENT_AFFAIRS: (title) => ({
    label: 'Student Conduct',
    question: `What are the student conduct and disciplinary rules in the ${title}?`,
  }),
}

/** Fallback for unknown categories. */
const defaultQuestionTemplate = (title: string) => ({
  label: title.length > 28 ? `${title.slice(0, 26)}…` : title,
  question: `What are the key rules and policies covered in the ${title}?`,
})

const WELCOME_MESSAGE = (): Message => ({
  id: uuidv4(),
  role: 'system',
  content:
    "Hello! I'm AskPolicy, your university policy guide. Ask me anything about registration, fees, exams, appeals, and more!",
  timestamp: new Date(),
})

function serverToLocal(serverMessages: ChatMessage[]): Message[] {
  const result: Message[] = []
  for (const sm of serverMessages) {
    result.push({
      id: `user-${sm.id}`,
      role: 'user',
      content: sm.query,
      timestamp: new Date(sm.timestamp),
    })
    result.push({
      id: sm.id,
      role: 'assistant',
      content: sm.answer,
      confidence: sm.confidence,
      sources: (sm.sources as Message['sources']) ?? [],
      timestamp: new Date(sm.timestamp),
      queryId: sm.requiresEscalation ? sm.id : undefined,
      isEscalated: sm.requiresEscalation,
      adminResolved: false,
    })
  }
  return result
}

export default function PolicyChatbot() {
  useAuth()

  // ── Sidebar & conversation state ──
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => uuidv4())

  // ── Chat state ──
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE()])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [availablePolicies, setAvailablePolicies] = useState<
    { title: string; category: string }[] | null
  >(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Prevents the history useEffect from overwriting locally-rendered messages
  // immediately after sending — the DB save is async so the server response
  // won't include the new message yet when historyData first re-fetches.
  const skipNextHistoryLoad = useRef(false)

  // ── Server data ──
  const { data: conversationsData, refetch: refetchConversations } = useConversations()
  const { data: historyData } = useChatHistory(activeConversationId ?? undefined)
  const conversations = conversationsData?.data?.conversations ?? []

  // ── Load server history when active conversation changes ──
  useEffect(() => {
    if (!activeConversationId || !historyData?.data?.messages) return
    // Skip the first re-fetch that fires right after a message is sent locally.
    // saveQuery on the backend is awaited before the SSE done event, but React
    // Query may still beat the DB write with a stale in-flight refetch.
    if (skipNextHistoryLoad.current) {
      skipNextHistoryLoad.current = false
      return
    }
    const rows = historyData.data.messages
    setMessages(rows.length > 0 ? serverToLocal(rows) : [WELCOME_MESSAGE()])
  }, [activeConversationId, historyData])

  // ── Auto-scroll to newest message ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Poll every 30 s for admin responses to pending escalations ──
  useEffect(() => {
    const pending = messages.filter((m) => m.isEscalated && !m.adminResolved && m.queryId)
    if (pending.length === 0) return

    const check = async () => {
      const token = localStorage.getItem('auth_token')
      await Promise.all(
        pending.map(async (msg) => {
          try {
            const res = await fetch(`${API_BASE_URL}/chat/resolution/${msg.queryId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            const json = await res.json()
            if (!json.success || !json.data?.resolved) return

            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, adminResolved: true } : m))
            )

            const adminMsg: Message = {
              id: uuidv4(),
              role: 'adminResponse',
              content: json.data.adminResponse || '(No message provided)',
              timestamp: json.data.respondedAt ? new Date(json.data.respondedAt) : new Date(),
            }
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === msg.id)
              if (idx === -1) return [...prev, adminMsg]
              const next = [...prev]
              next.splice(idx + 1, 0, adminMsg)
              return next
            })
          } catch {
            // silently ignore transient network errors
          }
        })
      )
    }

    check()
    const timer = setInterval(check, 30_000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.map((m) => `${m.id}:${m.adminResolved}`).join(',')])

  // ── Fetch policy categories on mount ──
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${API_BASE_URL}/chat/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const json = await res.json()
        if (json.success)
          setAvailablePolicies(json.data.policies as { title: string; category: string }[])
      } catch {
        // silent
      }
    }
    fetchCategories()
  }, [])

  // ── Actions ──
  const startNewChat = () => {
    setActiveConversationId(null)
    setCurrentConversationId(uuidv4())
    setMessages([WELCOME_MESSAGE()])
    setInput('')
  }

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setCurrentConversationId(conversationId)
    setInput('')
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    const sentInput = input
    setInput('')
    setIsLoading(true)

    // Create a placeholder assistant message that will be filled token-by-token
    const assistantId = uuidv4()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streaming: true,
      },
    ])

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/chat/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: sentInput,
          conversationId: currentConversationId,
          studentContext: { program: 'Computer Science', year: 3, level: '300' },
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Server error ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let firstToken = true

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let payload: {
            token?: string
            done?: boolean
            error?: string
            meta?: {
              queryId?: string
              confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
              sources?: Message['sources']
              requiresEscalation?: boolean
            }
          }
          try {
            payload = JSON.parse(line.slice(6))
          } catch {
            continue
          }

          if (payload.token) {
            // Hide the spinner as soon as the first token arrives
            if (firstToken) {
              firstToken = false
              setIsLoading(false)
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + payload.token } : m,
              ),
            )
          }

          if (payload.done && payload.meta) {
            const { queryId, confidence, sources, requiresEscalation } = payload.meta
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      streaming: false,
                      confidence,
                      sources: sources ?? [],
                      queryId: requiresEscalation ? queryId : undefined,
                      isEscalated: !!requiresEscalation,
                      adminResolved: false,
                    }
                  : m,
              ),
            )
            setIsLoading(false)
            if (!activeConversationId) {
              // Set the flag BEFORE enabling the history query so the first
              // server re-fetch doesn't overwrite our locally-rendered message.
              skipNextHistoryLoad.current = true
              setActiveConversationId(currentConversationId)
              refetchConversations()
            }
          }

          if (payload.error) {
            throw new Error(payload.error)
          }
        }
      }
    } catch (error) {
      // Remove the empty placeholder and show an error instead
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== assistantId)
          .concat({
            id: uuidv4(),
            role: 'system',
            content: `❌ Error: ${
              error instanceof Error ? error.message : 'Failed to connect to server'
            }`,
            timestamp: new Date(),
          }),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getConfidenceBadge = (confidence?: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (!confidence) return null
    const colors = {
      HIGH: 'bg-teal-mist text-teal-deep border border-teal-bright',
      MEDIUM: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      LOW: 'bg-red-50 text-red-700 border border-red-200',
    }
    const icons = {
      HIGH: <Icon name="check-filled" size={12} />,
      MEDIUM: <Icon name="exclamation-circle" size={12} />,
      LOW: <Icon name="warning-filled" size={12} />,
    }
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${colors[confidence]}`}
      >
        {icons[confidence]}
        {confidence}
      </span>
    )
  }

  const activeTitle = activeConversationId
    ? (conversations.find((c) => c.conversationId === activeConversationId)?.title ??
      'Conversation')
    : 'New Chat'

  return (
    <div className="min-h-screen bg-smoke flex">
      {/* ── Collapsible left sidebar ── */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        } transition-all duration-200 bg-white border-r border-gray-200 flex flex-col shrink-0`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-teal-deep text-sm">Conversations</span>
        </div>
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-primary text-white text-sm font-medium hover:bg-ocean-deep transition-colors"
          >
            <Icon name="plus" size={16} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate/60 px-4 py-2 italic">No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => selectConversation(conv.conversationId)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 hover:bg-teal-mist/30 transition-colors truncate ${
                  activeConversationId === conv.conversationId
                    ? 'bg-teal-mist text-teal-deep font-medium'
                    : 'text-slate'
                }`}
                title={conv.title}
              >
                {conv.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main chat column ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Icon name="menu" size={20} className="text-slate" />
          </button>
          <span className="font-medium text-teal-deep text-sm truncate">{activeTitle}</span>
        </div>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 min-h-0">
          {/* Chat card */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden min-h-0">
            {/* Messages */}
            <div
              className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4"
              style={{ minHeight: '300px', maxHeight: '55vh' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'adminResponse' ? (
                    <div className="max-w-[85%] rounded-2xl p-4 bg-teal-50 border border-teal-200 shadow-sm text-teal-deep">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-teal-200">
                        <div className="w-6 h-6 bg-teal-200 rounded-full flex items-center justify-center">
                          <Icon name="check-filled" size={14} className="text-teal-700" />
                        </div>
                        <span className="font-semibold text-teal-800 text-sm">Admin Response</span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className="text-xs mt-2 text-teal-600">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-teal-primary to-ocean-deep text-white'
                          : message.role === 'system'
                            ? 'bg-gradient-to-br from-gray-50 to-gray-100 text-slate border border-gray-200'
                            : 'bg-white text-teal-deep border border-gray-200 shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                          <span className="font-medium text-teal-deep flex items-center gap-2">
                            <div className="w-6 h-6 bg-teal-mist rounded-full flex items-center justify-center">
                              <Icon name="lightbulb" size={14} className="text-teal-primary" />
                            </div>
                            AskPolicy
                          </span>
                          <div className="flex items-center gap-2">
                            {message.isEscalated && !message.adminResolved && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                                <Icon name="exclamation-circle" size={12} />
                                Awaiting admin
                              </span>
                            )}
                            {getConfidenceBadge(message.confidence)}
                          </div>
                        </div>
                      )}

                      {message.role === 'system' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-teal-primary/10 rounded-full flex items-center justify-center">
                            <Icon name="info-circle" size={14} className="text-teal-primary" />
                          </div>
                          <span className="text-sm font-medium text-slate">System</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                        {message.streaming && (
                          <span className="inline-block w-1.5 h-4 bg-teal-primary ml-0.5 animate-pulse align-middle" />
                        )}
                      </div>

                      {message.sources && message.sources.length > 0 && !message.isEscalated && (
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate/60 flex items-center gap-1 shrink-0">
                            <Icon name="book" size={11} />
                            Sources:
                          </span>
                          {message.sources.map((source, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-teal-mist/50 text-teal-deep border border-teal-bright/30"
                              title={source.excerpt}
                            >
                              {source.pageReference ?? source.policyTitle}
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-slate/60'}`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && !messages.some((m) => m.streaming) && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-mist rounded-full flex items-center justify-center">
                        <Icon name="spinner" size={16} className="text-teal-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-teal-deep">AI is thinking…</p>
                        <p className="text-xs text-slate">
                          Searching policies and generating response
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about registration, fees, exams, appeals…"
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all text-teal-deep placeholder:text-slate/50"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-5 py-3 bg-teal-primary text-white rounded-xl font-medium hover:bg-ocean-deep disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Icon name="send" size={20} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>

              {availablePolicies !== null && (
                <div className="mt-4">
                  {availablePolicies.length === 0 ? (
                    <p className="text-xs text-slate/60 italic">
                      No policies uploaded yet. Ask an admin to upload the student handbook.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-slate mb-2">Quick questions:</p>
                      <div className="flex gap-2 flex-wrap">
                        {availablePolicies.slice(0, 5).map((policy) => {
                          const template =
                            CATEGORY_QUESTION_TEMPLATES[policy.category.toUpperCase()] ??
                            defaultQuestionTemplate
                          const { label, question } = template(policy.title)
                          return (
                            <button
                              key={policy.title}
                              onClick={() => setInput(question)}
                              className="text-xs px-3 py-1.5 bg-white hover:bg-teal-mist text-slate hover:text-teal-deep border border-gray-200 hover:border-teal-bright rounded-full transition-all"
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate">
              <span className="inline-flex items-center gap-1">
                <Icon name="lightbulb" size={14} />
                Tip: Be specific with your questions for better answers. For complex issues, contact
                Student Affairs.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
