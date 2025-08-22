import { useState, useEffect, Suspense, lazy } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import LoginScreen from './components/LoginScreen'
import { PartsProvider } from './context/PartsContext'
import { InvoiceProvider } from './context/InvoiceContext'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebaseConfig'

// Lazy load components for better performance
const PartsManagement = lazy(() => import('./components/PartsManagement'))
const InvoiceGeneration = lazy(() => import('./components/InvoiceGeneration'))
const InvoiceHistory = lazy(() => import('./components/InvoiceHistory'))

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="loading-spinner"></div>
    <span className="ml-3 text-black-75">Loading...</span>
  </div>
)

// Main App Content Component (after authentication)
function App() {
  const [activeSection, setActiveSection] = useState('parts')
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

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
      console.log('👋 Staff logged out')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-white flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-black-75">Loading system...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={() => console.log('Login successful!')} />
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'parts':
        return <PartsManagement />
      case 'invoice':
        return <InvoiceGeneration setActiveSection={setActiveSection} />
      case 'history':
        return <InvoiceHistory />
      default:
        return <PartsManagement />
    }
  }

  return (
    <PartsProvider>
      <InvoiceProvider>
        <div className="min-h-screen bg-primary-white">
          <Header onLogout={handleLogout} />
          <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
          <main className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
            <Suspense fallback={<LoadingSpinner />}>
              <div className="fade-in">
                {renderActiveSection()}
              </div>
            </Suspense>
          </main>
        </div>
      </InvoiceProvider>
    </PartsProvider>
  )
}

export default App