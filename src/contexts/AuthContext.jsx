import { createContext, useContext, useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import {
  getCurrentUser,
  signOut,
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth'
import { setTokenProvider, setAuthErrorHandler } from '../utils/api'
import { DEMO_STORAGE_KEY, DEMO_USER, isDemoMode } from '../utils/demoData'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    },
  },
})

const AuthContext = createContext(null)

async function loadUserWithDisplayName() {
  const cognitoUser = await getCurrentUser()
  let displayName = ''
  try {
    const attrs = await fetchUserAttributes()
    displayName = attrs.name || ''
  } catch {
    // attributes unavailable — fall back below rather than fail sign-in
  }
  return { ...cognitoUser, displayName }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(isDemoMode())

  async function getAccessToken() {
    if (isDemoMode()) return null
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? null
      if (!token) {
        await signOut().catch(() => {})
        setUser(null)
      }
      return token
    } catch {
      await signOut().catch(() => {})
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    setTokenProvider(getAccessToken)
    setAuthErrorHandler(async () => {
      if (isDemoMode()) return
      await signOut().catch(() => {})
      setUser(null)
    })

    if (isDemoMode()) {
      setUser(DEMO_USER)
      setIsDemo(true)
      setIsLoading(false)
      return
    }

    loadUserWithDisplayName()
      .then((cognitoUser) => setUser(cognitoUser))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  function enterDemo() {
    window.localStorage.setItem(DEMO_STORAGE_KEY, '1')
    setIsDemo(true)
    setUser(DEMO_USER)
  }

  async function login(email, password) {
    await amplifySignIn({ username: email, password })
    const cognitoUser = await loadUserWithDisplayName()
    setUser(cognitoUser)
    return cognitoUser
  }

  async function register(email, password, name) {
    return amplifySignUp({
      username: email,
      password,
      options: { userAttributes: { email, name } },
    })
  }

  async function confirmRegistration(email, code) {
    return amplifyConfirmSignUp({ username: email, confirmationCode: code })
  }

  async function logout() {
    if (isDemoMode()) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
      setIsDemo(false)
      setUser(null)
      return
    }
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isDemo, setUser, getAccessToken, login, register, confirmRegistration, logout, enterDemo }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
