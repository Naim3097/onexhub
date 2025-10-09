import React, { useState, useEffect } from 'react'
import { useCustomer } from '../context/CustomerContext'
import { useTransaction } from '../context/TransactionContext'
import { createCustomerInvoice, updateCustomerInvoice } from '../utils/FirebaseDataUtils'
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import PDFGenerator from '../utils/PDFGenerator'

function CustomerInvoiceCreation({ setActiveSection }) {
  console.log('🔍 CustomerInvoiceCreation component mounting...')
  
  const [viewMode, setViewMode] = useState('list') // 'list' or 'create'
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false)
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null)
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false)
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState(null)
  
  // Invoice form states
  const [manualParts, setManualParts] = useState([])
  const [laborCharges, setLaborCharges] = useState([])
  const [selectedMechanic, setSelectedMechanic] = useState(null)
  const [mechanics, setMechanics] = useState([])
  const [workDescription, setWorkDescription] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState({ make: '', model: '', year: '', plate: '' })
  const [paymentTerms, setPaymentTerms] = useState(30)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [discount, setDiscount] = useState(0)
  const [deposit, setDeposit] = useState(0)
  const [notes, setNotes] = useState('')
  
  // DirectLending states
  const [useDirectLending, setUseDirectLending] = useState(false)
  const [directLendingAmount, setDirectLendingAmount] = useState(0)
  
  // Commission settings
  const [commissionType, setCommissionType] = useState('percentage') // 'percentage' or 'fixed'
  const [commissionValue, setCommissionValue] = useState(0)
  const [commissionAmount, setCommissionAmount] = useState(0)
  
  // Supplier cost for commission calculation
  const [totalPartsSupplierCost, setTotalPartsSupplierCost] = useState(0)
  
  // Commission distribution
  const [commissionDistributionType, setCommissionDistributionType] = useState('individual') // 'individual' or 'team'
  const [selectedMechanicForCommission, setSelectedMechanicForCommission] = useState(null)
  const [teamMembers, setTeamMembers] = useState([
    { mechanic: null, percentage: 50 },
    { mechanic: null, percentage: 50 }
  ])
  
  const [invoiceHistory, setInvoiceHistory] = useState([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSaving, setIsSaving] = useState(false)

  const { customers = [] } = useCustomer() || {}
  const { recordPayment } = useTransaction() || {}

  console.log('📊 Context data loaded:', { 
    customersCount: customers?.length
  })

  // Load mechanics from Firestore
  useEffect(() => {
    const loadMechanics = async () => {
      try {
        const mechanicsSnapshot = await getDocs(collection(db, 'mechanics'))
        const mechanicsData = []
        mechanicsSnapshot.forEach((doc) => {
          mechanicsData.push({
            id: doc.id,
            ...doc.data()
          })
        })
        setMechanics(mechanicsData)
        console.log('✅ Loaded mechanics:', mechanicsData.length)
      } catch (error) {
        console.error('Error loading mechanics:', error)
      }
    }
    loadMechanics()
  }, [])

  // Load invoice history
  useEffect(() => {
    setIsLoadingInvoices(true)
    try {
      const invoicesQuery = query(
        collection(db, 'customer_invoices'),
        orderBy('dateCreated', 'desc')
      )
      
      const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
        const invoices = []
        snapshot.forEach((doc) => {
          invoices.push({
            id: doc.id,
            ...doc.data(),
            dateCreated: doc.data().dateCreated?.toDate() || new Date(),
            dueDate: doc.data().dueDate?.toDate() || new Date()
          })
        })
        setInvoiceHistory(invoices)
        setIsLoadingInvoices(false)
      })
      
      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading invoices:', error)
      setIsLoadingInvoices(false)
    }
  }, [])

  // Check for invoice to edit from Accounting page
  useEffect(() => {
    const editInvoiceData = localStorage.getItem('editInvoiceData')
    if (editInvoiceData) {
      try {
        const invoice = JSON.parse(editInvoiceData)
        console.log('📝 Loading invoice for editing from Accounting page:', invoice)
        
        // Clear localStorage
        localStorage.removeItem('editInvoiceData')
        
        // Open edit modal with the invoice
        setSelectedInvoiceForEdit(invoice)
        setShowEditInvoiceModal(true)
        setViewMode('list') // Stay in list view to show the modal
      } catch (error) {
        console.error('Error parsing edit invoice data:', error)
      }
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
    if (date.toDate) return date.toDate().toLocaleDateString()
    if (date instanceof Date) return date.toLocaleDateString()
    return new Date(date).toLocaleDateString()
  }

  const getFilteredInvoices = () => {
    let filtered = invoiceHistory

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.workDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.paymentStatus === statusFilter)
    }

    return filtered
  }

  const viewInvoice = (invoice) => {
    setSelectedInvoiceForView(invoice)
    setShowViewInvoiceModal(true)
  }

  const editInvoice = (invoice) => {
    setSelectedInvoiceForEdit(invoice)
    setSelectedCustomer({
      id: invoice.customerId,
      name: invoice.customerName,
      phone: invoice.customerPhone,
      email: invoice.customerEmail
    })
    setManualParts(invoice.partsOrdered || [])
    setLaborCharges(invoice.laborCharges || [])
    setWorkDescription(invoice.workDescription || '')
    setVehicleInfo(invoice.vehicleInfo || { make: '', model: '', year: '', plate: '' })
    setPaymentTerms(invoice.paymentTerms || 30)
    setPaymentStatus(invoice.paymentStatus || 'pending')
    setDiscount(invoice.discount || 0)
    setDeposit(invoice.deposit || 0)
    setUseDirectLending(invoice.useDirectLending || false)
    setDirectLendingAmount(invoice.directLendingAmount || 0)
    setNotes(invoice.notes || '')
    setSelectedMechanic(invoice.mechanicId ? mechanics.find(m => m.id === invoice.mechanicId) : null)
    setCommissionType(invoice.commissionType || 'percentage')
    setCommissionValue(invoice.commissionValue || 0)
    setShowEditInvoiceModal(true)
  }

  const downloadInvoice = (invoice) => {
    try {
      console.log('📥 Downloading invoice:', invoice)
      
      // Add customer info for proper PDF generation
      const pdfData = {
        ...invoice,
        isQuotation: false,
        type: 'invoice',
        customerInfo: {
          name: invoice.customerName || '',
          email: invoice.customerEmail || '',
          phone: invoice.customerPhone || '',
          address: invoice.customerAddress || ''
        },
        items: [
          ...(invoice.partsOrdered || []).map(part => ({
            kodProduk: part.sku || '',
            namaProduk: part.partName || '',
            quantity: Number(part.quantity) || 0,
            finalPrice: Number(part.pricePerUnit) || 0,
            totalPrice: Number(part.total) || 0
          })),
          ...(invoice.laborCharges || []).map(labor => ({
            kodProduk: labor.sku || 'LABOR',
            namaProduk: labor.description || 'Labor Charge',
            quantity: 1,
            finalPrice: Number(labor.amount) || 0,
            totalPrice: Number(labor.amount) || 0
          }))
        ],
        totalAmount: Number(invoice.customerTotal || invoice.total) || 0,
        workDescription: invoice.workDescription || '',
        mechanicName: invoice.mechanicName || '',
        vehicleInfo: invoice.vehicleInfo || {},
        useDirectLending: invoice.useDirectLending || false,
        directLendingAmount: Number(invoice.directLendingAmount) || 0,
        customerPayableAmount: Number(invoice.customerPayableAmount) || 0
      }
      
      console.log('📄 PDF Data prepared:', pdfData)
      PDFGenerator.downloadCustomerInvoicePDF(pdfData)
      console.log('✅ PDF download initiated')
    } catch (error) {
      console.error('❌ Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const resetForm = () => {
    setSelectedCustomer(null)
    setManualParts([])
    setLaborCharges([])
    setSelectedMechanic(null)
    setWorkDescription('')
    setVehicleInfo({ make: '', model: '', year: '', plate: '' })
    setPaymentTerms(30)
    setPaymentStatus('pending')
    setDiscount(0)
    setDeposit(0)
    setNotes('')
    setUseDirectLending(false)
    setDirectLendingAmount(0)
    setCommissionType('percentage')
    setCommissionValue(0)
    setCommissionAmount(0)
  }

  const calculateTotals = () => {
    const partsTotal = manualParts.reduce((sum, part) => sum + (part.total || 0), 0)
    const laborTotal = laborCharges.reduce((sum, labor) => sum + (labor.amount || 0), 0)
    const subtotal = partsTotal + laborTotal
    const discountAmount = (subtotal * discount) / 100
    const total = subtotal - discountAmount
    const depositAmount = Number(deposit) || 0
    const balanceDue = total - depositAmount
    
    // DirectLending calculations
    const directLending = useDirectLending ? Number(directLendingAmount) || 0 : 0
    const customerPayableAmount = useDirectLending ? balanceDue - directLending : balanceDue
    
    // NEW: Calculate commission based on parts revenue + labour
    // Parts Revenue = Customer Price - Supplier Cost
    const supplierCost = Number(totalPartsSupplierCost) || 0
    const partsRevenue = partsTotal - supplierCost
    const commissionBase = partsRevenue + laborTotal // Parts revenue + labour (no discount deduction)
    
    let calcCommission = 0
    if (commissionType === 'percentage') {
      calcCommission = (commissionBase * commissionValue) / 100
    } else {
      calcCommission = commissionValue
    }
    
    return { 
      partsTotal, 
      laborTotal, 
      subtotal, 
      discountAmount, 
      total, 
      deposit: depositAmount, 
      balanceDue, 
      directLendingAmount: directLending,
      customerPayableAmount,
      partsSupplierCost: supplierCost,
      partsRevenue,
      commissionBase,
      commission: calcCommission 
    }
  }

  // Update commission amount when values change
  useEffect(() => {
    const totals = calculateTotals()
    setCommissionAmount(totals.commission)
  }, [commissionType, commissionValue, manualParts, laborCharges, discount, deposit, useDirectLending, directLendingAmount, totalPartsSupplierCost])

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
    const updatedParts = [...manualParts]
    updatedParts[index][field] = value
    
    if (field === 'quantity' || field === 'pricePerUnit') {
      const qty = field === 'quantity' ? (parseFloat(value) || 0) : updatedParts[index].quantity
      const price = field === 'pricePerUnit' ? (parseFloat(value) || 0) : updatedParts[index].pricePerUnit
      updatedParts[index].total = qty * price
    }
    
    setManualParts(updatedParts)
  }

  const removePart = (index) => {
    setManualParts(manualParts.filter((_, i) => i !== index))
  }

  const addLaborCharge = () => {
    setLaborCharges([...laborCharges, { sku: '', description: '', amount: 0 }])
  }

  const updateLaborCharge = (index, field, value) => {
    const updatedLabor = [...laborCharges]
    updatedLabor[index][field] = value
    setLaborCharges(updatedLabor)
  }

  const removeLaborCharge = (index) => {
    setLaborCharges(laborCharges.filter((_, i) => i !== index))
  }

  const handleCreateInvoice = async () => {
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
      const invoiceData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerEmail: selectedCustomer.email || '',
        mechanicId: selectedMechanic?.id || null,
        mechanicName: selectedMechanic?.name || null,
        partsOrdered: manualParts,
        laborCharges: laborCharges,
        workDescription: workDescription,
        vehicleInfo: vehicleInfo,
        partsTotal: totals.partsTotal,
        laborTotal: totals.laborTotal,
        subtotal: totals.subtotal,
        discount: discount,
        discountAmount: totals.discountAmount,
        deposit: totals.deposit,
        balanceDue: totals.balanceDue,
        useDirectLending: useDirectLending,
        directLendingAmount: totals.directLendingAmount,
        customerPayableAmount: totals.customerPayableAmount,
        customerTotal: totals.total,
        total: totals.total,
        paymentStatus: paymentStatus,
        paymentTerms: paymentTerms,
        notes: notes,
        // Commission data (internal only, not shown on customer invoice)
        commissionType: commissionType,
        commissionValue: commissionValue,
        commissionAmount: totals.commission,
        // NEW: Supplier cost and commission distribution
        partsSupplierCost: totals.partsSupplierCost,
        partsRevenue: totals.partsRevenue,
        commissionBase: totals.commissionBase,
        commissionDistributionType: commissionDistributionType,
        commissionDistribution: commissionDistributionType === 'individual' 
          ? { mechanic: selectedMechanicForCommission, percentage: 100 }
          : { teamMembers: teamMembers.map(tm => ({ mechanicId: tm.mechanic?.id, mechanicName: tm.mechanic?.name, percentage: tm.percentage })) },
        dateCreated: new Date(),
        dueDate: new Date(Date.now() + paymentTerms * 24 * 60 * 60 * 1000)
      }

      await createCustomerInvoice(invoiceData)
      alert('Invoice created successfully!')
      resetForm()
      setViewMode('list')
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateInvoice = async () => {
    if (!selectedInvoiceForEdit) return

    setIsSaving(true)
    try {
      const totals = calculateTotals()
      const updatedData = {
        customerId: selectedCustomer?.id || selectedInvoiceForEdit.customerId,
        customerName: selectedCustomer?.name || selectedInvoiceForEdit.customerName,
        customerPhone: selectedCustomer?.phone || selectedInvoiceForEdit.customerPhone,
        customerEmail: selectedCustomer?.email || selectedInvoiceForEdit.customerEmail || '',
        mechanicId: selectedMechanic?.id || null,
        mechanicName: selectedMechanic?.name || null,
        partsOrdered: manualParts,
        laborCharges: laborCharges,
        workDescription: workDescription,
        vehicleInfo: vehicleInfo,
        partsTotal: totals.partsTotal,
        laborTotal: totals.laborTotal,
        subtotal: totals.subtotal,
        discount: discount,
        discountAmount: totals.discountAmount,
        deposit: totals.deposit,
        balanceDue: totals.balanceDue,
        useDirectLending: useDirectLending,
        directLendingAmount: totals.directLendingAmount,
        customerPayableAmount: totals.customerPayableAmount,
        customerTotal: totals.total,
        total: totals.total,
        paymentStatus: paymentStatus,
        paymentTerms: paymentTerms,
        notes: notes,
        // Commission data (internal only)
        commissionType: commissionType,
        commissionValue: commissionValue,
        commissionAmount: totals.commission,
        dueDate: new Date(selectedInvoiceForEdit.dateCreated.getTime() + paymentTerms * 24 * 60 * 60 * 1000)
      }

      await updateCustomerInvoice(selectedInvoiceForEdit.id, updatedData)
      alert('Invoice updated successfully!')
      setShowEditInvoiceModal(false)
      resetForm()
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Error updating invoice. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.includes(customerSearchTerm)
  )

  console.log('✅ Component ready to render')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {viewMode === 'create' ? 'Create Customer Invoice' : 'Invoice Management'}
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
              View History ({invoiceHistory.length})
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

      {/* Invoice History View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search invoices by customer, number, or description..."
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
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoice List */}
          <div className="bg-primary-white rounded-lg border border-black-10 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-black-10">
              <h3 className="text-lg font-semibold text-primary-black">Invoice History</h3>
              <p className="text-black-75 text-sm">Manage and download existing invoices</p>
            </div>

            {isLoadingInvoices ? (
              <div className="p-8 text-center">
                <p className="text-black-50">Loading invoices...</p>
              </div>
            ) : getFilteredInvoices().length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-black-50">
                  {searchQuery ? 'No invoices match your search.' : 'No invoices found.'}
                </p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-black-50 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black-10">
                    {getFilteredInvoices().map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-black-5">
                        <td className="px-4 py-4 text-sm">
                          <div className="font-medium text-primary-black">{invoice.invoiceNumber}</div>
                          <div className="text-black-50">{formatDate(invoice.dateCreated)}</div>
                          {invoice.useDirectLending && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                                </svg>
                                DirectLending
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="text-primary-black">{invoice.customerName}</div>
                          <div className="text-black-50">{invoice.customerPhone}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="text-primary-black">{invoice.mechanicName || '-'}</div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-primary-black">
                          {formatCurrency(invoice.customerTotal || invoice.total)}
                        </td>
                        <td className="px-4 py-4 text-sm text-primary-black">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-black-10 text-black-75'
                          }`}>
                            {invoice.paymentStatus?.charAt(0).toUpperCase() + invoice.paymentStatus?.slice(1) || 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewInvoice(invoice)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => editInvoice(invoice)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => downloadInvoice(invoice)}
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

      {/* Create Invoice View */}
      {viewMode === 'create' && (
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                  {selectedCustomer.email && <p className="text-sm text-gray-600">{selectedCustomer.email}</p>}
                </div>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800"
                >
                  Change Customer
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                + Select Customer
              </button>
            )}
          </div>

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

          {/* Work Description & Mechanic */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Work Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mechanic Assigned</label>
                <select
                  value={selectedMechanic?.id || ''}
                  onChange={(e) => setSelectedMechanic(mechanics.find(m => m.id === e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">No mechanic assigned</option>
                  {mechanics.map(mechanic => (
                    <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>
                  ))}
                </select>
              </div>
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
          </div>

          {/* Parts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Parts</h3>
              <button
                onClick={addManualPart}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price (RM)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {manualParts.map((part, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={part.sku}
                            onChange={(e) => updateManualPart(index, 'sku', e.target.value)}
                            placeholder="SKU"
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={part.partName}
                            onChange={(e) => updateManualPart(index, 'partName', e.target.value)}
                            placeholder="Part Name"
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={part.quantity}
                            onChange={(e) => updateManualPart(index, 'quantity', e.target.value)}
                            className="w-20 px-2 py-1 border rounded"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={part.pricePerUnit}
                            onChange={(e) => updateManualPart(index, 'pricePerUnit', e.target.value)}
                            className="w-24 px-2 py-1 border rounded"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-2 font-medium">{formatCurrency(part.total)}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => removePart(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
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

          {/* Invoice Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deposit (RM)</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Amount paid upfront by customer</p>
              </div>

              {/* DirectLending Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="useDirectLending"
                    checked={useDirectLending}
                    onChange={(e) => {
                      setUseDirectLending(e.target.checked)
                      if (!e.target.checked) {
                        setDirectLendingAmount(0)
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="useDirectLending" className="ml-2 text-sm font-medium text-gray-900">
                    Customer uses DirectLending
                  </label>
                </div>
                
                {useDirectLending && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DirectLending Approved Amount (RM)
                    </label>
                    <input
                      type="number"
                      value={directLendingAmount}
                      onChange={(e) => setDirectLendingAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      Amount approved by DirectLending for installment payment
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border rounded-lg h-20"
                />
              </div>

              {/* Mechanic Commission Section (Internal Only) */}
              {selectedMechanic && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                    </svg>
                    Mechanic Commission (Internal - Not shown on customer invoice)
                  </h4>

                  {/* Supplier Cost Input */}
                  <div className="bg-white border border-orange-300 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Total Parts Cost (Supplier) *
                    </label>
                    <input
                      type="number"
                      value={totalPartsSupplierCost}
                      onChange={(e) => setTotalPartsSupplierCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Enter total supplier cost for all parts"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the total cost you paid to suppliers for all parts in this invoice
                    </p>
                  </div>

                  {/* Commission Type Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Commission Type</label>
                      <select
                        value={commissionType}
                        onChange={(e) => setCommissionType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (RM)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {commissionType === 'percentage' ? 'Percentage (%)' : 'Amount (RM)'}
                      </label>
                      <input
                        type="number"
                        value={commissionValue}
                        onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="0"
                        step={commissionType === 'percentage' ? '0.1' : '0.01'}
                        max={commissionType === 'percentage' ? '100' : undefined}
                      />
                    </div>
                  </div>

                  {/* Commission Distribution Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Commission Distribution</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCommissionDistributionType('individual')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          commissionDistributionType === 'individual'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommissionDistributionType('team')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          commissionDistributionType === 'team'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Team (2 members)
                      </button>
                    </div>
                  </div>

                  {/* Individual Commission */}
                  {commissionDistributionType === 'individual' && (
                    <div className="bg-white border border-orange-300 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Select Mechanic</label>
                      <select
                        value={selectedMechanicForCommission?.id || ''}
                        onChange={(e) => {
                          const mech = mechanics.find(m => m.id === e.target.value)
                          setSelectedMechanicForCommission(mech || null)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select mechanic...</option>
                        {mechanics.map(mech => (
                          <option key={mech.id} value={mech.id}>{mech.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Team Commission */}
                  {commissionDistributionType === 'team' && (
                    <div className="bg-white border border-orange-300 rounded-lg p-3 space-y-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Team Members & Split</label>
                      
                      {/* Member 1 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Member 1</label>
                          <select
                            value={teamMembers[0]?.mechanic?.id || ''}
                            onChange={(e) => {
                              const mech = mechanics.find(m => m.id === e.target.value)
                              setTeamMembers([
                                { ...teamMembers[0], mechanic: mech || null },
                                teamMembers[1]
                              ])
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select...</option>
                            {mechanics.map(mech => (
                              <option key={mech.id} value={mech.id}>{mech.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Split %</label>
                          <input
                            type="number"
                            value={teamMembers[0]?.percentage || 50}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setTeamMembers([
                                { ...teamMembers[0], percentage: val },
                                { ...teamMembers[1], percentage: 100 - val }
                              ])
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      </div>

                      {/* Member 2 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Member 2</label>
                          <select
                            value={teamMembers[1]?.mechanic?.id || ''}
                            onChange={(e) => {
                              const mech = mechanics.find(m => m.id === e.target.value)
                              setTeamMembers([
                                teamMembers[0],
                                { ...teamMembers[1], mechanic: mech || null }
                              ])
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select...</option>
                            {mechanics.map(mech => (
                              <option key={mech.id} value={mech.id}>{mech.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Split %</label>
                          <input
                            type="number"
                            value={teamMembers[1]?.percentage || 50}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-gray-100"
                            disabled
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Split percentages must total 100%. Member 2's percentage auto-adjusts.
                      </p>
                    </div>
                  )}

                  {/* Commission Breakdown */}
                  <div className="mt-3 pt-3 border-t border-orange-200 bg-white rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Commission Calculation:</h5>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Parts (Customer):</span>
                        <span className="font-medium">{formatCurrency(calculateTotals().partsTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parts (Supplier Cost):</span>
                        <span className="font-medium text-red-600">-{formatCurrency(calculateTotals().partsSupplierCost)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Parts Revenue:</span>
                        <span className="font-medium text-green-600">{formatCurrency(calculateTotals().partsRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labour:</span>
                        <span className="font-medium">{formatCurrency(calculateTotals().laborTotal)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-semibold">
                        <span>Commission Base:</span>
                        <span className="text-blue-600">{formatCurrency(calculateTotals().commissionBase)}</span>
                      </div>
                      {commissionType === 'percentage' && (
                        <div className="flex justify-between text-xs">
                          <span>Rate:</span>
                          <span>{commissionValue}%</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-1 text-sm font-bold">
                        <span>Total Commission:</span>
                        <span className="text-orange-600">{formatCurrency(commissionAmount)}</span>
                      </div>
                    </div>

                    {/* Distribution Breakdown */}
                    {commissionDistributionType === 'individual' && selectedMechanicForCommission && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedMechanicForCommission.name}:
                          </span>
                          <span className="text-base font-bold text-orange-600">
                            {formatCurrency(commissionAmount)}
                          </span>
                        </div>
                      </div>
                    )}

                    {commissionDistributionType === 'team' && teamMembers[0]?.mechanic && teamMembers[1]?.mechanic && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {teamMembers[0].mechanic.name} ({teamMembers[0].percentage}%):
                          </span>
                          <span className="text-base font-bold text-orange-600">
                            {formatCurrency((commissionAmount * teamMembers[0].percentage) / 100)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {teamMembers[1].mechanic.name} ({teamMembers[1].percentage}%):
                          </span>
                          <span className="text-base font-bold text-orange-600">
                            {formatCurrency((commissionAmount * teamMembers[1].percentage) / 100)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Parts Total:</span>
                  <span className="font-medium">{formatCurrency(calculateTotals().partsTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Labor Total:</span>
                  <span className="font-medium">{formatCurrency(calculateTotals().laborTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculateTotals().subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discount}%):</span>
                    <span className="font-medium">-{formatCurrency(calculateTotals().discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-red-600">{formatCurrency(calculateTotals().total)}</span>
                </div>
                {deposit > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Deposit Paid:</span>
                      <span className="font-medium">-{formatCurrency(calculateTotals().deposit)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-orange-600 border-t pt-2">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(calculateTotals().balanceDue)}</span>
                    </div>
                  </>
                )}
                {useDirectLending && (
                  <>
                    <div className="flex justify-between text-sm text-purple-600 border-t pt-2">
                      <span>DirectLending Amount:</span>
                      <span className="font-medium">-{formatCurrency(calculateTotals().directLendingAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600 border-t pt-2">
                      <span>Customer Payable Amount:</span>
                      <span>{formatCurrency(calculateTotals().customerPayableAmount)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 italic">
                      * Revenue received: Full amount ({formatCurrency(calculateTotals().total)}) = DirectLending + Customer Payment
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Reset Form
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={isSaving || !selectedCustomer}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewInvoiceModal && selectedInvoiceForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Invoice Details</h2>
              <button 
                onClick={() => setShowViewInvoiceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Invoice Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Invoice #:</span> {selectedInvoiceForView.invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(selectedInvoiceForView.dateCreated)}</p>
                  <p><span className="font-medium">Due Date:</span> {formatDate(selectedInvoiceForView.dueDate)}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      selectedInvoiceForView.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      selectedInvoiceForView.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedInvoiceForView.paymentStatus?.charAt(0).toUpperCase() + selectedInvoiceForView.paymentStatus?.slice(1)}
                    </span>
                  </p>
                  <p><span className="font-medium">Total Amount:</span> {formatCurrency(selectedInvoiceForView.customerTotal || selectedInvoiceForView.total)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedInvoiceForView.customerName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedInvoiceForView.customerPhone}</p>
                  <p><span className="font-medium">Email:</span> {selectedInvoiceForView.customerEmail || 'N/A'}</p>
                </div>
              </div>

              {/* Parts and Labor */}
              {selectedInvoiceForView.partsOrdered && selectedInvoiceForView.partsOrdered.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Parts</h3>
                  <div className="space-y-1 text-sm">
                    {selectedInvoiceForView.partsOrdered.map((part, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{part.partName} {part.sku && `(${part.sku})`} (x{part.quantity})</span>
                        <span>{formatCurrency(part.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor Charges */}
              {selectedInvoiceForView.laborCharges && selectedInvoiceForView.laborCharges.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Labor Charges</h3>
                  <div className="space-y-1 text-sm">
                    {selectedInvoiceForView.laborCharges.map((labor, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{labor.description} {labor.sku && `(${labor.sku})`}</span>
                        <span>{formatCurrency(labor.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowViewInvoiceModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  downloadInvoice(selectedInvoiceForView)
                  setShowViewInvoiceModal(false)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditInvoiceModal && selectedInvoiceForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Edit Invoice: {selectedInvoiceForEdit.invoiceNumber}</h2>
              <button 
                onClick={() => {
                  setShowEditInvoiceModal(false)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Customer</h3>
                <p className="text-sm"><strong>Name:</strong> {selectedCustomer?.name}</p>
                <p className="text-sm"><strong>Phone:</strong> {selectedCustomer?.phone}</p>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Make"
                    value={vehicleInfo.make}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, make: e.target.value})}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Model"
                    value={vehicleInfo.model}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={vehicleInfo.year}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, year: e.target.value})}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="License Plate"
                    value={vehicleInfo.plate}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, plate: e.target.value})}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Mechanic & Work Description */}
              <div>
                <h3 className="font-semibold mb-3">Work Details</h3>
                <div className="space-y-3">
                  <select
                    value={selectedMechanic?.id || ''}
                    onChange={(e) => setSelectedMechanic(mechanics.find(m => m.id === e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">No mechanic assigned</option>
                    {mechanics.map(mechanic => (
                      <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>
                    ))}
                  </select>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Work description..."
                    className="w-full px-3 py-2 border rounded-lg h-20"
                  />
                </div>
              </div>

              {/* Parts */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Parts</h3>
                  <button
                    onClick={addManualPart}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + Add Part
                  </button>
                </div>
                {manualParts.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">SKU</th>
                          <th className="px-3 py-2 text-left">Part Name</th>
                          <th className="px-3 py-2 text-left">Qty</th>
                          <th className="px-3 py-2 text-left">Price</th>
                          <th className="px-3 py-2 text-left">Total</th>
                          <th className="px-3 py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {manualParts.map((part, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={part.sku}
                                onChange={(e) => updateManualPart(index, 'sku', e.target.value)}
                                placeholder="SKU"
                                className="w-20 px-2 py-1 border rounded text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
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
                                onChange={(e) => updateManualPart(index, 'quantity', e.target.value)}
                                className="w-16 px-2 py-1 border rounded"
                                min="1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={part.pricePerUnit}
                                onChange={(e) => updateManualPart(index, 'pricePerUnit', e.target.value)}
                                className="w-20 px-2 py-1 border rounded"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2">{formatCurrency(part.total)}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removePart(index)}
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
                  <p className="text-gray-500 text-sm text-center py-3">No parts</p>
                )}
              </div>

              {/* Labor Charges */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Labor Charges</h3>
                  <button
                    onClick={addLaborCharge}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Add Labor
                  </button>
                </div>
                {laborCharges.length > 0 ? (
                  <div className="space-y-2">
                    {laborCharges.map((labor, index) => (
                      <div key={index} className="flex gap-2 items-end text-sm">
                        <input
                          type="text"
                          value={labor.sku}
                          onChange={(e) => updateLaborCharge(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-24 px-2 py-1 border rounded"
                        />
                        <input
                          type="text"
                          value={labor.description}
                          onChange={(e) => updateLaborCharge(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="flex-1 px-2 py-1 border rounded"
                        />
                        <input
                          type="number"
                          value={labor.amount}
                          onChange={(e) => updateLaborCharge(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="w-28 px-2 py-1 border rounded"
                          step="0.01"
                          min="0"
                        />
                        <button
                          onClick={() => removeLaborCharge(index)}
                          className="px-2 py-1 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-3">No labor charges</p>
                )}
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold mb-3">Payment Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Payment Terms (Days)</label>
                    <input
                      type="number"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-full px-3 py-2 border rounded-lg"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Deposit (RM)</label>
                    <input
                      type="number"
                      value={deposit}
                      onChange={(e) => setDeposit(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 border rounded-lg"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {/* DirectLending Section in Edit Modal */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="editUseDirectLending"
                      checked={useDirectLending}
                      onChange={(e) => {
                        setUseDirectLending(e.target.checked)
                        if (!e.target.checked) {
                          setDirectLendingAmount(0)
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="editUseDirectLending" className="ml-2 text-sm font-medium text-gray-900">
                      Customer uses DirectLending
                    </label>
                  </div>
                  
                  {useDirectLending && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DirectLending Approved Amount (RM)
                      </label>
                      <input
                        type="number"
                        value={directLendingAmount}
                        onChange={(e) => setDirectLendingAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg h-16"
                  />
                </div>
              </div>

              {/* Mechanic Commission (Internal) */}
              {selectedMechanic && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-2">
                    Mechanic Commission (Internal Only)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs mb-1">Type</label>
                      <select
                        value={commissionType}
                        onChange={(e) => setCommissionType(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (RM)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Value</label>
                      <input
                        type="number"
                        value={commissionValue}
                        onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        min="0"
                        step={commissionType === 'percentage' ? '0.1' : '0.01'}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                    <span className="text-sm font-medium">Commission:</span>
                    <span className="text-lg font-bold text-orange-600">
                      {formatCurrency(commissionAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Parts Total:</span>
                    <span className="font-medium">{formatCurrency(calculateTotals().partsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Labor Total:</span>
                    <span className="font-medium">{formatCurrency(calculateTotals().laborTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateTotals().subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discount}%):</span>
                      <span>-{formatCurrency(calculateTotals().discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-red-600">{formatCurrency(calculateTotals().total)}</span>
                  </div>
                  {deposit > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Deposit Paid:</span>
                        <span>-{formatCurrency(calculateTotals().deposit)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-orange-600 border-t pt-2">
                        <span>Balance Due:</span>
                        <span>{formatCurrency(calculateTotals().balanceDue)}</span>
                      </div>
                    </>
                  )}
                  {useDirectLending && (
                    <>
                      <div className="flex justify-between text-sm text-purple-600">
                        <span>DirectLending:</span>
                        <span>-{formatCurrency(calculateTotals().directLendingAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-green-600 border-t pt-2">
                        <span>Customer Payable:</span>
                        <span>{formatCurrency(calculateTotals().customerPayableAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button 
                  onClick={() => {
                    setShowEditInvoiceModal(false)
                    resetForm()
                  }}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateInvoice}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSaving ? 'Updating...' : 'Update Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select Customer</h2>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <input
              type="text"
              placeholder="Search customers by name or phone..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setShowCustomerModal(false)
                      setCustomerSearchTerm('')
                    }}
                    className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                    {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No customers found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerInvoiceCreation