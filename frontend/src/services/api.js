import axios from 'axios'

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quizmind_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('quizmind_token')
      localStorage.removeItem('quizmind_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const quizService = {
  generate:         async (payload) => (await api.post('/quiz/generate', payload)).data,
  submit:           async (quizId, answers) => (await api.post(`/quiz/${quizId}/submit`, { answers })).data,
  getResult:        async (resultId) => (await api.get(`/results/${resultId}`)).data,
  getHistory:       async () => (await api.get('/quiz/history')).data,
  saveLearnResult:  async (payload) => (await api.post('/quiz/save-learn-result', payload)).data,
}

export const examService = {
  generate:   async (payload) => (await api.post('/exam/generate', payload)).data,
  submit:     async (sessionId, answers) => (await api.post(`/exam/${sessionId}/submit`, { answers })).data,
  getResult:  async (resultId) => (await api.get(`/exam/results/${resultId}`)).data,
  getHistory: async () => (await api.get('/exam/history')).data,
}

export const learnService = {
  generate: async (payload) => (await api.post('/learn/generate', payload)).data,
}

export const dashboardService = {
  getStats: async () => (await api.get('/dashboard/stats')).data,
}

export default api