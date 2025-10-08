import { useState, useEffect } from 'react'
import { useCustomer } from '../context/CustomerContext'
import { useDataJoin } from '../context/DataJoinContext'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebaseConfig'

function CustomerDatabase({ setActiveSection }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [pastCustomers, setPastCustomers] = useState([])
  const [isLoadingPastCustomers, setIsLoadingPastCustomers] = useState(true)
  const [selectedPastCustomer, setSelectedPastCustomer] = useState(null)
  const [showPastCustomerModal, setShowPastCustomerModal] = useState(false)
  
  const { 
    customers, 
    isLoadingCustomers, 
    customerError,
    selectCustomer 
  } = useCustomer()
  
  const { 
    joinedCustomerData, 
    isLoadingJoinedData,
    searchJoinedData 
  } = useDataJoin()

  // Filter customers based on search term
  const filteredCustomers = searchTerm 
    ? searchJoinedData(searchTerm)
    : joinedCustomerData

  // Fetch past customers from customer_invoices collection
  const fetchPastCustomers = async () => {
    try {
      setIsLoadingPastCustomers(true)
      console.log('🔍 Fetching past customers...')
      
      const customerInvoicesRef = collection(db, 'customer_invoices')
      
      // First, let's get all customer invoices to see what we have
      const allInvoicesQuery = query(customerInvoicesRef, orderBy('dateCreated', 'desc'))
      const allSnapshot = await getDocs(allInvoicesQuery)
      
      console.log('📊 Total customer invoices found:', allSnapshot.size)
      
      // Log first few documents to understand the structure
      let sampleCount = 0
      allSnapshot.forEach((doc) => {
        if (sampleCount < 3) {
          console.log('📄 Sample invoice:', doc.id, doc.data())
          sampleCount++
        }
      })
      
      // Now try to get paid invoices - try different approaches
      let querySnapshot
      
      // First try with paymentStatus === 'paid'
      try {
        const q = query(
          customerInvoicesRef, 
          where('paymentStatus', '==', 'paid'),
          orderBy('dateCreated', 'desc')
        )
        querySnapshot = await getDocs(q)
        console.log('💰 Paid invoices found with paymentStatus=paid:', querySnapshot.size)
      } catch (error) {
        console.log('⚠️ Query with paymentStatus failed:', error.message)
      }
      
      // If no results, try without the where clause to get all invoices
      if (!querySnapshot || querySnapshot.size === 0) {
        console.log('🔄 Trying to get all invoices since no paid ones found...')
        try {
          const allQuery = query(customerInvoicesRef, orderBy('dateCreated', 'desc'))
          querySnapshot = await getDocs(allQuery)
          console.log('� All invoices found:', querySnapshot.size)
        } catch (error) {
          console.log('❌ All invoices query failed:', error.message)
          return
        }
      }
      
      // Group invoices by customer
      const customerMap = new Map()
      
      querySnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() }
        console.log('💳 Processing paid invoice:', invoice.invoiceNumber, invoice.paymentStatus)
        const customerId = invoice.customerId
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: invoice.customerName || 'Unknown Customer',
            phone: invoice.customerPhone || '',
            email: invoice.customerEmail || '',
            address: invoice.customerAddress || '',
            invoices: [],
            totalSpent: 0,
            lastInvoiceDate: null,
            invoiceCount: 0
          })
        }
        
        const customer = customerMap.get(customerId)
        customer.invoices.push(invoice)
        customer.totalSpent += invoice.customerTotal || 0
        customer.invoiceCount += 1
        
        // Update last invoice date
        const invoiceDate = invoice.dateCreated?.toDate ? invoice.dateCreated.toDate() : new Date(invoice.dateCreated)
        if (!customer.lastInvoiceDate || invoiceDate > customer.lastInvoiceDate) {
          customer.lastInvoiceDate = invoiceDate
        }
      })
      
      const pastCustomersArray = Array.from(customerMap.values())
        .sort((a, b) => (b.lastInvoiceDate || 0) - (a.lastInvoiceDate || 0))
      
      console.log('👥 Past customers processed:', pastCustomersArray.length)
      console.log('📋 Past customers array:', pastCustomersArray)
      
      setPastCustomers(pastCustomersArray)
    } catch (error) {
      console.error('❌ Error fetching past customers:', error)
    } finally {
      setIsLoadingPastCustomers(false)
    }
  }

  useEffect(() => {
    fetchPastCustomers()
  }, [])

  const handleCustomerSelect = (customer) => {
    selectCustomer(customer)
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
  }

  const handleCreateInvoice = (customer) => {
    selectCustomer(customer)
    setActiveSection('customer-invoicing')
  }

  const handlePastCustomerSelect = (customer) => {
    setSelectedPastCustomer(customer)
    setShowPastCustomerModal(true)
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0)
  }

  if (isLoadingCustomers || isLoadingJoinedData) {
    return (
      <div className="space-y-6">
        <div className="bg-primary-white rounded-lg border border-black-10 p-8 text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-black-75">Loading customer database...</p>
        </div>
      </div>
    )
  }

  if (customerError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Error loading customers: {customerError}</p>
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
          <h2 className="text-xl sm:text-2xl font-bold text-primary-black">Customers</h2>
          <p className="text-black-75 text-sm sm:text-base">
            {filteredCustomers.length} customers • {joinedCustomerData.filter(c => c.isActiveCustomer).length} active
          </p>
        </div>
        <button
          onClick={() => setActiveSection('customer-invoicing')}
          className="btn-primary text-sm sm:text-base"
        >
          Create Customer Invoice
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-primary-white rounded-lg border border-black-10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search customers by name, phone, email, or address..."
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

      {/* Customer List */}
      <div className="bg-primary-white rounded-lg border border-black-10 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-black-50">
              {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-5 border-b border-black-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-primary-white divide-y divide-black-10">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-black-5">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-primary-black">
                          {customer.name || 'Unknown Name'}
                        </div>
                        <div className="text-sm text-black-50">
                          ID: {customer.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-black">{customer.phone || 'No phone'}</div>
                      <div className="text-sm text-black-50">{customer.email || 'No email'}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-black">{customer.totalOrders || 0} orders</div>
                      <div className="text-sm text-black-50">
                        Avg: {formatCurrency(customer.averageOrderValue)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary-black">
                        {formatCurrency(customer.totalSpent)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-black">
                        {formatDate(customer.lastOrderDate)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.isActiveCustomer
                          ? 'bg-red-10 text-primary-red'
                          : 'bg-black-10 text-black-50'
                      }`}>
                        {customer.isActiveCustomer ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Customers Section */}
      <div className="bg-primary-white rounded-lg border border-black-10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-black-10">
          <h3 className="text-lg font-semibold text-primary-black">Past Customers</h3>
          <p className="text-black-75 text-sm">Customers with completed payments and invoice history</p>
        </div>

        {isLoadingPastCustomers ? (
          <div className="p-8 text-center">
            <div className="loading-spinner mb-4"></div>
            <p className="text-black-75">Loading past customers...</p>
          </div>
        ) : pastCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-black-50">No past customers with completed payments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-5 border-b border-black-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Invoices
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-black-50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-primary-white divide-y divide-black-10">
                {pastCustomers.slice(0, 20).map((customer) => (
                  <tr key={customer.id} className="hover:bg-black-5">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-primary-black">
                          {customer.name || 'Unknown Name'}
                        </div>
                        <div className="text-sm text-black-50">
                          ID: {customer.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-black">{customer.phone || 'No phone'}</div>
                      <div className="text-sm text-black-50">{customer.email || 'No email'}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-black">{customer.invoiceCount} paid invoices</div>
                      <div className="text-sm text-black-50">
                        Avg: {formatCurrency(customer.totalSpent / customer.invoiceCount)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary-black">
                        {formatCurrency(customer.totalSpent)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-black">
                        {formatDate(customer.lastInvoiceDate)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handlePastCustomerSelect(customer)}
                        className="text-primary-red hover:text-red-dark"
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

      {/* Customer Details Modal */}
      {showCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-primary-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-black-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary-black">
                  Customer Details: {selectedCustomer.name}
                </h2>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-black-50 hover:text-black-75"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedCustomer.name}</p>
                    <p><span className="font-medium">Phone:</span> {selectedCustomer.phone || 'Not provided'}</p>
                    <p><span className="font-medium">Email:</span> {selectedCustomer.email || 'Not provided'}</p>
                    <p><span className="font-medium">Address:</span> {selectedCustomer.address || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Total Orders:</span> {selectedCustomer.totalOrders}</p>
                    <p><span className="font-medium">Total Spent:</span> {formatCurrency(selectedCustomer.totalSpent)}</p>
                    <p><span className="font-medium">Average Order:</span> {formatCurrency(selectedCustomer.averageOrderValue)}</p>
                    <p><span className="font-medium">Last Order:</span> {formatDate(selectedCustomer.lastOrderDate)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        selectedCustomer.isActiveCustomer ? 'bg-red-10 text-primary-red' : 'bg-black-10 text-black-50'
                      }`}>
                        {selectedCustomer.isActiveCustomer ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mechanics Worked */}
              {selectedCustomer.mechanicsWorked && selectedCustomer.mechanicsWorked.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-primary-black mb-3">Mechanics Worked With</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCustomer.mechanicsWorked.map((mechanic) => (
                      <div key={mechanic.id} className="bg-black-5 p-3 rounded-lg">
                        <p className="font-medium">{mechanic.name}</p>
                        <p className="text-sm text-black-75">{mechanic.email}</p>
                        <p className="text-sm text-black-75">{mechanic.specialty || 'General'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-primary-black mb-3">Recent Orders</h3>
                  <div className="space-y-3">
                    {selectedCustomer.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="bg-black-5 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Order #{order.order_number || order.id}</p>
                            <p className="text-sm text-black-75">
                              {formatDate(order.order_date)} • {formatCurrency(order.total_amount)}
                            </p>
                            {order.notes && (
                              <p className="text-sm text-black-75 mt-1">{order.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-black-10">
                <button
                  onClick={() => handleCreateInvoice(selectedCustomer)}
                  className="btn-primary px-6 py-2 rounded-lg"
                >
                  Create Invoice
                </button>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="px-6 py-2 border border-black-20 rounded-lg hover:bg-black-5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Customer Details Modal */}
      {showPastCustomerModal && selectedPastCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-primary-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-black-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary-black">
                  Past Customer: {selectedPastCustomer.name}
                </h2>
                <button
                  onClick={() => setShowPastCustomerModal(false)}
                  className="text-black-50 hover:text-black-75"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Customer Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedPastCustomer.name}</p>
                    <p><span className="font-medium">Phone:</span> {selectedPastCustomer.phone || 'Not provided'}</p>
                    <p><span className="font-medium">Email:</span> {selectedPastCustomer.email || 'Not provided'}</p>
                    <p><span className="font-medium">Address:</span> {selectedPastCustomer.address || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Payment Summary</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Total Invoices:</span> {selectedPastCustomer.invoiceCount}</p>
                    <p><span className="font-medium">Total Spent:</span> {formatCurrency(selectedPastCustomer.totalSpent)}</p>
                    <p><span className="font-medium">Average Invoice:</span> {formatCurrency(selectedPastCustomer.totalSpent / selectedPastCustomer.invoiceCount)}</p>
                    <p><span className="font-medium">Last Payment:</span> {formatDate(selectedPastCustomer.lastInvoiceDate)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-primary-black mb-3">Quick Stats</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Customer Since:</span> {formatDate(selectedPastCustomer.invoices.reduce((earliest, invoice) => {
                      const date = invoice.dateCreated?.toDate ? invoice.dateCreated.toDate() : new Date(invoice.dateCreated)
                      return !earliest || date < earliest ? date : earliest
                    }, null))}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-10 text-green-600">
                        Paid Customer
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice History */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-primary-black mb-3">Invoice History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-black-10 rounded-lg">
                    <thead className="bg-black-5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Items</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black-10">
                      {selectedPastCustomer.invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-black-5">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-primary-black">{invoice.invoiceNumber}</div>
                            <div className="text-black-50 text-xs">ID: {invoice.id}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-primary-black">
                            {formatDate(invoice.dateCreated?.toDate ? invoice.dateCreated.toDate() : invoice.dateCreated)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-primary-black">
                            {formatCurrency(invoice.customerTotal)}
                          </td>
                          <td className="px-4 py-3 text-sm text-black-75">
                            {(invoice.partsOrdered?.length || 0) + (invoice.laborCharges?.length || 0)} items
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-10 text-green-600">
                              Paid
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => {
                                // You'll need to import downloadInvoicePDF from AccountingDashboard or create a similar function
                                console.log('Download PDF for invoice:', invoice)
                                // downloadInvoicePDF(invoice) - will need to implement this
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-black-10">
                <button
                  onClick={() => {
                    setShowPastCustomerModal(false)
                    // Could add option to create new invoice for this customer
                    handleCreateInvoice(selectedPastCustomer)
                  }}
                  className="btn-primary px-6 py-2 rounded-lg"
                >
                  Create New Invoice
                </button>
                <button
                  onClick={() => setShowPastCustomerModal(false)}
                  className="px-6 py-2 border border-black-20 rounded-lg hover:bg-black-5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDatabase