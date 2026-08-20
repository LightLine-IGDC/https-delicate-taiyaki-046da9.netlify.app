import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    ready: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
  },
  actions: {
    async init() {
      if (this.ready) return
      const { data } = await supabase.auth.getSession()
      this.user = data.session?.user ?? null
      this.ready = true
      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null
      })
    },
    async login(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.user = data.user
    },
    async logout() {
      await supabase.auth.signOut()
      this.user = null
    },
  },
})
