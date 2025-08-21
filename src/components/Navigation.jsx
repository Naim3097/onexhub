function Navigation({ activeSection, setActiveSection }) {
  const sections = [
    { id: 'parts', label: 'Parts', fullLabel: 'Parts Management', description: 'Manage inventory' },
    { id: 'invoice', label: 'Invoice', fullLabel: 'Invoice Generation', description: 'Create invoices' },
    { id: 'history', label: 'History', fullLabel: 'Invoice History', description: 'View past invoices' }
  ]

  return (
    <nav className="bg-primary-white border-b border-black-10 sticky top-0 z-40">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4">
        {/* Mobile: Horizontal scrolling tabs */}
        <div className="flex space-x-0 overflow-x-auto scrollbar-hide sm:justify-center">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`nav-tab whitespace-nowrap flex-shrink-0 px-4 py-3 sm:px-6 transition-all duration-200 ${
                activeSection === section.id ? 'active' : ''
              }`}
            >
              <div className="text-center sm:text-left">
                <div className="font-semibold text-sm sm:text-base">
                  <span className="sm:hidden">{section.label}</span>
                  <span className="hidden sm:inline">{section.fullLabel}</span>
                </div>
                <div className="text-xs sm:text-sm text-black-50 hidden sm:block">
                  {section.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Mobile indicator - shows current section */}
      <div className="sm:hidden px-4 py-2 bg-black-10">
        <div className="text-center text-xs text-black-75">
          {sections.find(s => s.id === activeSection)?.description}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
