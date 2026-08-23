import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DetectPage from './pages/DetectPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import WeatherPage from './pages/WeatherPage'
import AuthPage from './pages/AuthPage'
import HistoryPage from './pages/HistoryPage'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AccountPage from './pages/AccountPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/detect" element={<DetectPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/account"
          element={(
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/history"
          element={(
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
