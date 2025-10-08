import React from 'react'
import { useCustomer } from '../context/CustomerContext'
import { useTransaction } from '../context/TransactionContext'

function ContextDebugger() {
  console.log('ContextDebugger: Component rendered')
  
  let customerContext = null
  let transactionContext = null
  let customerError = null
  let transactionError = null

  try {
    customerContext = useCustomer()
    console.log('ContextDebugger: Customer context loaded', customerContext)
  } catch (error) {
    customerError = error
    console.error('ContextDebugger: Customer context error', error)
  }

  try {
    transactionContext = useTransaction()
    console.log('ContextDebugger: Transaction context loaded', transactionContext)
  } catch (error) {
    transactionError = error
    console.error('ContextDebugger: Transaction context error', error)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Context Debugger</h2>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h3 className="font-bold">Customer Context</h3>
          {customerError ? (
            <div className="text-primary-red">
              <p>Error: {customerError.message}</p>
              <pre className="text-xs mt-2">{customerError.stack}</pre>
            </div>
          ) : customerContext ? (
            <div className="text-primary-red">
              <p>✓ Loaded successfully</p>
              <p>Customers count: {customerContext.customers?.length || 0}</p>
              <p>Selected customer: {customerContext.selectedCustomer?.name || 'None'}</p>
            </div>
          ) : (
            <p className="text-black-75">Loading...</p>
          )}
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold">Transaction Context</h3>
          {transactionError ? (
            <div className="text-primary-red">
              <p>Error: {transactionError.message}</p>
              <pre className="text-xs mt-2">{transactionError.stack}</pre>
            </div>
          ) : transactionContext ? (
            <div className="text-primary-red">
              <p>✓ Loaded successfully</p>
              <p>Transactions count: {transactionContext.transactions?.length || 0}</p>
              <p>Customer invoices count: {transactionContext.customerInvoices?.length || 0}</p>
            </div>
          ) : (
            <p className="text-black-75">Loading...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContextDebugger