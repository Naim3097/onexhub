import { useState } from 'react'

function CustomerInvoiceCreationSimple({ setActiveSection }) {
  console.log('🚨 CustomerInvoiceCreationSimple component rendered')
  
  const [testMessage, setTestMessage] = useState('Component loaded successfully!')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customer Invoicing (Simple Test)</h2>
        <button
          onClick={() => setActiveSection('customers')}
          className="px-4 py-2 text-black-75 hover:text-primary-black"
        >
          Back to Customers
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Status Check</h3>
        <p className="text-primary-black mb-4">{testMessage}</p>
        
        <button 
          onClick={() => setTestMessage('Button clicked! Component is interactive.')}
          className="px-4 py-2 bg-primary-red text-primary-white rounded-lg"
        >
          Test Interaction
        </button>
        
        <div className="mt-4 p-3 bg-red-10 border border-primary-red rounded">
          <p className="text-sm text-primary-red">
            If you see this, the basic component structure is working. 
            The issue is likely with one of the imports or hooks in the full component.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CustomerInvoiceCreationSimple