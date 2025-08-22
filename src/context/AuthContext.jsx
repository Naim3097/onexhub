import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      console.log('🔐 Auth state changed:', user ? 'Logged in' : 'Logged out')
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
      console.log('👋 Staff logged out')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
