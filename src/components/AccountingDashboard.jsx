import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, onSnapshot, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebaseConfig'

function AccountingDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false)
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null)
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: ''
  })

  // Direct Firestore state
  const [customerInvoices, setCustomerInvoices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load invoices from Firestore in real-time
  useEffect(() => {
    const invoicesRef = collection(db, 'customer_invoices')
    const invoicesQuery = query(invoicesRef, orderBy('dateCreated', 'desc'))
    
    const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateCreated: doc.data().dateCreated?.toDate?.() || new Date(doc.data().dateCreated),
        dueDate: doc.data().dueDate?.toDate?.() || new Date(doc.data().dueDate)
      }))
      
      console.log('📊 Accounting: Loaded invoices from Firestore:', invoices.length)
      setCustomerInvoices(invoices)
      setIsLoading(false)
    }, (error) => {
      console.error('❌ Error loading invoices:', error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const transactionsRef = collection(db, 'transactions')
        const transactionsQuery = query(transactionsRef, orderBy('paymentDate', 'desc'))
        const snapshot = await getDocs(transactionsQuery)
        
        const txns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          paymentDate: doc.data().paymentDate?.toDate?.() || new Date(doc.data().paymentDate)
        }))
        
        setTransactions(txns)
      } catch (error) {
        console.error('❌ Error loading transactions:', error)
      }
    }
    
    loadTransactions()
  }, [])

  // Calculate accounting summary
  const accountingSummary = {
    totalRevenue: customerInvoices.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
    totalPendingAmount: customerInvoices.filter(inv => inv.paymentStatus === 'pending').reduce((sum, inv) => sum + (inv.total || 0), 0),
    averageInvoiceValue: customerInvoices.length > 0 ? customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / customerInvoices.length : 0,
    invoiceCount: customerInvoices.length,
    paidInvoiceCount: customerInvoices.filter(inv => inv.paymentStatus === 'paid').length,
    pendingInvoiceCount: customerInvoices.filter(inv => inv.paymentStatus === 'pending').length
  }

  const pendingInvoices = customerInvoices.filter(inv => inv.paymentStatus === 'pending')
  const paidInvoices = customerInvoices.filter(inv => inv.paymentStatus === 'paid')

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedInvoice) return
    
    try {
      // Create transaction record
      const transactionData = {
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        customerId: selectedInvoice.customerId,
        customerName: selectedInvoice.customerName,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        paymentDate: Timestamp.now(),
        status: 'completed',
        transactionNumber: `TXN-${Date.now()}`
      }
      
      await addDoc(collection(db, 'transactions'), transactionData)
      
      // Update invoice payment status
      const invoiceRef = doc(db, 'customer_invoices', selectedInvoice.id)
      await updateDoc(invoiceRef, {
        paymentStatus: 'paid',
        paidAmount: paymentData.amount,
        paidDate: Timestamp.now()
      })
      
      // Reset and close modal
      setShowPaymentModal(false)
      setSelectedInvoice(null)
      setPaymentData({
        amount: 0,
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: ''
      })
      
      alert('Payment recorded successfully!')
      
      // Reload transactions
      const transactionsRef = collection(db, 'transactions')
      const transactionsQuery = query(transactionsRef, orderBy('paymentDate', 'desc'))
      const snapshot = await getDocs(transactionsQuery)
      const txns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate?.() || new Date(doc.data().paymentDate)
      }))
      setTransactions(txns)
      
    } catch (error) {
      console.error('❌ Error recording payment:', error)
      alert('Error recording payment: ' + error.message)
    }
  }

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice)
    setPaymentData({
      amount: invoice.total || 0,
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: ''
    })
    setShowPaymentModal(true)
  }

  const viewInvoice = (invoiceData) => {
    console.log('👁️ ACCOUNTING VIEW INVOICE CLICKED - Invoice data:', invoiceData)
    setSelectedInvoiceForView(invoiceData)
    setShowViewInvoiceModal(true)
  }

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
  }

  const handleEditInvoice = (invoice) => {
    // Store invoice data in localStorage for editing in Billing page
    localStorage.setItem('editInvoiceData', JSON.stringify(invoice))
    // Navigate to Billing page
    window.location.hash = '#billing'
  }



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-primary-white rounded-lg border border-black-10 p-8 text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-black-75">Loading accounting data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-black">Accounting Dashboard</h2>
          <p className="text-black-75 text-sm sm:text-base">
            Financial overview, payment tracking, and revenue monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-primary-white rounded-lg border border-black-10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black-50 text-sm uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-black">
                {formatCurrency(accountingSummary.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-red-10 rounded-full">
              <svg className="w-6 h-6 text-primary-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-black-50 mt-2">
            From {accountingSummary.paidInvoiceCount} paid invoices
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-primary-white rounded-lg border border-black-10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black-50 text-sm uppercase tracking-wide">Pending Payments</p>
              <p className="text-2xl font-bold text-primary-black">
                {formatCurrency(accountingSummary.totalPendingAmount)}
              </p>
            </div>
            <div className="p-3 bg-black-10 rounded-full">
              <svg className="w-6 h-6 text-black-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-black-50 mt-2">
            From {accountingSummary.pendingInvoiceCount} pending invoices
          </p>
        </div>

        {/* Average Invoice */}
        <div className="bg-primary-white rounded-lg border border-black-10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black-50 text-sm uppercase tracking-wide">Average Invoice</p>
              <p className="text-2xl font-bold text-primary-black">
                {formatCurrency(accountingSummary.averageInvoiceValue)}
              </p>
            </div>
            <div className="p-3 bg-black-10 rounded-full">
              <svg className="w-6 h-6 text-primary-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-black-50 mt-2">
            Per customer transaction
          </p>
        </div>

        {/* Total Invoices */}
        <div className="bg-primary-white rounded-lg border border-black-10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black-50 text-sm uppercase tracking-wide">Total Invoices</p>
              <p className="text-2xl font-bold text-primary-black">
                {accountingSummary.invoiceCount}
              </p>
            </div>
            <div className="p-3 bg-red-10 rounded-full">
              <svg className="w-6 h-6 text-primary-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-black-50 mt-2">
            All customer invoices
          </p>
        </div>
      </div>

      {/* Pending Invoices Section */}
      <div className="bg-primary-white rounded-lg border border-black-10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-black-10">
          <h3 className="text-lg font-semibold text-primary-black">Pending Invoices</h3>
          <p className="text-black-75 text-sm">Invoices awaiting payment</p>
        </div>

        {pendingInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-black-50">No pending invoices</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Mechanic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Days Overdue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-10">
                {pendingInvoices.map((invoice) => {
                  const dueDate = new Date(invoice.dueDate)
                  const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-black-5">
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium text-primary-black">{invoice.invoiceNumber}</div>
                        <div className="text-black-50">{formatDate(invoice.dateCreated)}</div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-primary-black">{invoice.customerName}</div>
                        <div className="text-black-50">{invoice.customerPhone}</div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-red-500 text-white rounded-full mr-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-primary-black font-medium text-xs">{invoice.mechanicName || 'Not Assigned'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-primary-black">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-4 py-4 text-sm text-primary-black">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {daysOverdue > 0 ? (
                          <span className="text-primary-red font-medium">{daysOverdue} days</span>
                        ) : (
                          <span className="text-primary-black">On time</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <button
                          onClick={() => openPaymentModal(invoice)}
                          className="text-primary-red hover:text-red-dark font-medium"
                          title="Record Payment"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-primary-white rounded-lg border border-black-10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-black-10">
          <h3 className="text-lg font-semibold text-primary-black">Recent Transactions</h3>
          <p className="text-black-75 text-sm">Latest payment activity</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-black-50">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Transaction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-10">
                {transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-black-5">
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium text-primary-black">{transaction.transactionNumber}</div>
                      <div className="text-black-50">{transaction.referenceNumber || 'No reference'}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-primary-black">
                      {transaction.customerName}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-primary-black">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-primary-black capitalize">
                      {transaction.paymentMethod}
                    </td>
                    <td className="px-4 py-4 text-sm text-primary-black">
                      {formatDate(transaction.paymentDate)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-10 text-primary-red">
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <button
                        onClick={() => openTransactionModal(transaction)}
                        className="text-primary-red hover:text-red-dark"
                        title="View Transaction Details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-primary-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-black-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary-black">Record Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-black-50 hover:text-black-75"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-black-75">Invoice: {selectedInvoice.invoiceNumber}</p>
                <p className="text-sm text-black-75">Customer: {selectedInvoice.customerName}</p>
                <p className="text-lg font-semibold text-primary-black">
                  Amount Due: {formatCurrency(selectedInvoice.total)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black-75 mb-1">Payment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black-75 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black-75 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                  placeholder="Check number, transaction ID, etc."
                  className="w-full px-3 py-2 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black-75 mb-1">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 rounded-lg flex-1"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2 border border-black-20 rounded-lg hover:bg-black-5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-primary-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-black-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary-black">Transaction Details</h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-black-50 hover:text-black-75"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Transaction Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Transaction Number:</span> {selectedTransaction.transactionNumber}</p>
                    <p><span className="font-medium">Reference Number:</span> {selectedTransaction.referenceNumber || 'Not provided'}</p>
                    <p><span className="font-medium">Amount:</span> {formatCurrency(selectedTransaction.amount)}</p>
                    <p><span className="font-medium">Payment Method:</span> <span className="capitalize">{selectedTransaction.paymentMethod}</span></p>
                    <p><span className="font-medium">Payment Date:</span> {formatDate(selectedTransaction.paymentDate)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-10 text-primary-red">
                        {selectedTransaction.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Customer:</span> {selectedTransaction.customerName}</p>
                    <p><span className="font-medium">Customer ID:</span> {selectedTransaction.customerId}</p>
                    {selectedTransaction.invoiceId && (
                      <p><span className="font-medium">Invoice ID:</span> {selectedTransaction.invoiceId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedTransaction.notes && (
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Notes</h3>
                  <div className="bg-black-5 p-3 rounded-lg">
                    <p className="text-black-75">{selectedTransaction.notes}</p>
                  </div>
                </div>
              )}

              {/* Related Invoice Details */}
              {selectedTransaction.invoiceId && (
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Related Invoice</h3>
                  <div className="bg-black-5 p-4 rounded-lg">
                    <p><span className="font-medium">Invoice ID:</span> {selectedTransaction.invoiceId}</p>
                    <p className="text-sm text-black-75 mt-2">
                      This payment was recorded for invoice #{selectedTransaction.invoiceId}
                    </p>
                    {/* Find and display related invoice if available */}
                    {(() => {
                      const relatedInvoice = customerInvoices.find(inv => inv.id === selectedTransaction.invoiceId)
                      if (relatedInvoice) {
                        return (
                          <div className="mt-3 space-y-1">
                            <p><span className="font-medium">Invoice Number:</span> {relatedInvoice.invoiceNumber}</p>
                            <p><span className="font-medium">Invoice Total:</span> {formatCurrency(relatedInvoice.total)}</p>
                            <p><span className="font-medium">Created:</span> {formatDate(relatedInvoice.dateCreated)}</p>
                            <p className="text-xs text-black-50 mt-1">
                              For detailed invoice management, visit the Invoice Management page in Billing section.
                            </p>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-black-10">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="px-6 py-2 border border-black-20 rounded-lg hover:bg-black-5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewInvoiceModal && selectedInvoiceForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-primary-black">Invoice Details</h3>
              <button
                onClick={() => setShowViewInvoiceModal(false)}
                className="text-black-50 hover:text-black-75"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Invoice Info */}
              <div>
                <h4 className="font-semibold text-primary-black mb-3">Invoice Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Invoice #:</span> {selectedInvoiceForView.invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {selectedInvoiceForView.dateCreated?.toLocaleDateString()}</p>
                  <p><span className="font-medium">Due Date:</span> {selectedInvoiceForView.dueDate?.toLocaleDateString()}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      selectedInvoiceForView.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      selectedInvoiceForView.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedInvoiceForView.paymentStatus?.charAt(0).toUpperCase() + selectedInvoiceForView.paymentStatus?.slice(1) || 'Draft'}
                    </span>
                  </p>
                  <p><span className="font-medium">Total Amount:</span> {formatCurrency(selectedInvoiceForView.total)}</p>
                </div>

                <h4 className="font-semibold text-primary-black mt-6 mb-3">Mechanic In-charge</h4>
                <div className="bg-red-10 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-red text-white rounded-full mr-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-primary-black">{selectedInvoiceForView.mechanicName || 'Not Assigned'}</div>
                      <div className="text-xs text-black-50 mt-1">{selectedInvoiceForView.mechanicRole || 'Technician'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Customer & Work Details */}
              <div>
                <h4 className="font-semibold text-primary-black mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedInvoiceForView.customerName}</p>
                  <p><span className="font-medium">Email:</span> {selectedInvoiceForView.customerEmail || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedInvoiceForView.customerPhone}</p>
                </div>

                {selectedInvoiceForView.workDescription && (
                  <>
                    <h4 className="font-semibold text-primary-black mt-6 mb-3">Work Description</h4>
                    <div className="bg-black-10 rounded-lg p-3">
                      <p className="text-sm text-black-75">{selectedInvoiceForView.workDescription}</p>
                    </div>
                  </>
                )}

                {selectedInvoiceForView.mechanicNotes && (
                  <>
                    <h4 className="font-semibold text-primary-black mt-4 mb-3">Mechanic Notes</h4>
                    <div className="bg-black-10 rounded-lg p-3">
                      <p className="text-sm text-black-75">{selectedInvoiceForView.mechanicNotes}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Parts and Labor Summary */}
            {(selectedInvoiceForView.partsOrdered?.length > 0 || selectedInvoiceForView.laborCharges?.length > 0) && (
              <div className="mt-6">
                <h4 className="font-semibold text-primary-black mb-3">Items & Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedInvoiceForView.partsOrdered?.length > 0 && (
                    <div>
                      <h5 className="font-medium text-black-75 mb-2">Parts Used</h5>
                      <div className="space-y-1">
                        {selectedInvoiceForView.partsOrdered.map((part, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{part.partName} (x{part.quantity})</span>
                            <span>{formatCurrency(part.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedInvoiceForView.laborCharges?.length > 0 && (
                    <div>
                      <h5 className="font-medium text-black-75 mb-2">Labor Charges</h5>
                      <div className="space-y-1">
                        {selectedInvoiceForView.laborCharges.map((charge, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{charge.description}</span>
                            <span>{formatCurrency(charge.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowViewInvoiceModal(false)}
                className="px-4 py-2 border border-black-25 text-black-75 rounded-lg hover:bg-black-10"
              >
                Close
              </button>
              {selectedInvoiceForView.paymentStatus === 'pending' && (
                <button
                  onClick={() => {
                    setShowViewInvoiceModal(false)
                    openPaymentModal(selectedInvoiceForView)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AccountingDashboard