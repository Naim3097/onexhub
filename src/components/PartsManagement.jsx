import { useState } from 'react'
import { usePartsContext } from '../context/PartsContext'
import PartsTable from './PartsTable'
import AddPartForm from './AddPartForm'
import EditPartModal from './EditPartModal'

function PartsManagement() {
  const { parts, searchParts, getLowStockParts, loading, error, retryConnection, isRetrying } = usePartsContext()
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingPart, setEditingPart] = useState(null)
  const [viewMode, setViewMode] = useState('all') // 'all', 'low-stock'

  const displayedParts = viewMode === 'low-stock' 
    ? getLowStockParts() 
    : searchParts(searchQuery)

  const lowStockCount = getLowStockParts().length

  // Show loading only if we have no data and not retrying
  if (loading && parts.length === 0 && !isRetrying) {
    return (
      <div className="touch-spacing">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner mr-3"></div>
            <span className="text-black-75">Loading parts...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && parts.length === 0) {
    return (
      <div className="touch-spacing">
        <div className="card border-red-200 bg-red-50">
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">⚠️ Offline Mode</div>
            <p className="text-black-75 text-sm mb-4">
              Working with local data. Changes will sync when connection is restored.
            </p>
            <button
              onClick={retryConnection}
              disabled={isRetrying}
              className={`btn-secondary text-sm ${isRetrying ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRetrying ? (
                <>
                  <div className="loading-spinner-sm mr-2"></div>
                  Connecting...
                </>
              ) : (
                'Retry Connection'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If we have data but with connection issues, show a small indicator instead
  const showOfflineIndicator = error && parts.length > 0

  return (
    <div className="touch-spacing">
      {/* Offline Indicator - Small and non-intrusive */}
      {showOfflineIndicator && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-yellow-800">
              <span className="mr-2">📡</span>
              Working offline - changes will sync when connected
            </div>
            <button
              onClick={retryConnection}
              className="text-yellow-600 hover:text-yellow-800 text-xs underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Section Header - Mobile Optimized */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Parts Management</h2>
          <p className="text-black-75 text-sm sm:text-base hidden sm:block">
            Manage your parts inventory and stock levels
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary mobile-full sm:w-auto"
        >
          <span className="sm:hidden">+ Add Part</span>
          <span className="hidden sm:inline">Add New Part</span>
        </button>
      </div>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="text-xs sm:text-sm text-black-75">Total Parts</div>
          <div className="text-xl sm:text-2xl font-bold text-primary-black">{parts.length}</div>
        </div>
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="text-xs sm:text-sm text-black-75">Low Stock</div>
          <div className="text-xl sm:text-2xl font-bold text-primary-red">{lowStockCount}</div>
        </div>
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="text-xs sm:text-sm text-black-75">Total Value</div>
          <div className="text-lg sm:text-2xl font-bold text-primary-black">
            RM{parts.reduce((sum, part) => sum + (part.harga * part.unitStock), 0).toFixed(2)}
          </div>
        </div>
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="text-xs sm:text-sm text-black-75">Stock Units</div>
          <div className="text-xl sm:text-2xl font-bold text-primary-black">
            {parts.reduce((sum, part) => sum + part.unitStock, 0)}
          </div>
        </div>
      </div>

      {/* Search and Controls - Mobile Stack */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-2 sm:px-4 rounded transition-colors duration-200 flex-1 sm:flex-none text-sm sm:text-base ${
              viewMode === 'all' 
                ? 'bg-primary-black text-primary-white' 
                : 'bg-black-10 text-primary-black hover:bg-black-25'
            }`}
          >
            All Parts
          </button>
          <button
            onClick={() => setViewMode('low-stock')}
            className={`px-3 py-2 sm:px-4 rounded transition-colors duration-200 flex-1 sm:flex-none text-sm sm:text-base whitespace-nowrap ${
              viewMode === 'low-stock' 
                ? 'bg-primary-red text-primary-white' 
                : 'bg-red-10 text-primary-red hover:bg-primary-red hover:text-primary-white'
            }`}
          >
            <span className="sm:hidden">Low ({lowStockCount})</span>
            <span className="hidden sm:inline">Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Parts Table - Mobile Responsive */}
      <PartsTable 
        parts={displayedParts} 
        onEditPart={setEditingPart}
      />

      {/* Add Part Form Modal */}
      {showAddForm && (
        <AddPartForm 
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Part Modal */}
      {editingPart && (
        <EditPartModal 
          part={editingPart}
          onClose={() => setEditingPart(null)}
        />
      )}
    </div>
  )
}

export default PartsManagement
