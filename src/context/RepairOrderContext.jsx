import { createContext, useContext, useReducer, useEffect } from 'react'
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'

// Repair Order Context
const RepairOrderContext = createContext()

// Repair statuses in sequential order
export const REPAIR_STATUSES = {
  NOT_STARTED: 'not_started',
  UNDER_INSPECTION: 'under_inspection', 
  INSPECTION_COMPLETED: 'inspection_completed',
  REPAIR_ONGOING: 'repair_ongoing',
  READY_FOR_PICKUP: 'ready_for_pickup'
}

export const STATUS_LABELS = {
  [REPAIR_STATUSES.NOT_STARTED]: 'Not Started Yet',
  [REPAIR_STATUSES.UNDER_INSPECTION]: 'Car Under Inspection',
  [REPAIR_STATUSES.INSPECTION_COMPLETED]: 'Inspection Completed',
  [REPAIR_STATUSES.REPAIR_ONGOING]: 'Repair Ongoing',
  [REPAIR_STATUSES.READY_FOR_PICKUP]: 'Car is Ready to be Picked Up'
}

export const STATUS_COLORS = {
  [REPAIR_STATUSES.NOT_STARTED]: 'bg-gray-100 text-gray-700',
  [REPAIR_STATUSES.UNDER_INSPECTION]: 'bg-blue-100 text-blue-700',
  [REPAIR_STATUSES.INSPECTION_COMPLETED]: 'bg-yellow-100 text-yellow-700',
  [REPAIR_STATUSES.REPAIR_ONGOING]: 'bg-orange-100 text-orange-700',
  [REPAIR_STATUSES.READY_FOR_PICKUP]: 'bg-green-100 text-green-700'
}

// Initial state
const initialState = {
  repairOrders: [],
  isLoadingOrders: false,
  orderError: null,
  statusCounts: {
    [REPAIR_STATUSES.NOT_STARTED]: 0,
    [REPAIR_STATUSES.UNDER_INSPECTION]: 0,
    [REPAIR_STATUSES.INSPECTION_COMPLETED]: 0,
    [REPAIR_STATUSES.REPAIR_ONGOING]: 0,
    [REPAIR_STATUSES.READY_FOR_PICKUP]: 0
  }
}

// Action types
const REPAIR_ORDER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_REPAIR_ORDERS: 'SET_REPAIR_ORDERS',
  SET_ERROR: 'SET_ERROR',
  UPDATE_STATUS_COUNTS: 'UPDATE_STATUS_COUNTS'
}

// Reducer
function repairOrderReducer(state, action) {
  switch (action.type) {
    case REPAIR_ORDER_ACTIONS.SET_LOADING:
      return { ...state, isLoadingOrders: action.payload }
    
    case REPAIR_ORDER_ACTIONS.SET_REPAIR_ORDERS:
      return { 
        ...state, 
        repairOrders: action.payload, 
        isLoadingOrders: false,
        orderError: null
      }
    
    case REPAIR_ORDER_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        orderError: action.payload,
        isLoadingOrders: false 
      }
    
    case REPAIR_ORDER_ACTIONS.UPDATE_STATUS_COUNTS:
      return { ...state, statusCounts: action.payload }
    
    default:
      return state
  }
}

// Provider component
export function RepairOrderProvider({ children }) {
  const [state, dispatch] = useReducer(repairOrderReducer, initialState)

  // Calculate status counts
  const calculateStatusCounts = (orders) => {
    const counts = {
      [REPAIR_STATUSES.NOT_STARTED]: 0,
      [REPAIR_STATUSES.UNDER_INSPECTION]: 0,
      [REPAIR_STATUSES.INSPECTION_COMPLETED]: 0,
      [REPAIR_STATUSES.REPAIR_ONGOING]: 0,
      [REPAIR_STATUSES.READY_FOR_PICKUP]: 0
    }

    orders.forEach(order => {
      if (counts.hasOwnProperty(order.repairStatus)) {
        counts[order.repairStatus]++
      }
    })

    dispatch({ type: REPAIR_ORDER_ACTIONS.UPDATE_STATUS_COUNTS, payload: counts })
  }

  // Load all repair orders from Firestore
  const loadRepairOrders = async () => {
    try {
      dispatch({ type: REPAIR_ORDER_ACTIONS.SET_LOADING, payload: true })
      
      const repairOrdersRef = collection(db, 'repair_orders')
      const q = query(repairOrdersRef, orderBy('dateCreated', 'desc'))
      
      console.log('🔧 Loading repair orders...')
      const querySnapshot = await getDocs(q)
      
      const orders = []
      querySnapshot.forEach((doc) => {
        const orderData = doc.data()
        orders.push({
          id: doc.id,
          ...orderData,
          dateCreated: orderData.dateCreated?.toDate ? orderData.dateCreated.toDate() : new Date(orderData.dateCreated || Date.now()),
          lastUpdated: orderData.lastUpdated?.toDate ? orderData.lastUpdated.toDate() : new Date(orderData.lastUpdated || Date.now())
        })
      })

      console.log('🔧 Repair orders loaded:', orders.length)
      dispatch({ type: REPAIR_ORDER_ACTIONS.SET_REPAIR_ORDERS, payload: orders })
      calculateStatusCounts(orders)
      
    } catch (error) {
      console.error('❌ Error loading repair orders:', error)
      dispatch({ type: REPAIR_ORDER_ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  // Set up real-time listener for repair orders (since mechanics update from external system)
  const setupRealtimeListener = () => {
    try {
      const repairOrdersRef = collection(db, 'repair_orders')
      const q = query(repairOrdersRef, orderBy('dateCreated', 'desc'))
      
      console.log('🔄 Setting up real-time listener for repair orders...')
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const orders = []
        querySnapshot.forEach((doc) => {
          const orderData = doc.data()
          orders.push({
            id: doc.id,
            ...orderData,
            dateCreated: orderData.dateCreated?.toDate ? orderData.dateCreated.toDate() : new Date(orderData.dateCreated || Date.now()),
            lastUpdated: orderData.lastUpdated?.toDate ? orderData.lastUpdated.toDate() : new Date(orderData.lastUpdated || Date.now())
          })
        })

        console.log('🔄 Real-time update - repair orders:', orders.length)
        dispatch({ type: REPAIR_ORDER_ACTIONS.SET_REPAIR_ORDERS, payload: orders })
        calculateStatusCounts(orders)
      }, (error) => {
        console.error('❌ Real-time listener error:', error)
        dispatch({ type: REPAIR_ORDER_ACTIONS.SET_ERROR, payload: error.message })
      })

      return unsubscribe
    } catch (error) {
      console.error('❌ Error setting up real-time listener:', error)
      dispatch({ type: REPAIR_ORDER_ACTIONS.SET_ERROR, payload: error.message })
      return null
    }
  }

  // Initialize on mount
  useEffect(() => {
    const unsubscribe = setupRealtimeListener()
    
    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Helper function to get orders by status
  const getOrdersByStatus = (status) => {
    return state.repairOrders.filter(order => order.repairStatus === status)
  }

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  const value = {
    ...state,
    loadRepairOrders,
    getOrdersByStatus,
    formatDate
  }

  return (
    <RepairOrderContext.Provider value={value}>
      {children}
    </RepairOrderContext.Provider>
  )
}

// Custom hook to use the context
export function useRepairOrder() {
  const context = useContext(RepairOrderContext)
  if (!context) {
    throw new Error('useRepairOrder must be used within a RepairOrderProvider')
  }
  return context
}