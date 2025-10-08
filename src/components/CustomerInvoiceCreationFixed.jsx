import { useState, useEffect } from 'react'
import { useCustomer } from '../context/CustomerContext'
import { useTransaction } from '../context/TransactionContext'
import { createCustomerInvoice, getCustomerOrders } from '../utils/FirebaseDataUtils'
import { debugCustomerOrders } from '../utils/DebugCustomerOrders'

function CustomerInvoiceCreationFixed({ setActiveSection }) {
  console.log('🚨 CustomerInvoiceCreationFixed component rendered/re-rendered')
  
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerOrders, setCustomerOrders] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  const { customers, customerSelected } = useCustomer()
  const { recordPayment } = useTransaction()

  // Load customer orders when customer is selected
  useEffect(() => {
    console.log('🚨 useEffect triggered - customerSelected:', customerSelected)
    if (customerSelected) {
      console.log('🚨 Setting selected customer and loading orders...')
      setSelectedCustomer(customerSelected)
      loadCustomerOrders(customerSelected.id)
    }
  }, [customerSelected])

  const loadCustomerOrders = async (customerId) => {
    console.log('🚨 loadCustomerOrders called with customerId:', customerId)
    
    if (isLoadingOrders) {
      console.log('🚨 Already loading orders, skipping...')
      return
    }
    
    setIsLoadingOrders(true)
    setCustomerOrders([])
    
    try {
      console.log('🚨 Running debug analysis...')
      await debugCustomerOrders(customerId)
      
      console.log('🚨 About to call getCustomerOrders...')
      const orders = await getCustomerOrders(customerId)
      console.log('🚨 getCustomerOrders returned:', orders.length, 'parts')
      
      setCustomerOrders(orders)
      console.log('🚨 setCustomerOrders called - state should now have', orders.length, 'parts')
    } catch (error) {
      console.error('🚨 ERROR in loadCustomerOrders:', error)
    }
    setIsLoadingOrders(false)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0)
  }

  const selectCustomer = (customer) => {
    console.log('🚨 selectCustomer called with:', customer)
    setSelectedCustomer(customer)
    setShowCustomerModal(false)
    loadCustomerOrders(customer.id)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Create Customer Invoice (Fixed)</h2>
        <button
          onClick={() => setActiveSection('customers')}
          className="px-4 py-2 text-black-75 hover:text-primary-black"
        >
          Back to Customers
        </button>
      </div>

      {/* Customer Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
        
        {selectedCustomer ? (
          <div className="border p-4 rounded-lg bg-red-10">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">{selectedCustomer.name}</h4>
                <p className="text-black-75">{selectedCustomer.email}</p>
                <p className="text-black-75">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-primary-red hover:text-red-dark"
              >
                Change Customer
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="px-6 py-3 bg-primary-red text-primary-white rounded-lg hover:bg-red-dark"
            >
              Select Customer
            </button>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <>
          {/* Customer Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Customer Ordered Parts</h3>
            
            {isLoadingOrders ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
                <p className="mt-2 text-black-75">Loading customer orders...</p>
              </div>
            ) : customerOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-black-25">
                  <thead className="bg-black-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Part Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{order.part_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{order.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(order.unit_price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">
                          {formatCurrency(order.quantity * order.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold">
                    Parts Subtotal: {formatCurrency(customerOrders.reduce((sum, order) => sum + (order.quantity * order.unit_price), 0))}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-black-50">
                <p className="text-lg">No parts ordered by this customer yet</p>
                <p className="text-sm mt-2">You can still create an invoice with labor charges</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Select Customer</h3>
            
            <div className="space-y-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-black-10"
                >
                  <div className="font-semibold">{customer.name}</div>
                  <div className="text-sm text-black-75">{customer.email}</div>
                  <div className="text-sm text-black-75">{customer.phone}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 bg-black-25 text-primary-black rounded-lg hover:bg-black-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerInvoiceCreationFixed