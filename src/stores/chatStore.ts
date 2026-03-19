import { create } from 'zustand'
import type { ChatConversation, ChatMessage } from '@/types'
import { mockConversations, mockMessages } from '@/data/mock'

interface ChatState {
  conversations: ChatConversation[]
  messages: Record<string, ChatMessage[]>
  activeConversationId: string | null
  isTyping: Record<string, boolean>
  _replyTimers: Record<string, ReturnType<typeof setTimeout>>
  setActiveConversation: (id: string | null) => void
  sendMessage: (conversationId: string, text: string, senderId: string) => void
  markAsRead: (conversationId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: mockConversations,
  messages: mockMessages,
  activeConversationId: null,
  isTyping: {},
  _replyTimers: {},

  setActiveConversation: (id) => {
    set({ activeConversationId: id })
    if (id) get().markAsRead(id)
  },

  sendMessage: (conversationId, text, senderId) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    }

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), msg],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: msg, updatedAt: msg.createdAt } : c
      ),
    }))

    // Simulate typing and auto-reply
    const otherParticipant = get().conversations.find((c) => c.id === conversationId)
      ?.participants.find((p) => p !== senderId)

    if (otherParticipant) {
      // Отменяем предыдущий таймер для этого чата, чтобы не было дублей
      const prevTimer = get()._replyTimers[conversationId]
      if (prevTimer) clearTimeout(prevTimer)

      set((state) => ({ isTyping: { ...state.isTyping, [conversationId]: true } }))

      const timer = setTimeout(() => {
        set((state) => ({ isTyping: { ...state.isTyping, [conversationId]: false } }))

        const replies = [
          'Хорошо, понял!',
          'Отличная идея, давай так и сделаем.',
          'Спасибо! Сейчас посмотрю.',
          'Да, это правильный подход.',
          'Окей, буду через 5 минут.',
          'Согласен, давай обсудим подробнее.',
        ]
        const replyText = replies[Math.floor(Math.random() * replies.length)]!

        const reply: ChatMessage = {
          id: `msg-${Date.now()}-reply`,
          conversationId,
          senderId: otherParticipant,
          text: replyText,
          createdAt: new Date().toISOString(),
          read: get().activeConversationId === conversationId,
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), reply],
          },
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessage: reply,
                  updatedAt: reply.createdAt,
                  unreadCount: state.activeConversationId === conversationId ? 0 : c.unreadCount + 1,
                }
              : c
          ),
        }))
      }, 1500 + Math.random() * 2000)

      set((state) => ({ _replyTimers: { ...state._replyTimers, [conversationId]: timer } }))
    }
  },

  markAsRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) => ({ ...m, read: true })),
      },
    }))
  },
}))
