import { useState, useEffect } from 'react'
import { useCustomer } from '../context/CustomerContext'
import { useTransaction } from '../context/TransactionContext'

function CustomerInvoiceCreationDebug({ setActiveSection }) {
  console.log('🚨 CustomerInvoiceCreationDebug component rendered')
  
  const [testMessage, setTestMessage] = useState('Component loaded successfully!')
  
  // Test the context hooks
  let customerContextStatus = 'Not tested'
  let transactionContextStatus = 'Not tested'
  
  try {
    const { customers, customerSelected } = useCustomer()
    customerContextStatus = `✅ Working - ${customers?.length || 0} customers`
    console.log('🚨 Customer context loaded:', { customersCount: customers?.length, customerSelected })
  } catch (error) {
    customerContextStatus = `❌ Error: ${error.message}`
    console.error('🚨 Customer context error:', error)
  }
  
  try {
    const { recordPayment } = useTransaction()
    transactionContextStatus = '✅ Working - recordPayment available'
    console.log('🚨 Transaction context loaded:', { recordPayment: !!recordPayment })
  } catch (error) {
    transactionContextStatus = `❌ Error: ${error.message}`
    console.error('🚨 Transaction context error:', error)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customer Invoicing (Debug Test)</h2>
        <button
          onClick={() => setActiveSection('customers')}
          className="px-4 py-2 text-black-75 hover:text-primary-black"
        >
          Back to Customers
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Context Status Check</h3>
        
        <div className="space-y-4">
          <div className="p-3 border rounded">
            <h4 className="font-medium">Customer Context</h4>
            <p className="text-sm">{customerContextStatus}</p>
          </div>
          
          <div className="p-3 border rounded">
            <h4 className="font-medium">Transaction Context</h4>
            <p className="text-sm">{transactionContextStatus}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setTestMessage('Button clicked! Contexts are working.')}
          className="mt-4 px-4 py-2 bg-primary-red text-primary-white rounded-lg"
        >
          Test Interaction
        </button>
        
        <div className="mt-4 p-3 bg-red-10 border border-primary-red rounded">
          <p className="text-sm text-primary-red">
            Testing context hooks. If you see errors above, that's the issue.
          </p>
          <p className="text-sm text-primary-black mt-2">{testMessage}</p>
        </div>
      </div>
    </div>
  )
}

export default CustomerInvoiceCreationDebug