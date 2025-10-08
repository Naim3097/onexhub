import { useState, useEffect } from 'react'
import { useCustomer } from '../context/CustomerContext'
import { useTransaction } from '../context/TransactionContext'

// Test Firebase imports one by one
let firebaseImportStatus = {
  createCustomerInvoice: 'Not tested',
  getCustomerOrders: 'Not tested',
  debugCustomerOrders: 'Not tested'
}

try {
  const { createCustomerInvoice, getCustomerOrders } = require('../utils/FirebaseDataUtils')
  firebaseImportStatus.createCustomerInvoice = '✅ Imported successfully'
  firebaseImportStatus.getCustomerOrders = '✅ Imported successfully'
} catch (error) {
  firebaseImportStatus.createCustomerInvoice = `❌ Error: ${error.message}`
  firebaseImportStatus.getCustomerOrders = `❌ Error: ${error.message}`
}

try {
  const { debugCustomerOrders } = require('../utils/DebugCustomerOrders')
  firebaseImportStatus.debugCustomerOrders = '✅ Imported successfully'
} catch (error) {
  firebaseImportStatus.debugCustomerOrders = `❌ Error: ${error.message}`
}

function CustomerInvoiceCreationFirebaseTest({ setActiveSection }) {
  console.log('🚨 CustomerInvoiceCreationFirebaseTest component rendered')
  console.log('🚨 Firebase import status:', firebaseImportStatus)
  
  const [testMessage, setTestMessage] = useState('Component loaded successfully!')
  
  // Test the context hooks
  const { customers, customerSelected } = useCustomer()
  const { recordPayment } = useTransaction()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customer Invoicing (Firebase Test)</h2>
        <button
          onClick={() => setActiveSection('customers')}
          className="px-4 py-2 text-black-75 hover:text-primary-black"
        >
          Back to Customers
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Firebase Import Status</h3>
        
        <div className="space-y-4">
          <div className="p-3 border rounded">
            <h4 className="font-medium">createCustomerInvoice</h4>
            <p className="text-sm">{firebaseImportStatus.createCustomerInvoice}</p>
          </div>
          
          <div className="p-3 border rounded">
            <h4 className="font-medium">getCustomerOrders</h4>
            <p className="text-sm">{firebaseImportStatus.getCustomerOrders}</p>
          </div>
          
          <div className="p-3 border rounded">
            <h4 className="font-medium">debugCustomerOrders</h4>
            <p className="text-sm">{firebaseImportStatus.debugCustomerOrders}</p>
          </div>

          <div className="p-3 border rounded">
            <h4 className="font-medium">Customer Context Status</h4>
            <p className="text-sm">✅ Working - {customers?.length || 0} customers, Selected: {customerSelected?.name || 'None'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setTestMessage('All imports tested!')}
          className="mt-4 px-4 py-2 bg-primary-red text-primary-white rounded-lg"
        >
          Test All Imports
        </button>
        
        <div className="mt-4 p-3 bg-red-10 border border-primary-red rounded">
          <p className="text-sm text-primary-red">
            Testing Firebase utility imports. If you see errors above, that's the issue.
          </p>
          <p className="text-sm text-primary-black mt-2">{testMessage}</p>
        </div>
      </div>
    </div>
  )
}

export default CustomerInvoiceCreationFirebaseTest