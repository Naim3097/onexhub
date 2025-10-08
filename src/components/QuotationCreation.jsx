import React, { useState, useEffect } from 'react'
import { useCustomer } from '../context/CustomerContext'
import { createQuotation, updateQuotation } from '../utils/FirebaseDataUtils'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import PDFGenerator from '../utils/PDFGenerator'

function QuotationCreation({ setActiveSection }) {
  console.log('🔍 QuotationCreation component mounting...')
  
  const [viewMode, setViewMode] = useState('list') // 'list' or 'create'
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showViewQuotationModal, setShowViewQuotationModal] = useState(false)
  const [selectedQuotationForView, setSelectedQuotationForView] = useState(null)
  const [showEditQuotationModal, setShowEditQuotationModal] = useState(false)
  const [selectedQuotationForEdit, setSelectedQuotationForEdit] = useState(null)
  
  // Quotation form states
  const [manualParts, setManualParts] = useState([])
  const [laborCharges, setLaborCharges] = useState([])
  const [workDescription, setWorkDescription] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState({ make: '', model: '', year: '', plate: '' })
  const [validityDays, setValidityDays] = useState(30)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('Quote valid for 30 days. Prices subject to change.')
  
  const [quotationHistory, setQuotationHistory] = useState([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSaving, setIsSaving] = useState(false)

  const { customers = [] } = useCustomer() || {}

  console.log('📊 Context data loaded:', { 
    customersCount: customers?.length
  })

  // Load quotation history
  useEffect(() => {
    setIsLoadingQuotations(true)
    try {
      const quotationsQuery = query(
        collection(db, 'quotations'),
        orderBy('dateCreated', 'desc')
      )
      
      const unsubscribe = onSnapshot(quotationsQuery, (snapshot) => {
        const quotations = []
        snapshot.forEach((doc) => {
          quotations.push({
            id: doc.id,
            ...doc.data(),
            dateCreated: doc.data().dateCreated?.toDate() || new Date(),
            validUntil: doc.data().validUntil?.toDate() || new Date()
          })
        })
        setQuotationHistory(quotations)
        setIsLoadingQuotations(false)
        console.log('✅ Loaded quotations:', quotations.length)
      })
      
      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading quotations:', error)
      setIsLoadingQuotations(false)
    }
  }, [])

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

  // Manual parts functions
  const addManualPart = () => {
    setManualParts([...manualParts, {
      sku: '',
      partName: '',
      quantity: 1,
      pricePerUnit: 0,
      total: 0
    }])
  }

  const updateManualPart = (index, field, value) => {
    const updated = [...manualParts]
    updated[index][field] = value
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'pricePerUnit') {
      updated[index].total = updated[index].quantity * updated[index].pricePerUnit
    }
    
    setManualParts(updated)
  }

  const removeManualPart = (index) => {
    setManualParts(manualParts.filter((_, i) => i !== index))
  }

  // Labor charges functions
  const addLaborCharge = () => {
    setLaborCharges([...laborCharges, {
      sku: '',
      description: '',
      amount: 0
    }])
  }

  const updateLaborCharge = (index, field, value) => {
    const updated = [...laborCharges]
    updated[index][field] = value
    setLaborCharges(updated)
  }

  const removeLaborCharge = (index) => {
    setLaborCharges(laborCharges.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const partsTotal = manualParts.reduce((sum, part) => sum + (part.total || 0), 0)
    const laborTotal = laborCharges.reduce((sum, labor) => sum + (labor.amount || 0), 0)
    const subtotal = partsTotal + laborTotal
    const discountAmount = (subtotal * discount) / 100
    const total = subtotal - discountAmount
    
    return { partsTotal, laborTotal, subtotal, discountAmount, total }
  }

  const handleCreateQuotation = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer')
      return
    }

    if (manualParts.length === 0 && laborCharges.length === 0) {
      alert('Please add at least one part or labor charge')
      return
    }

    setIsSaving(true)
    
    try {
      const totals = calculateTotals()
      const validUntilDate = new Date()
      validUntilDate.setDate(validUntilDate.getDate() + validityDays)
      
      const quotationData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || '',
        customerPhone: selectedCustomer.phone || '',
        
        partsOrdered: manualParts.filter(p => p.partName),
        laborCharges: laborCharges.filter(l => l.description),
        
        workDescription,
        vehicleInfo,
        notes,
        terms,
        
        partsTotal: totals.partsTotal,
        laborTotal: totals.laborTotal,
        subtotal: totals.subtotal,
        discount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        
        validUntil: validUntilDate,
        status: 'pending',
        dateCreated: new Date()
      }
      
      await createQuotation(quotationData)
      
      alert('Quotation created successfully!')
      resetForm()
      setViewMode('list')
      
    } catch (error) {
      console.error('Error creating quotation:', error)
      alert('Error creating quotation: ' + error.message)
    }
    
    setIsSaving(false)
  }

  const handleUpdateQuotation = async () => {
    if (!selectedQuotationForEdit) return
    
    setIsSaving(true)
    
    try {
      const totals = calculateTotals()
      const validUntilDate = new Date()
      validUntilDate.setDate(validUntilDate.getDate() + validityDays)
      
      const quotationData = {
        partsOrdered: manualParts.filter(p => p.partName),
        laborCharges: laborCharges.filter(l => l.description),
        
        workDescription,
        vehicleInfo,
        notes,
        terms,
        
        partsTotal: totals.partsTotal,
        laborTotal: totals.laborTotal,
        subtotal: totals.subtotal,
        discount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        
        validUntil: validUntilDate
      }
      
      await updateQuotation(selectedQuotationForEdit.id, quotationData)
      
      alert('Quotation updated successfully!')
      setShowEditQuotationModal(false)
      setSelectedQuotationForEdit(null)
      resetForm()
      
    } catch (error) {
      console.error('Error updating quotation:', error)
      alert('Error updating quotation: ' + error.message)
    }
    
    setIsSaving(false)
  }

  const resetForm = () => {
    setSelectedCustomer(null)
    setManualParts([])
    setLaborCharges([])
    setWorkDescription('')
    setVehicleInfo({ make: '', model: '', year: '', plate: '' })
    setValidityDays(30)
    setDiscount(0)
    setNotes('')
    setTerms('Quote valid for 30 days. Prices subject to change.')
  }

  const openViewModal = (quotation) => {
    setSelectedQuotationForView(quotation)
    setShowViewQuotationModal(true)
  }

  const openEditModal = (quotation) => {
    setSelectedQuotationForEdit(quotation)
    
    // Populate form with quotation data
    setManualParts(quotation.partsOrdered || [])
    setLaborCharges(quotation.laborCharges || [])
    setWorkDescription(quotation.workDescription || '')
    setVehicleInfo(quotation.vehicleInfo || { make: '', model: '', year: '', plate: '' })
    setDiscount(quotation.discount || 0)
    setNotes(quotation.notes || '')
    setTerms(quotation.terms || 'Quote valid for 30 days. Prices subject to change.')
    
    // Calculate validity days
    const today = new Date()
    const validUntil = quotation.validUntil?.toDate ? quotation.validUntil.toDate() : new Date(quotation.validUntil)
    const diffTime = validUntil - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setValidityDays(diffDays > 0 ? diffDays : 30)
    
    setShowEditQuotationModal(true)
  }

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setShowCustomerModal(false)
    setCustomerSearchTerm('')
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  const getFilteredQuotations = () => {
    let filtered = quotationHistory
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter)
    }
    
    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.workDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }

  const downloadPDF = (quotation) => {
    try {
      const pdfData = {
        ...quotation,
        invoiceNumber: quotation.quotationNumber,
        isQuotation: true,
        type: 'quotation',
        documentTitle: 'QUOTATION',
        customerInfo: {
          name: quotation.customerName,
          email: quotation.customerEmail,
          phone: quotation.customerPhone
        },
        items: [
          ...(quotation.partsOrdered || []).map(part => ({
            kodProduk: part.sku,
            namaProduk: part.partName,
            quantity: part.quantity,
            finalPrice: part.pricePerUnit,
            totalPrice: part.total
          })),
          ...(quotation.laborCharges || []).map(labor => ({
            kodProduk: labor.sku || 'LABOR',
            namaProduk: labor.description,
            quantity: 1,
            finalPrice: labor.amount,
            totalPrice: labor.amount
          }))
        ],
        totalAmount: quotation.total,
        dateCreated: quotation.dateCreated || new Date(),
        validUntil: quotation.validUntil,
        terms: quotation.terms,
        notes: quotation.notes,
        workDescription: quotation.workDescription
      }
      
      PDFGenerator.downloadCustomerInvoicePDF(pdfData)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    }
  }

  const totals = calculateTotals()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {viewMode === 'create' ? 'Create Customer Quotation' : 'Quotation Management'}
          </h2>
          <div className="flex rounded-lg border border-black-10 overflow-hidden">
            <button
              onClick={() => setViewMode('create')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'create'
                  ? 'bg-primary-red text-white'
                  : 'bg-white text-primary-black hover:bg-black-5'
              }`}
            >
              Create New
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-primary-red text-white'
                  : 'bg-white text-primary-black hover:bg-black-5'
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
                  className="w-full px-4 py-3 border border-black-25 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-primary-red"
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
                <option value="expired">Expired</option>
              </select>
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
                <p className="text-black-50">Loading quotations...</p>
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
                          <div className="text-black-50">{formatDate(quotation.dateCreated)}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="text-primary-black">{quotation.customerName}</div>
                          <div className="text-black-50">{quotation.customerPhone}</div>
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
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {quotation.status?.charAt(0).toUpperCase() + quotation.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(quotation)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View
                            </button>
                            <span className="text-black-25">|</span>
                            <button
                              onClick={() => openEditModal(quotation)}
                              className="text-orange-600 hover:text-orange-800 font-medium"
                            >
                              Edit
                            </button>
                            <span className="text-black-25">|</span>
                            <button
                              onClick={() => downloadPDF(quotation)}
                              className="text-primary-red hover:text-red-dark font-medium"
                            >
                              Download
                            </button>
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
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            
            {selectedCustomer ? (
              <div className="bg-black-5 p-4 rounded-lg border border-black-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedCustomer.name}</h4>
                    <p className="text-black-75">{selectedCustomer.email}</p>
                    <p className="text-black-75">{selectedCustomer.phone}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-4 py-2 text-primary-red hover:text-red-dark"
                  >
                    Change Customer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-black-25 rounded-lg text-black-75 hover:border-primary-red hover:text-primary-red"
              >
                + Select Customer
              </button>
            )}
          </div>

          {selectedCustomer && (
            <>
              {/* Vehicle Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Make (e.g., Toyota)"
                    value={vehicleInfo.make}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, make: e.target.value})}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Model (e.g., Camry)"
                    value={vehicleInfo.model}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Year (e.g., 2020)"
                    value={vehicleInfo.year}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, year: e.target.value})}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="License Plate"
                    value={vehicleInfo.plate}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, plate: e.target.value})}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Work Description */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Work Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Description</label>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Describe the work to be performed..."
                    className="w-full px-4 py-2 border rounded-lg h-24"
                  />
                </div>
              </div>

              {/* Parts Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Parts</h3>
                  <button
                    onClick={addManualPart}
                    className="px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-red-dark"
                  >
                    + Add Part
                  </button>
                </div>

                {manualParts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Part Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price per Unit</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {manualParts.map((part, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={part.sku}
                                onChange={(e) => updateManualPart(index, 'sku', e.target.value)}
                                placeholder="SKU"
                                className="w-24 px-2 py-1 border rounded text-xs"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={part.partName}
                                onChange={(e) => updateManualPart(index, 'partName', e.target.value)}
                                placeholder="Part Name"
                                className="w-full px-2 py-1 border rounded text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={part.quantity}
                                onChange={(e) => updateManualPart(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border rounded"
                                min="1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={part.pricePerUnit}
                                onChange={(e) => updateManualPart(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border rounded"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2">{formatCurrency(part.total)}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removeManualPart(index)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No parts added yet. Click "Add Part" to begin.</p>
                )}
              </div>

              {/* Labor Charges */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Labor Charges</h3>
                  <button
                    onClick={addLaborCharge}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Add Labor
                  </button>
                </div>
                {laborCharges.length > 0 ? (
                  <div className="space-y-3">
                    {laborCharges.map((labor, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="w-32">
                          <label className="block text-xs text-gray-600 mb-1">SKU</label>
                          <input
                            type="text"
                            value={labor.sku}
                            onChange={(e) => updateLaborCharge(index, 'sku', e.target.value)}
                            placeholder="e.g., SVC-001"
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={labor.description}
                            onChange={(e) => updateLaborCharge(index, 'description', e.target.value)}
                            placeholder="e.g., Engine repair, Oil change"
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                        <div className="w-40">
                          <label className="block text-xs text-gray-600 mb-1">Amount (RM)</label>
                          <input
                            type="number"
                            value={labor.amount}
                            onChange={(e) => updateLaborCharge(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          onClick={() => removeLaborCharge(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No labor charges added yet</p>
                )}
              </div>

              {/* Quotation Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Quotation Summary</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Validity (Days)</label>
                      <input
                        type="number"
                        value={validityDays}
                        onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                        className="w-full px-4 py-2 border rounded-lg"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                        className="w-full px-4 py-2 border rounded-lg"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg h-16"
                      placeholder="Any additional notes..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                    <textarea
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg h-20"
                    />
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Parts Total:</span>
                    <span className="font-medium">{formatCurrency(totals.partsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Labor Total:</span>
                    <span className="font-medium">{formatCurrency(totals.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discount}%):</span>
                      <span>-{formatCurrency(totals.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold border-t-2 pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setViewMode('list')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateQuotation}
                  disabled={isSaving || !selectedCustomer || (manualParts.length === 0 && laborCharges.length === 0)}
                  className="px-6 py-3 bg-primary-red text-white rounded-lg hover:bg-red-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Creating...' : 'Create Quotation'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No customers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Quotation Modal */}
      {showViewQuotationModal && selectedQuotationForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-black-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-black">Quotation Details</h3>
                <button
                  onClick={() => setShowViewQuotationModal(false)}
                  className="text-black-50 hover:text-black-75"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quotation Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-primary-black mb-3">Quotation Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Quotation #:</span> {selectedQuotationForView.quotationNumber}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(selectedQuotationForView.dateCreated)}</p>
                    <p><span className="font-medium">Valid Until:</span> {formatDate(selectedQuotationForView.validUntil)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedQuotationForView.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedQuotationForView.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedQuotationForView.status?.charAt(0).toUpperCase() + selectedQuotationForView.status?.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary-black mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedQuotationForView.customerName}</p>
                    <p><span className="font-medium">Email:</span> {selectedQuotationForView.customerEmail || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedQuotationForView.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Work Description */}
              {selectedQuotationForView.workDescription && (
                <div>
                  <h4 className="font-semibold text-primary-black mb-3">Work Description</h4>
                  <div className="bg-black-5 p-3 rounded-lg">
                    <p className="text-sm text-black-75">{selectedQuotationForView.workDescription}</p>
                  </div>
                </div>
              )}

              {/* Parts */}
              {selectedQuotationForView.partsOrdered?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-primary-black mb-3">Parts</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {selectedQuotationForView.partsOrdered.map((part, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{part.partName} ({part.sku}) x {part.quantity}</span>
                          <span className="font-medium">{formatCurrency(part.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Labor Charges */}
              {selectedQuotationForView.laborCharges?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-primary-black mb-3">Labor Charges</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {selectedQuotationForView.laborCharges.map((labor, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{labor.description} {labor.sku && `(${labor.sku})`}</span>
                          <span className="font-medium">{formatCurrency(labor.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-black-75">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedQuotationForView.subtotal)}</span>
                  </div>
                  {selectedQuotationForView.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({selectedQuotationForView.discount}%):</span>
                      <span>-{formatCurrency(selectedQuotationForView.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className="text-primary-black">Total:</span>
                    <span className="text-primary-red">{formatCurrency(selectedQuotationForView.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedQuotationForView.notes && (
                <div>
                  <h4 className="font-semibold text-primary-black mb-3">Notes</h4>
                  <div className="bg-black-5 p-3 rounded-lg">
                    <p className="text-sm text-black-75">{selectedQuotationForView.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowViewQuotationModal(false)}
                  className="px-4 py-2 border border-black-25 text-black-75 rounded-lg hover:bg-black-5"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewQuotationModal(false)
                    downloadPDF(selectedQuotationForView)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quotation Modal */}
      {showEditQuotationModal && selectedQuotationForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-black-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-black">Edit Quotation</h3>
                <button
                  onClick={() => {
                    setShowEditQuotationModal(false)
                    setSelectedQuotationForEdit(null)
                    resetForm()
                  }}
                  className="text-black-50 hover:text-black-75"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Edit form - similar to create mode */}
              {/* Vehicle Info */}
              <div>
                <h4 className="font-semibold text-primary-black mb-3">Vehicle Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={vehicleInfo.make}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                    placeholder="Make"
                    className="px-3 py-2 border border-black-25 rounded-lg"
                  />
                  <input
                    type="text"
                    value={vehicleInfo.model}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                    placeholder="Model"
                    className="px-3 py-2 border border-black-25 rounded-lg"
                  />
                  <input
                    type="text"
                    value={vehicleInfo.year}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                    placeholder="Year"
                    className="px-3 py-2 border border-black-25 rounded-lg"
                  />
                  <input
                    type="text"
                    value={vehicleInfo.plate}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, plate: e.target.value })}
                    placeholder="Plate Number"
                    className="px-3 py-2 border border-black-25 rounded-lg"
                  />
                </div>
              </div>

              {/* Work Description */}
              <div>
                <h4 className="font-semibold text-primary-black mb-3">Work Description</h4>
                <textarea
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-black-25 rounded-lg"
                />
              </div>

              {/* Parts */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-primary-black">Parts</h4>
                  <button
                    onClick={addManualPart}
                    className="btn-primary px-4 py-2 rounded-lg text-sm"
                  >
                    + Add Part
                  </button>
                </div>
                <div className="space-y-2">
                  {manualParts.map((part, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={part.sku}
                          onChange={(e) => updateManualPart(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={part.partName}
                          onChange={(e) => updateManualPart(index, 'partName', e.target.value)}
                          placeholder="Part Name"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={part.quantity}
                          onChange={(e) => updateManualPart(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={part.pricePerUnit}
                          onChange={(e) => updateManualPart(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-1 text-center text-sm font-semibold">
                        {formatCurrency(part.total)}
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => removeManualPart(index)}
                          className="w-full text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labor */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-primary-black">Labor Charges</h4>
                  <button
                    onClick={addLaborCharge}
                    className="btn-primary px-4 py-2 rounded-lg text-sm"
                  >
                    + Add Labor
                  </button>
                </div>
                <div className="space-y-2">
                  {laborCharges.map((labor, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-green-50 p-3 rounded">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={labor.sku}
                          onChange={(e) => updateLaborCharge(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-7">
                        <input
                          type="text"
                          value={labor.description}
                          onChange={(e) => updateLaborCharge(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={labor.amount}
                          onChange={(e) => updateLaborCharge(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => removeLaborCharge(index)}
                          className="w-full text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Discount:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border rounded"
                      />
                      <span>%</span>
                      <span className="font-medium">(-{formatCurrency(totals.discountAmount)})</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary-red">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowEditQuotationModal(false)
                    setSelectedQuotationForEdit(null)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-black-25 text-black-75 rounded-lg hover:bg-black-5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateQuotation}
                  disabled={isSaving}
                  className="btn-primary px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update Quotation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuotationCreation
