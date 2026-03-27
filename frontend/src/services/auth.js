import axios from 'axios'

const base = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export const authService = {
  login: async (email, password) => {
    const res = await base.post('/auth/login', { email, password })
    return res.data  // { token, user: { id, name, email } }
  },

  register: async (name, email, password) => {
    const res = await base.post('/auth/register', { name, email, password })
    return res.data  // { token, user: { id, name, email } }
  }
}