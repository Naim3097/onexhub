import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebaseConfig'

function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('staff@onexhub.com') // Pre-filled for convenience
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Staff logged in successfully!')
      onLoginSuccess()
    } catch (error) {
      console.error('❌ Login error:', error)
      
      let errorMessage = 'Login failed. Please check your credentials.'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Contact administrator.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Try again.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black-5 px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-black mb-2">
            ONEXHUB
          </h1>
          <p className="text-black-75">
            Staff Access Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-black mb-2">
              Staff Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-black mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              required
              autoComplete="current-password"
              placeholder="Enter staff password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full ${loading ? 'opacity-75' : ''}`}
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-black-50">
            ONEXHUB Parts & Invoice Management System
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
