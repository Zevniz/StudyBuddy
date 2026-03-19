import { create } from 'zustand'
import type { User as AppUser } from '@/types'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface AuthState {
  user: AppUser | null
  supabaseUser: SupabaseUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; university: string; faculty: string }) => Promise<{ needsConfirmation: boolean }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<AppUser>) => Promise<void>
  initialize: () => Promise<void>
}

function supabaseUserToAppUser(user: SupabaseUser): AppUser {
  const meta = user.user_metadata || {}
  return {
    id: user.id,
    name: meta.name || meta.full_name || 'Пользователь',
    email: user.email || '',
    avatar: meta.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.id}&backgroundColor=c0aede`,
    university: meta.university || '',
    faculty: meta.faculty || '',
    bio: meta.bio || '',
    badges: ['newcomer'],
    reputation: 0,
    reputationLevel: 'newcomer',
    completedTasks: 0,
    responseTime: '—',
    joinedAt: user.created_at || new Date().toISOString(),
    isOnline: true,
    lastSeen: new Date().toISOString(),
  }
}

// Helper: wrap a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    ),
  ])
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  supabaseUser: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({
          supabaseUser: session.user,
          session,
          user: supabaseUserToAppUser(session.user),
          isAuthenticated: true,
          isInitialized: true,
        })
      } else {
        set({ isInitialized: true })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            supabaseUser: session.user,
            session,
            user: supabaseUserToAppUser(session.user),
            isAuthenticated: true,
          })
        } else {
          set({
            supabaseUser: null,
            session: null,
            user: null,
            isAuthenticated: false,
          })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ isInitialized: true })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000
      )
      if (error) {
        const msg = error.message || ''
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          throw new Error('INVALID_CREDENTIALS')
        }
        if (msg.includes('Email not confirmed')) {
          throw new Error('EMAIL_NOT_CONFIRMED')
        }
        if (msg.includes('Email logins are disabled')) {
          throw new Error('EMAIL_LOGINS_DISABLED')
        }
        throw new Error(msg)
      }
      if (data.user) {
        set({
          supabaseUser: data.user,
          session: data.session,
          user: supabaseUserToAppUser(data.user),
          isAuthenticated: true,
        })
      }
    } catch (err) {
      // Re-throw with proper message, always ensure isLoading is false
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (formData) => {
    set({ isLoading: true })
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              university: formData.university,
              faculty: formData.faculty,
            },
          },
        }),
        10000
      )

      if (error) {
        const msg = error.message || ''
        // Handle common Supabase errors
        if (msg.includes('User already registered') || msg.includes('already been registered')) {
          throw new Error('USER_ALREADY_EXISTS')
        }
        if (msg.includes('sending confirmation') || msg.includes('unexpected_failure')) {
          throw new Error('EMAIL_SERVICE_ERROR')
        }
        if (msg.includes('Email logins are disabled') || msg.includes('Signups not allowed')) {
          throw new Error('EMAIL_LOGINS_DISABLED')
        }
        throw new Error(msg)
      }

      // Supabase returns a user with empty identities array if email is already taken
      const identities = data.user?.identities || []
      if (data.user && identities.length === 0) {
        throw new Error('USER_ALREADY_EXISTS')
      }

      // Check if email confirmation is required
      const needsConfirmation = !data.session

      if (data.user && data.session) {
        set({
          supabaseUser: data.user,
          session: data.session,
          user: supabaseUserToAppUser(data.user),
          isAuthenticated: true,
        })
      }

      return { needsConfirmation }
    } catch (err) {
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      user: null,
      supabaseUser: null,
      session: null,
      isAuthenticated: false,
    })
  },

  updateProfile: async (data: Partial<AppUser>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }))
    const currentUser = get().supabaseUser
    if (currentUser) {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: data.name,
          university: data.university,
          faculty: data.faculty,
          bio: data.bio,
        },
      })
      if (error) {
        console.error('Failed to update profile:', error.message)
      }
    }
  },
}))
