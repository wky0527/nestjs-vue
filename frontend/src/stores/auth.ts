import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile, type UserInfo } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  )

  const isLoggedIn = computed(() => !!token.value)
  const roleName = computed(() => user.value?.roleName || '')
  const isAdmin = computed(() => user.value?.roleName === 'admin')

  async function login(username: string, password: string) {
    const res = await loginApi({ username, password })
    token.value = res.data.access_token
    user.value = res.data.user
    localStorage.setItem('token', res.data.access_token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }

  async function fetchProfile() {
    const profile = await getProfile()
    user.value = profile
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, roleName, isAdmin, login, fetchProfile, logout }
})
