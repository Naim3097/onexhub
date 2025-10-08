import { useState, useEffect } from 'react'
import { useRepairOrder, STATUS_LABELS, STATUS_COLORS, REPAIR_STATUSES } from '../context/RepairOrderContext'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebaseConfig'

function CarStatus() {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [bykiStatusData, setBykiStatusData] = useState([])
  const [isLoadingBykiStatus, setIsLoadingBykiStatus] = useState(true)
  const [bykiStatusError, setBykiStatusError] = useState(null)
  
  const {
    repairOrders,
    isLoadingOrders,
    orderError,
    statusCounts,
    getOrdersByStatus,
    formatDate
  } = useRepairOrder()

  // Firestore connection to byki_status collection
  useEffect(() => {
    console.log('🚀 Setting up byki_status collection listener...')
    
    try {
      const bykiStatusRef = collection(db, 'byki_status')
      const bykiStatusQuery = query(bykiStatusRef, orderBy('createdAt', 'desc'))
      
      const unsubscribe = onSnapshot(bykiStatusQuery, (snapshot) => {
        console.log('📊 byki_status data received:', snapshot.size, 'documents')
        
        const statusData = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          statusData.push({
            id: doc.id,
            ...data
          })
        })
        
        setBykiStatusData(statusData)
        setIsLoadingBykiStatus(false)
        setBykiStatusError(null)
        
        console.log('✅ byki_status data processed:', statusData.length, 'records')
        
        // Log sample data structure (for development purposes)
        if (statusData.length > 0) {
          console.log('📝 Sample byki_status document structure:', statusData[0])
        }
      }, (error) => {
        console.error('❌ Error loading byki_status collection:', error)
        setBykiStatusError(error.message)
        setIsLoadingBykiStatus(false)
      })
      
      return () => {
        console.log('🔌 Disconnecting from byki_status collection')
        unsubscribe()
      }
    } catch (error) {
      console.error('❌ Error setting up byki_status listener:', error)
      setBykiStatusError(error.message)
      setIsLoadingBykiStatus(false)
    }
  }, [])

  // Filter orders based on selected status and search term
  const getFilteredOrders = () => {
    let filtered = selectedStatus === 'all' 
      ? repairOrders 
      : getOrdersByStatus(selectedStatus)
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicleInfo?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicleInfo?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicleInfo?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return filtered
  }

  const filteredOrders = getFilteredOrders()

  // Get progress percentage for status
  const getStatusProgress = (status) => {
    const statusOrder = [
      REPAIR_STATUSES.NOT_STARTED,
      REPAIR_STATUSES.UNDER_INSPECTION,
      REPAIR_STATUSES.INSPECTION_COMPLETED,
      REPAIR_STATUSES.REPAIR_ONGOING,
      REPAIR_STATUSES.READY_FOR_PICKUP
    ]
    
    const index = statusOrder.indexOf(status)
    return ((index + 1) / statusOrder.length) * 100
  }

  if (isLoadingOrders) {
    return (
      <div className="space-y-6">
        <div className="bg-primary-white rounded-lg border border-black-10 p-8 text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-black-75">Loading car status information...</p>
        </div>
      </div>
    )
  }

  if (orderError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Error loading repair orders: {orderError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-black">Car Status</h2>
          <p className="text-black-75 text-sm sm:text-base">
            Track ongoing repairs and service status • {repairOrders.length} total cars
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
          >
            <option value="all">All Status ({repairOrders.length})</option>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label} ({statusCounts[status] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Firestore Integration Status - Development Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isLoadingBykiStatus ? 'bg-yellow-500 animate-pulse' : 
            bykiStatusError ? 'bg-red-500' : 'bg-green-500'
          }`}></div>
          <div className="flex-1">
            <p className="font-medium text-blue-800">Firestore Integration Status</p>
            <p className="text-sm text-blue-700">
              {isLoadingBykiStatus ? 'Connecting to byki_status collection...' :
               bykiStatusError ? `Connection error: ${bykiStatusError}` :
               `Connected to byki_status collection • ${bykiStatusData.length} records available`}
            </p>
            {!isLoadingBykiStatus && !bykiStatusError && (
              <p className="text-xs text-blue-600 mt-1">
                Data structure ready for implementation • Fields awaiting finalization
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div 
            key={status}
            className="bg-primary-white rounded-lg border border-black-10 p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black-50 text-xs uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-primary-black">
                  {statusCounts[status] || 0}
                </p>
              </div>
              <div className={`p-2 rounded-full ${STATUS_COLORS[status]}`}>
                {status === REPAIR_STATUSES.NOT_STARTED && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {status === REPAIR_STATUSES.UNDER_INSPECTION && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                {status === REPAIR_STATUSES.INSPECTION_COMPLETED && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {status === REPAIR_STATUSES.REPAIR_ONGOING && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {status === REPAIR_STATUSES.READY_FOR_PICKUP && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-primary-white rounded-lg border border-black-10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, car make/model, or license plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
            />
          </div>
          <button 
            onClick={() => setSearchTerm('')}
            className="px-4 py-3 border border-black-20 rounded-lg hover:bg-black-5"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Car Status List */}
      <div className="bg-primary-white rounded-lg border border-black-10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-black-10">
          <h3 className="text-lg font-semibold text-primary-black">
            {selectedStatus === 'all' 
              ? `All Cars (${filteredOrders.length})`
              : `${STATUS_LABELS[selectedStatus]} (${filteredOrders.length})`
            }
          </h3>
          <p className="text-black-75 text-sm">Real-time updates from workshop system</p>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-black-50">
              {searchTerm 
                ? 'No cars found matching your search.'
                : selectedStatus === 'all'
                  ? 'No repair orders found.'
                  : `No cars with status: ${STATUS_LABELS[selectedStatus]}`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black-10">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-black-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Customer and Car Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-primary-black">
                          {order.customerName || 'Unknown Customer'}
                        </h4>
                        <p className="text-black-75">
                          {order.vehicleInfo?.make} {order.vehicleInfo?.model} {order.vehicleInfo?.year}
                        </p>
                        <p className="text-sm text-black-50">
                          License Plate: {order.vehicleInfo?.licensePlate || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Issue Description */}
                    {order.issueDescription && (
                      <div className="mb-3">
                        <p className="text-sm text-black-75">
                          <span className="font-medium">Issue:</span> {order.issueDescription}
                        </p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-black-50">
                      <p>Created: {formatDate(order.dateCreated)}</p>
                      <p>Last Updated: {formatDate(order.lastUpdated)}</p>
                    </div>
                  </div>

                  {/* Status and Progress */}
                  <div className="lg:w-64">
                    <div className="text-center">
                      <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${STATUS_COLORS[order.repairStatus]}`}>
                        {STATUS_LABELS[order.repairStatus] || 'Unknown Status'}
                      </span>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-black-10 rounded-full h-2">
                          <div 
                            className="bg-primary-red h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getStatusProgress(order.repairStatus)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-black-50 mt-1">
                          {Math.round(getStatusProgress(order.repairStatus))}% Complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CarStatus