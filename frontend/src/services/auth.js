import api from './api'

export async function signupAccount(details) {
  const response = await api.post('/auth/signup', details)
  return response.data
}

export async function loginAccount(credentials) {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

export async function refreshSession() {
  const response = await api.post('/auth/refresh', null, { skipAuthRefresh: true })
  return response.data
}

export async function logoutAccount() {
  await api.post('/auth/logout', null, { skipAuthRefresh: true })
}

export async function requestPasswordReset(email) {
  const response = await api.post('/auth/forgot-password', { email }, { skipAuthRefresh: true })
  return response.data
}

export async function resetAccountPassword(token, newPassword) {
  const response = await api.post('/auth/reset-password', { token, newPassword }, { skipAuthRefresh: true })
  return response.data
}

export async function changeAccountPassword(currentPassword, newPassword) {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword })
  return response.data
}

export async function updateAccountProfile(profile) {
  const response = await api.patch('/auth/me', profile)
  return response.data
}
