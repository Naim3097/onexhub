function Header({ onLogout }) {
  return (
    <header className="bg-primary-black text-primary-white py-4 sm:py-6 px-4 shadow-subtle">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
              <span className="hidden sm:inline">BYKI Lite - Business Management</span>
              <span className="sm:hidden">BYKI Lite</span>
            </h1>
            <p className="text-black-75 mt-1 text-sm sm:text-base hidden sm:block">
              One X Transmission professional parts management system
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0 ml-4">
            <div className="text-right">
              <div className="text-xs sm:text-sm text-black-75 hidden sm:block">Current Date</div>
              <div className="font-semibold text-sm sm:text-base">
                <span className="hidden sm:inline">{new Date().toLocaleDateString()}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn-tertiary text-xs sm:text-sm py-2 px-3 sm:px-4"
                title="Logout"
              >
                <span className="hidden sm:inline">🔒 Logout</span>
                <span className="sm:hidden">🔒</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
