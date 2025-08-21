import { useState, Suspense, lazy } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import { PartsProvider } from './context/PartsContext'
import { InvoiceProvider } from './context/InvoiceContext'

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

function App() {
  const [activeSection, setActiveSection] = useState('parts')

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
          <Header />
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
