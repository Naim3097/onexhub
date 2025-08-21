import { createContext, useContext, useState, useEffect } from 'react'

const InvoiceContext = createContext()

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext)
  if (!context) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider')
  }
  return context
}

export function InvoiceProvider({ children }) {
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('mechanic-invoices')
    return saved ? JSON.parse(saved) : []
  })

  const [invoiceCounter, setInvoiceCounter] = useState(() => {
    const saved = localStorage.getItem('invoice-counter')
    return saved ? parseInt(saved) : 1
  })

  // Save to localStorage whenever invoices change
  useEffect(() => {
    localStorage.setItem('mechanic-invoices', JSON.stringify(invoices))
  }, [invoices])

  useEffect(() => {
    localStorage.setItem('invoice-counter', invoiceCounter.toString())
  }, [invoiceCounter])

  const generateInvoiceNumber = () => {
    const currentYear = new Date().getFullYear()
    const paddedCounter = invoiceCounter.toString().padStart(4, '0')
    return `INV-${currentYear}-${paddedCounter}`
  }

  const createInvoice = (invoiceData) => {
    const newInvoice = {
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(),
      dateCreated: new Date().toISOString(),
      items: invoiceData.items.map(item => ({
        partId: item.partId,
        kodProduk: item.kodProduk,
        namaProduk: item.namaProduk,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        markupType: item.markupType, // 'percentage' or 'fixed'
        markupValue: item.markupValue,
        finalPrice: item.finalPrice,
        totalPrice: item.totalPrice
      })),
      subtotal: invoiceData.subtotal,
      totalAmount: invoiceData.totalAmount,
      customerInfo: invoiceData.customerInfo || {},
      notes: invoiceData.notes || ''
    }

    setInvoices(prev => [...prev, newInvoice])
    setInvoiceCounter(prev => prev + 1)
    
    return newInvoice
  }

  const getInvoiceById = (id) => {
    return invoices.find(invoice => invoice.id === id)
  }

  const searchInvoices = (query) => {
    if (!query) return invoices
    const lowercaseQuery = query.toLowerCase()
    return invoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(lowercaseQuery) ||
      (invoice.customerInfo?.name && invoice.customerInfo.name.toLowerCase().includes(lowercaseQuery)) ||
      invoice.items.some(item => 
        item.kodProduk.toLowerCase().includes(lowercaseQuery) ||
        item.namaProduk.toLowerCase().includes(lowercaseQuery)
      )
    )
  }

  const getInvoicesByDateRange = (startDate, endDate) => {
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.dateCreated)
      return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate)
    })
  }

  const calculateInvoiceStats = () => {
    const totalInvoices = invoices.length
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0
    
    return {
      totalInvoices,
      totalRevenue,
      averageInvoiceValue
    }
  }

  return (
    <InvoiceContext.Provider value={{
      invoices,
      createInvoice,
      getInvoiceById,
      searchInvoices,
      getInvoicesByDateRange,
      calculateInvoiceStats,
      generateInvoiceNumber: () => `INV-${new Date().getFullYear()}-${invoiceCounter.toString().padStart(4, '0')}`
    }}>
      {children}
    </InvoiceContext.Provider>
  )
}
