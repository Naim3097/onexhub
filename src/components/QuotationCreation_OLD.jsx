import { useState, useEffect } from 'react'
import { useCustomer } from '../context/CustomerContext'
import { addDoc, collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import PDFGenerator from '../utils/PDFGenerator'

function QuotationCreation({ setActiveSection }) {
  console.log('🚨 QuotationCreation component rendered/re-rendered')
  
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [manualParts, setManualParts] = useState([])
  const [newPart, setNewPart] = useState({
    sku: '',
    partName: '',
    price: 0,
    quantity: 1
  })
  const [laborCharges, setLaborCharges] = useState([])
  const [newLaborCharge, setNewLaborCharge] = useState({
    description: '',
    amount: 0,
    hours: 0
  })
  const [quotationMetadata, setQuotationMetadata] = useState({
    workDescription: '',
    notes: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    terms: 'Quote valid for 30 days. Prices subject to change.'
  })
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false)
  const [createdQuotation, setCreatedQuotation] = useState(null)
  const [showQuotationSuccess, setShowQuotationSuccess] = useState(false)
  
  // Quotation Management States
  const [viewMode, setViewMode] = useState('create') // 'create', 'list'
  const [quotationHistory, setQuotationHistory] = useState([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false)
  const [quotationError, setQuotationError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'pending', 'accepted', 'rejected'

  const { customers, customerSelected } = useCustomer()

  // Set customer when selected from context
  useEffect(() => {
    console.log('🚨 useEffect triggered - customerSelected:', customerSelected)
    if (customerSelected) {
      console.log('🚨 Setting selected customer...')
      setSelectedCustomer(customerSelected)
    }
  }, [customerSelected])

  // Load quotation history from Firestore
  useEffect(() => {
    console.log('🚀 Setting up quotations collection listener...')
    setIsLoadingQuotations(true)
    
    try {
      const quotationsRef = collection(db, 'quotations')
      const quotationsQuery = query(quotationsRef, orderBy('createdAt', 'desc'))
      
      const unsubscribe = onSnapshot(quotationsQuery, (snapshot) => {
        console.log('📊 Quotations data received:', snapshot.size, 'documents')
        
        const quotations = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          quotations.push({
            id: doc.id,
            ...data,
            // Ensure dates are properly formatted
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            validUntil: data.validUntil?.toDate ? data.validUntil.toDate() : new Date(data.validUntil)
          })
        })
        
        setQuotationHistory(quotations)
        setIsLoadingQuotations(false)
        setQuotationError(null)
        
        console.log('✅ Quotations data processed:', quotations.length, 'records')
      }, (error) => {
        console.error('❌ Error loading quotations:', error)
        setQuotationError(error.message)
        setIsLoadingQuotations(false)
      })
      
      return () => {
        console.log('🔌 Disconnecting from quotations collection')
        unsubscribe()
      }
    } catch (error) {
      console.error('❌ Error setting up quotations listener:', error)
      setQuotationError(error.message)
      setIsLoadingQuotations(false)
    }
  }, [])

  // Add manual part function
  const addManualPart = () => {
    if (!newPart.sku || !newPart.partName || newPart.price <= 0 || newPart.quantity <= 0) {
      alert('Please fill in all part details with valid values')
      return
    }

    const part = {
      id: Date.now(),
      ...newPart,
      total: newPart.price * newPart.quantity
    }

    setManualParts([...manualParts, part])
    setNewPart({
      sku: '',
      partName: '',
      price: 0,
      quantity: 1
    })
  }

  // Remove manual part function
  const removeManualPart = (partId) => {
    setManualParts(manualParts.filter(part => part.id !== partId))
  }

  const addLaborCharge = () => {
    if (!newLaborCharge.description || newLaborCharge.amount <= 0) {
      alert('Please enter description and amount for labor charge')
      return
    }

    const laborCharge = {
      id: Date.now(),
      ...newLaborCharge,
      type: 'labor'
    }

    setLaborCharges([...laborCharges, laborCharge])
    setNewLaborCharge({
      description: '',
      amount: 0,
      hours: 0
    })
  }

  const removeLaborCharge = (chargeId) => {
    setLaborCharges(laborCharges.filter(charge => charge.id !== chargeId))
  }

  const calculateTotals = () => {
    // Calculate parts total (from manually added parts)
    const partsSubtotal = manualParts.reduce((sum, part) => {
      return sum + (part.quantity * part.price)
    }, 0)
    
    // Calculate labor total
    const laborSubtotal = laborCharges.reduce((sum, charge) => sum + charge.amount, 0)
    
    // Combined subtotal (total before tax)
    const subtotal = partsSubtotal + laborSubtotal
    const tax = subtotal * 0.06 // 6% SST (Sales and Service Tax) for Malaysia
    const total = subtotal + tax
    
    return { 
      partsSubtotal, 
      laborSubtotal, 
      subtotal, 
      tax, 
      total
    }
  }

  const createQuotation = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer')
      return
    }
    
    if (manualParts.length === 0 && laborCharges.length === 0) {
      alert('Please add parts or labor charges to create a quotation')
      return
    }

    setIsCreatingQuotation(true)
    
    try {
      const totals = calculateTotals()
      
      console.log('📊 Creating quotation with totals:', totals)
      console.log('🏢 Selected customer:', selectedCustomer)
      console.log('📦 Manual parts:', manualParts)
      console.log('⚡ Labor charges:', laborCharges)
      
      const quotationData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || '',
        customerPhone: selectedCustomer.phone || '',
        
        // Parts from manual entry
        partsQuoted: manualParts.map(part => ({
          sku: part.sku,
          partName: part.partName,
          quantity: part.quantity,
          unitPrice: part.price,
          total: part.quantity * part.price,
          partId: part.id
        })),
        
        // Labor charges
        laborCharges: laborCharges,
        
        // Totals (no commission for quotations)
        partsSubtotal: totals.partsSubtotal || 0,
        laborSubtotal: totals.laborSubtotal || 0,
        subtotal: totals.subtotal || 0,
        tax: totals.tax || 0,
        total: totals.total || 0,
        
        // Quotation-specific metadata
        workDescription: quotationMetadata.workDescription || '',
        notes: quotationMetadata.notes || '',
        validUntil: new Date(quotationMetadata.validUntil),
        terms: quotationMetadata.terms || 'Quote valid for 30 days. Prices subject to change.',
        
        // Status and tracking
        status: 'pending', // pending, accepted, rejected, expired
        quotationNumber: `QUO-${Date.now()}`,
        createdAt: new Date(),
        createdBy: 'current-user',
        type: 'quotation'
      }

      console.log('💾 Quotation data being saved:', quotationData)
      
      const quotationId = await addDoc(collection(db, 'quotations'), quotationData)
      console.log('✅ Quotation created with ID:', quotationId.id)
      
      // Store the created quotation data for PDF generation
      const createdQuotationData = {
        id: quotationId.id,
        ...quotationData,
        customerInfo: {
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
          address: selectedCustomer.address || ''
        },
        items: [
          ...manualParts.map(part => ({
            kodProduk: part.sku,
            namaProduk: part.partName,
            quantity: part.quantity,
            finalPrice: part.price,
            totalPrice: part.quantity * part.price
          })),
          ...laborCharges.map(charge => ({
            kodProduk: 'LABOR',
            namaProduk: charge.description,
            quantity: charge.hours || 1,
            finalPrice: charge.amount,
            totalPrice: charge.amount
          }))
        ],
        totalAmount: totals.total,
        dateCreated: new Date()
      }
      
      setCreatedQuotation(createdQuotationData)
      setShowQuotationSuccess(true)
      
    } catch (error) {
      console.error('❌ Error creating quotation:', error)
      console.error('❌ Error details:', error.message)
      console.error('❌ Error stack:', error.stack)
      alert(`Failed to create quotation: ${error.message || 'Unknown error'}. Please check console for details and try again.`)
    }
    
    setIsCreatingQuotation(false)
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
    setCustomerSearchTerm('') // Clear search when customer is selected
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  const downloadQuotation = (quotationData = null) => {
    const quotationToDownload = quotationData || createdQuotation
    
    if (quotationToDownload) {
      console.log('📄 Generating quotation PDF for:', quotationToDownload.quotationNumber)
      
      try {
        // Prepare quotation data for PDF generation
        const pdfData = {
          ...quotationToDownload,
          invoiceNumber: quotationToDownload.quotationNumber,
          isQuotation: true,
          type: 'quotation',
          documentTitle: 'QUOTATION',
          // Format items for PDF
          items: [
            ...(quotationToDownload.partsQuoted || []).map(part => ({
              kodProduk: part.sku,
              namaProduk: part.partName,
              quantity: part.quantity,
              finalPrice: part.unitPrice,
              totalPrice: part.total
            })),
            ...(quotationToDownload.laborCharges || []).map(charge => ({
              kodProduk: 'LABOR',
              namaProduk: charge.description,
              quantity: charge.hours || 1,
              finalPrice: charge.amount,
              totalPrice: charge.amount
            }))
          ],
          totalAmount: quotationToDownload.total,
          dateCreated: quotationToDownload.createdAt || new Date(),
          validUntil: quotationToDownload.validUntil,
          terms: quotationToDownload.terms,
          notes: quotationToDownload.notes,
          workDescription: quotationToDownload.workDescription
        }
        
        PDFGenerator.downloadCustomerInvoicePDF(pdfData)
        console.log('✅ Quotation PDF generated successfully')
      } catch (error) {
        console.error('❌ Error generating quotation PDF:', error)
        alert('Failed to generate PDF. Please try again.')
      }
    }
  }

  const updateQuotationStatus = async (quotationId, newStatus) => {
    try {
      console.log('📝 Updating quotation status:', quotationId, 'to', newStatus)
      
      const quotationRef = doc(db, 'quotations', quotationId)
      await updateDoc(quotationRef, {
        status: newStatus,
        lastUpdated: new Date()
      })
      
      console.log('✅ Quotation status updated successfully')
    } catch (error) {
      console.error('❌ Error updating quotation status:', error)
      alert('Failed to update quotation status')
    }
  }

  const handleQuotationSuccess = (action) => {
    // Reset form
    setSelectedCustomer(null)
    setManualParts([])
    setLaborCharges([])
    setNewPart({
      sku: '',
      partName: '',
      price: 0,
      quantity: 1
    })
    setQuotationMetadata({
      workDescription: '',
      notes: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      terms: 'Quote valid for 30 days. Prices subject to change.'
    })
    setCreatedQuotation(null)
    setShowQuotationSuccess(false)
    
    // Navigate based on action
    if (action === 'billing') {
      setActiveSection('customer-invoicing')
    } else {
      setActiveSection('customers')
    }
  }

  const totals = calculateTotals()

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFilteredQuotations = () => {
    let filtered = quotationHistory
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quotation => quotation.status === statusFilter)
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(quotation =>
        quotation.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quotation.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quotation.workDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {viewMode === 'create' ? 'Create Customer Quotation' : 'Quotation Management'}
          </h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('create')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Create New
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              View History ({quotationHistory.length})
            </button>
          </div>
        </div>
        <button
          onClick={() => setActiveSection('customers')}
          className="px-4 py-2 text-black-75 hover:text-primary-black"
        >
          Back to Customers
        </button>
      </div>

      {/* Quotation History View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search quotations by customer, number, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-black-25 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => {setSearchQuery(''); setStatusFilter('all')}}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Quotation List */}
          <div className="bg-primary-white rounded-lg border border-black-10 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-black-10">
              <h3 className="text-lg font-semibold text-primary-black">Quotation History</h3>
              <p className="text-black-75 text-sm">Manage and download existing quotations</p>
            </div>

            {isLoadingQuotations ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mb-4"></div>
                <p className="text-black-50">Loading quotations...</p>
              </div>
            ) : quotationError ? (
              <div className="p-8 text-center">
                <p className="text-primary-red">Error: {quotationError}</p>
              </div>
            ) : getFilteredQuotations().length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-black-50">
                  {searchQuery ? 'No quotations match your search.' : 'No quotations found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black-5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Quotation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Valid Until</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black-10">
                    {getFilteredQuotations().map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-black-5">
                        <td className="px-4 py-4 text-sm">
                          <div className="font-medium text-primary-black">{quotation.quotationNumber}</div>
                          <div className="text-black-50">{formatDate(quotation.createdAt)}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="text-primary-black">{quotation.customerName}</div>
                          <div className="text-black-50">{quotation.partsQuoted?.length || 0} parts, {quotation.laborCharges?.length || 0} labor</div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-primary-black">
                          {formatCurrency(quotation.total)}
                        </td>
                        <td className="px-4 py-4 text-sm text-primary-black">
                          {formatDate(quotation.validUntil)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            quotation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-black-10 text-black-75'
                          }`}>
                            {quotation.status?.charAt(0).toUpperCase() + quotation.status?.slice(1) || 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => downloadQuotation(quotation)}
                              className="text-primary-red hover:text-red-dark font-medium"
                              title="Download PDF"
                            >
                              Download
                            </button>
                            {quotation.status === 'pending' && (
                              <>
                                <span className="text-black-25">|</span>
                                <button
                                  onClick={() => updateQuotationStatus(quotation.id, 'accepted')}
                                  className="text-green-600 hover:text-green-800 font-medium"
                                  title="Accept Quotation"
                                >
                                  Accept
                                </button>
                                <span className="text-black-25">|</span>
                                <button
                                  onClick={() => updateQuotationStatus(quotation.id, 'rejected')}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                  title="Reject Quotation"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Quotation View */}
      {viewMode === 'create' && (
        <div>

      {/* Customer Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
        
        {selectedCustomer ? (
          <div className="border p-4 rounded-lg bg-blue-10">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">{selectedCustomer.name}</h4>
                <p className="text-black-75">{selectedCustomer.email}</p>
                <p className="text-black-75">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                Change Customer
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="px-6 py-3 bg-blue-600 text-primary-white rounded-lg hover:bg-blue-700"
            >
              Select Customer
            </button>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <>
          {/* Manual Parts Entry */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Parts & Components</h3>
            <p className="text-sm text-black-75 mb-4">Add parts for this quotation</p>
            
            {/* Add Part Form */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">SKU Code</label>
                <input
                  type="text"
                  value={newPart.sku}
                  onChange={(e) => setNewPart({ ...newPart, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="e.g., BRK001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Part Name</label>
                <input
                  type="text"
                  value={newPart.partName}
                  onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="e.g., Brake Pad Set"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Price (RM)</label>
                <input
                  type="number"
                  value={newPart.price}
                  onChange={(e) => setNewPart({ ...newPart, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Quantity</label>
                <input
                  type="number"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="1"
                  min="1"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addManualPart}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Part
                </button>
              </div>
            </div>

            {/* Parts List */}
            {manualParts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-black-25">
                  <thead className="bg-black-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Part Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black-75 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {manualParts.map((part) => (
                      <tr key={part.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{part.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{part.partName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{part.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(part.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">
                          {formatCurrency(part.quantity * part.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => removeManualPart(part.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold">
                    Parts Subtotal: {formatCurrency(totals.partsSubtotal)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-black-50">
                <p className="text-lg">No parts added yet</p>
                <p className="text-sm mt-2">Use the form above to add parts for this quotation</p>
              </div>
            )}
          </div>

          {/* Labor Charges */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Labor Charges</h3>
            <p className="text-sm text-black-75 mb-4">Add estimated work costs for this quotation</p>
            
            {/* Add Labor Charge Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Work Description</label>
                <input
                  type="text"
                  value={newLaborCharge.description}
                  onChange={(e) => setNewLaborCharge({ ...newLaborCharge, description: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="e.g., Engine repair, Oil change"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Amount (RM)</label>
                <input
                  type="number"
                  value={newLaborCharge.amount}
                  onChange={(e) => setNewLaborCharge({ ...newLaborCharge, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Hours (Optional)</label>
                <input
                  type="number"
                  value={newLaborCharge.hours}
                  onChange={(e) => setNewLaborCharge({ ...newLaborCharge, hours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addLaborCharge}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Labor
                </button>
              </div>
            </div>

            {/* Labor Charges List */}
            {laborCharges.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-black-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {laborCharges.map((charge) => (
                      <tr key={charge.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{charge.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{charge.hours || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">{formatCurrency(charge.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => removeLaborCharge(charge.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold">
                    Labor Subtotal: {formatCurrency(totals.laborSubtotal)}
                  </p>
                </div>
              </div>
            )}

            {laborCharges.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No labor charges added yet</p>
              </div>
            )}
          </div>

          {/* Quotation Totals */}
          {(manualParts.length > 0 || laborCharges.length > 0) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Quotation Summary</h3>
              
              <div className="space-y-2">
                {manualParts.length > 0 && (
                  <div className="flex justify-between">
                    <span>Parts Subtotal:</span>
                    <span>{formatCurrency(totals.partsSubtotal)}</span>
                  </div>
                )}
                {laborCharges.length > 0 && (
                  <div className="flex justify-between">
                    <span>Labor Subtotal:</span>
                    <span>{formatCurrency(totals.laborSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SST (6%):</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total Estimated Cost:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quotation Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Quotation Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Work Description</label>
                <textarea
                  value={quotationMetadata.workDescription}
                  onChange={(e) => setQuotationMetadata({ ...quotationMetadata, workDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="Describe the proposed work..."
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Additional Notes</label>
                <textarea
                  value={quotationMetadata.notes}
                  onChange={(e) => setQuotationMetadata({ ...quotationMetadata, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="Any additional notes for the customer..."
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Valid Until</label>
                <input
                  type="date"
                  value={quotationMetadata.validUntil}
                  onChange={(e) => setQuotationMetadata({ ...quotationMetadata, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-1">Terms & Conditions</label>
                <textarea
                  value={quotationMetadata.terms}
                  onChange={(e) => setQuotationMetadata({ ...quotationMetadata, terms: e.target.value })}
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                  placeholder="Terms and conditions..."
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Create Quotation Button */}
          <div className="text-center">
            <button
              onClick={createQuotation}
              disabled={isCreatingQuotation || (manualParts.length === 0 && laborCharges.length === 0)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-black-25 disabled:cursor-not-allowed"
            >
              {isCreatingQuotation ? 'Creating Quotation...' : 'Create Quotation'}
            </button>
            {manualParts.length === 0 && laborCharges.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Add parts or labor charges to create a quotation
              </p>
            )}
          </div>
        </>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Select Customer</h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Customer List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-black-10"
                  >
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No customers found matching "{customerSearchTerm}"</p>
                </div>
              )}
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

      {/* Quotation Success Modal */}
      {showQuotationSuccess && createdQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-primary-black mb-2">Quotation Created Successfully!</h3>
              <p className="text-sm text-black-75 mb-2">Quotation #{createdQuotation.quotationNumber}</p>
              <p className="text-sm text-black-75 mb-4">
                Total: {formatCurrency(createdQuotation.totalAmount)}
              </p>
              <p className="text-sm text-black-50 mb-6">
                The quotation has been saved and is ready to share with the customer.
              </p>

              <div className="space-y-3">
                {/* Download Quotation PDF Button */}
                <button
                  onClick={() => downloadQuotation()}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Quotation PDF
                </button>
                
                {/* Create Invoice Button */}
                <button
                  onClick={() => handleQuotationSuccess('billing')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Create Invoice from Quote
                </button>

                {/* Continue Button */}
                <button
                  onClick={() => handleQuotationSuccess('continue')}
                  className="w-full px-4 py-2 border border-black-25 text-primary-black rounded-lg hover:bg-black-10"
                >
                  Back to Customer Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}

export default QuotationCreation