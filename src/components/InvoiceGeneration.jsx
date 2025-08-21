import { useState } from 'react'
import { usePartsContext } from '../context/PartsContext'
import { useInvoiceContext } from '../context/InvoiceContext'
import PartsSelector from './PartsSelector'
import InvoicePreview from './InvoicePreview'

function InvoiceGeneration({ setActiveSection }) {
  const { parts, updateStock } = usePartsContext()
  const { createInvoice, generateInvoiceNumber } = useInvoiceContext()
  
  const [selectedParts, setSelectedParts] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: 'One X Transmission',
    phone: '+60 11-3105 1677',
    address: '15-G, JLN SG RASAU, E32/E, Jln Kebun Tambahan, Taman Perindustrian Berjaya, 40460 Shah Alam, Selangor'
  })
  const [notes, setNotes] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState(null)

  const addPartToInvoice = (part, quantity = 1) => {
    const existingIndex = selectedParts.findIndex(item => item.partId === part.id)
    
    if (existingIndex >= 0) {
      // Update existing part quantity
      const updatedParts = [...selectedParts]
      updatedParts[existingIndex].quantity += quantity
      setSelectedParts(updatedParts)
    } else {
      // Add new part with default markup
      const newItem = {
        partId: part.id,
        kodProduk: part.kodProduk,
        namaProduk: part.namaProduk,
        originalPrice: part.harga,
        quantity: quantity,
        markupType: 'percentage', // default to percentage
        markupValue: 20, // default 20%
        finalPrice: part.harga * 1.2, // calculated price with markup
        totalPrice: part.harga * 1.2 * quantity
      }
      setSelectedParts([...selectedParts, newItem])
    }
  }

  const updatePartMarkup = (partId, markupType, markupValue) => {
    setSelectedParts(parts => parts.map(item => {
      if (item.partId === partId) {
        let finalPrice
        if (markupType === 'percentage') {
          finalPrice = item.originalPrice * (1 + markupValue / 100)
        } else {
          finalPrice = item.originalPrice + markupValue
        }
        
        return {
          ...item,
          markupType,
          markupValue,
          finalPrice,
          totalPrice: finalPrice * item.quantity
        }
      }
      return item
    }))
  }

  const updatePartQuantity = (partId, quantity) => {
    if (quantity <= 0) {
      removePartFromInvoice(partId)
      return
    }

    setSelectedParts(parts => parts.map(item => {
      if (item.partId === partId) {
        return {
          ...item,
          quantity,
          totalPrice: item.finalPrice * quantity
        }
      }
      return item
    }))
  }

  const removePartFromInvoice = (partId) => {
    setSelectedParts(parts => parts.filter(item => item.partId !== partId))
  }

  const calculateTotals = () => {
    const subtotal = selectedParts.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0)
    const totalAmount = selectedParts.reduce((sum, item) => sum + item.totalPrice, 0)
    const totalMarkup = totalAmount - subtotal
    
    return { subtotal, totalAmount, totalMarkup }
  }

  const generateInvoice = () => {
    if (selectedParts.length === 0) {
      alert('Please select at least one part to generate an invoice.')
      return
    }

    // Validate stock availability
    for (const item of selectedParts) {
      const part = parts.find(p => p.id === item.partId)
      if (part.unitStock < item.quantity) {
        alert(`Insufficient stock for ${item.namaProduk}. Available: ${part.unitStock}, Required: ${item.quantity}`)
        return
      }
    }

    const { subtotal, totalAmount } = calculateTotals()
    
    const invoiceData = {
      items: selectedParts,
      subtotal,
      totalAmount,
      customerInfo,
      notes
    }

    const newInvoice = createInvoice(invoiceData)
    
    // Update stock levels
    selectedParts.forEach(item => {
      updateStock(item.partId, item.quantity)
    })

    setGeneratedInvoice(newInvoice)
    setShowPreview(true)
    
    // Reset form
    setSelectedParts([])
    setCustomerInfo({ 
      name: 'One X Transmission',
      phone: '+60 11-3105 1677',
      address: '15-G, JLN SG RASAU, E32/E, Jln Kebun Tambahan, Taman Perindustrian Berjaya, 40460 Shah Alam, Selangor'
    })
    setNotes('')
  }

  const { subtotal, totalAmount, totalMarkup } = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-title">Invoice Generation</h2>
          <p className="text-black-75 text-body">
            Create customer invoices with flexible markup pricing
          </p>
        </div>
        <div className="text-right">
          <div className="text-small text-black-75">Next Invoice Number</div>
          <div className="font-semibold text-primary-black">{generateInvoiceNumber()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parts Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-primary-black">Select Parts</h3>
          <PartsSelector 
            onAddPart={addPartToInvoice}
            selectedParts={selectedParts}
          />
        </div>

        {/* Invoice Builder */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-primary-black">Invoice Details</h3>
          
          {/* Selected Parts List */}
          <div className="card">
            <h4 className="font-semibold mb-4">Selected Parts ({selectedParts.length})</h4>
            
            {selectedParts.length === 0 ? (
              <p className="text-black-50 text-center py-8">
                No parts selected. Add parts from the left panel.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedParts.map((item) => (
                  <div key={item.partId} className="border border-black-10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{item.kodProduk}</div>
                        <div className="text-small text-black-75">{item.namaProduk}</div>
                      </div>
                      <button
                        onClick={() => removePartFromInvoice(item.partId)}
                        className="text-primary-red hover:bg-red-10 p-1 rounded"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-small text-black-75">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updatePartQuantity(item.partId, parseInt(e.target.value) || 1)}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="text-small text-black-75">Original Price</label>
                        <div className="p-3 bg-black-10 rounded text-small">
                                                  <div className="text-right">
                          RM{item.originalPrice.toFixed(2)}
                        </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-small text-black-75">Markup Type</label>
                        <select
                          value={item.markupType}
                          onChange={(e) => updatePartMarkup(item.partId, e.target.value, item.markupValue)}
                          className="input-field w-full"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-small text-black-75">
                          {item.markupType === 'percentage' ? 'Percentage (%)' : 'Amount (RM)'}
                        </label>
                        <input
                          type="number"
                          step={item.markupType === 'percentage' ? '0.1' : '0.01'}
                          min="0"
                          value={item.markupValue}
                          onChange={(e) => updatePartMarkup(item.partId, item.markupType, parseFloat(e.target.value) || 0)}
                          className="input-field w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-black-10">
                      <span className="text-small text-black-75">Final Price: RM{item.finalPrice.toFixed(2)}</span>
                      <span className="font-semibold text-primary-red">Total: RM{item.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="card">
            <h4 className="font-semibold mb-4">Customer Information</h4>
            <div className="space-y-3">
              <div className="border-l-4 border-primary-red pl-4">
                <div className="font-semibold text-primary-black">{customerInfo.name}</div>
                <div className="text-black-75">{customerInfo.phone}</div>
                <div className="text-black-75 whitespace-pre-line">{customerInfo.address}</div>
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          {selectedParts.length > 0 && (
            <div className="card bg-black-10">
              <h4 className="font-semibold mb-4">Invoice Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal (Original Prices):</span>
                  <span>RM{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary-red">
                  <span>Total Markup:</span>
                  <span>+RM{totalMarkup.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-black-25 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-primary-red">RM{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card">
            <h4 className="font-semibold mb-4">Additional Notes</h4>
            <textarea
              placeholder="Add any additional notes for the invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field w-full h-20 resize-none"
            />
          </div>

          {/* Generate Invoice Button */}
          <button
            onClick={generateInvoice}
            disabled={selectedParts.length === 0}
            className={`w-full py-4 rounded-lg font-semibold transition-all duration-200 ${
              selectedParts.length > 0
                ? 'btn-primary'
                : 'bg-black-25 text-black-50 cursor-not-allowed'
            }`}
          >
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && generatedInvoice && (
        <InvoicePreview
          invoice={generatedInvoice}
          onClose={() => setShowPreview(false)}
          setActiveSection={setActiveSection}
        />
      )}
    </div>
  )
}

export default InvoiceGeneration
