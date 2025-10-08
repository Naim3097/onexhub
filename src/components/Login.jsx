import { useState } from 'react'

function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const SYSTEM_PASSWORD = 'Onex@1234'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 800))

    if (password === SYSTEM_PASSWORD) {
      localStorage.setItem('onex_auth', 'authenticated')
      onLogin(true)
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-primary-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-black rounded-full mb-4 mx-auto">
            <span className="text-primary-white font-bold text-2xl flex items-center justify-center">BK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-black mb-2">
            BYKI Lite
          </h1>
          <p className="text-black-75 text-sm sm:text-base">
            One X Transmission Business Management System
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                System Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-field ${error ? 'border-primary-red' : ''}`}
                placeholder="Enter system password"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              {error && (
                <p className="text-primary-red text-sm mt-2 flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className={`w-full btn-primary ${
                isLoading || !password.trim() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="loading-spinner"></div>
                  Authenticating...
                </span>
              ) : (
                'Access System'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-black-5 rounded-lg border-l-4 border-primary-red">
            <div className="flex items-start gap-3">
              <span className="text-primary-red text-lg">🔒</span>
              <div>
                <h4 className="font-medium text-primary-black text-sm">
                  Authorized Access Only
                </h4>
                <p className="text-black-75 text-xs mt-1">
                  This system is restricted to authorized personnel only. 
                  All activities are logged and monitored.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-black-50 text-xs">
          <p>© 2025 One X Transmission. All rights reserved.</p>
          <p className="mt-1">BYKI Lite - Business Management System v2.0</p>
        </div>
      </div>
    </div>
  )
}

export default Login
