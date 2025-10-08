import jsPDF from 'jspdf'
import { logoBase64 } from '../assets/logo.js'

// Debug: Test logo import immediately
console.log('📦 PDFGenerator IMPORT TEST: Logo imported successfully!')
console.log('📦 Logo available:', !!logoBase64)
console.log('📦 Logo length:', logoBase64 ? logoBase64.length : 0)
console.log('📦 Logo preview:', logoBase64 ? logoBase64.substring(0, 100) + '...' : 'N/A')

class PDFGenerator {
  static generateCustomerInvoicePDF(invoice) {
    const doc = new jsPDF()
    
    // Set up fonts and colors
    doc.setFont('helvetica')
    
    // Header - Company Logo (replaces "One X" text)
    let logoLoaded = false
    try {
      console.log('🎯 LOGO DEBUG: Starting logo addition process...')
      console.log('🎯 Logo base64 available:', !!logoBase64)
      console.log('🎯 Logo data length:', logoBase64 ? logoBase64.length : 0)
      
      // Temporarily disable logo loading due to corrupted PNG data
      // if (logoBase64) {
      //   console.log('🎯 Adding logo to PDF at position (20, 8) with dimensions 60x24')
      //   
      //   // Extract just the base64 data without the data URL prefix
      //   const base64Data = logoBase64.replace('data:image/png;base64,', '')
      //   console.log('🎯 Extracted base64 length:', base64Data.length)
      //   
      //   // Use the base64 string directly without data URL prefix
      //   doc.addImage(base64Data, 'PNG', 20, 8, 60, 24)
      //   logoLoaded = true
      //   console.log('🎯 SUCCESS: Logo added to PDF!')
      // } else {
      //   console.error('🎯 ERROR: Logo base64 data is empty or undefined')
      // }
      
      // Force logo to false so it uses text instead
      logoLoaded = false
    } catch (error) {
      console.error('🎯 ERROR: Logo failed to load:', error)
      console.error('🎯 Error stack:', error.stack)
      logoLoaded = false
    }
    
    // Only show text if logo failed to load
    if (!logoLoaded) {
      doc.setFontSize(24)
      doc.setTextColor(220, 38, 38) // Red
      doc.text('BYKI Lite', 20, 25)
    }
    
    // Company subtitle - position it below logo/text
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Business Management System', 20, 35)
    
    // Document Title and Number - Check if this is a quotation
    doc.setFontSize(18)
    doc.setTextColor(0, 0, 0)
    const documentTitle = invoice.isQuotation || invoice.type === 'quotation' ? 'QUOTATION' : 'INVOICE'
    doc.text(documentTitle, 150, 25)
    
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    const documentNumber = invoice.isQuotation || invoice.type === 'quotation' 
      ? (invoice.quotationNumber || invoice.invoiceNumber || 'QUO-001') 
      : (invoice.invoiceNumber || 'INV-001')
    doc.text(documentNumber, 150, 32)
    
    doc.setFontSize(10)
    doc.setTextColor(102, 102, 102)
    
    // Handle invoice date safely
    let invoiceDate = new Date()
    try {
      if (invoice.dateCreated) {
        invoiceDate = new Date(invoice.dateCreated)
        if (isNaN(invoiceDate.getTime())) {
          invoiceDate = new Date()
        }
      }
    } catch (e) {
      invoiceDate = new Date()
    }
    doc.text(`Date: ${invoiceDate.toLocaleDateString('en-MY')}`, 150, 40)
    
    // Handle due date for invoices or valid until date for quotations
    if (invoice.isQuotation || invoice.type === 'quotation') {
      if (invoice.validUntil) {
        try {
          const validDate = new Date(invoice.validUntil)
          if (!isNaN(validDate.getTime())) {
            doc.text(`Valid Until: ${validDate.toLocaleDateString('en-MY')}`, 150, 47)
          }
        } catch (e) {
          // Skip valid date if invalid
        }
      }
    } else {
      if (invoice.dueDate) {
        try {
          const dueDate = new Date(invoice.dueDate)
          if (!isNaN(dueDate.getTime())) {
            doc.text(`Due: ${dueDate.toLocaleDateString('en-MY')}`, 150, 47)
          }
        } catch (e) {
          // Skip due date if invalid
        }
      }
    }
    
    let yPos = 60
    
    // Customer Information
    if (invoice.customerInfo) {
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Bill To:', 20, yPos)
      yPos += 8
      
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      if (invoice.customerInfo.name) {
        doc.text(invoice.customerInfo.name, 20, yPos)
        yPos += 6
      }
      if (invoice.customerInfo.phone) {
        doc.setTextColor(102, 102, 102)
        doc.text(invoice.customerInfo.phone, 20, yPos)
        yPos += 6
      }
      if (invoice.customerInfo.email) {
        doc.setTextColor(102, 102, 102)
        doc.text(invoice.customerInfo.email, 20, yPos)
        yPos += 6
      }
      if (invoice.customerInfo.address) {
        doc.setTextColor(102, 102, 102)
        const addressLines = doc.splitTextToSize(invoice.customerInfo.address, 80)
        doc.text(addressLines, 20, yPos)
        yPos += addressLines.length * 5
      }
      yPos += 10
    }
    
    // Vehicle Information (if provided)
    if (invoice.vehicleInfo && (invoice.vehicleInfo.make || invoice.vehicleInfo.model || invoice.vehicleInfo.plate)) {
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Vehicle:', 20, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setTextColor(102, 102, 102)
      
      const vehicleParts = []
      if (invoice.vehicleInfo.year) vehicleParts.push(invoice.vehicleInfo.year)
      if (invoice.vehicleInfo.make) vehicleParts.push(invoice.vehicleInfo.make)
      if (invoice.vehicleInfo.model) vehicleParts.push(invoice.vehicleInfo.model)
      
      if (vehicleParts.length > 0) {
        doc.text(vehicleParts.join(' '), 20, yPos)
        yPos += 6
      }
      
      if (invoice.vehicleInfo.plate) {
        doc.setTextColor(0, 0, 0)
        doc.text(`License Plate: ${invoice.vehicleInfo.plate}`, 20, yPos)
        yPos += 6
      }
      
      yPos += 4
    }
    
    // Work Description (if provided)
    if (invoice.workDescription) {
      doc.setFontSize(10)
      doc.setTextColor(102, 102, 102)
      doc.text('Work Description:', 20, yPos)
      yPos += 6
      doc.setTextColor(0, 0, 0)
      const workLines = doc.splitTextToSize(invoice.workDescription, 170)
      doc.text(workLines, 20, yPos)
      yPos += workLines.length * 5 + 10
    }
    
    // Items Table Header
    doc.setFillColor(220, 38, 38) // Red background
    doc.rect(20, yPos, 170, 10, 'F')
    
    doc.setTextColor(255, 255, 255) // White text
    doc.setFontSize(9)
    doc.text('Item', 22, yPos + 7)
    doc.text('Description', 50, yPos + 7)
    doc.text('Qty', 120, yPos + 7)
    doc.text('Rate', 140, yPos + 7)
    doc.text('Amount', 170, yPos + 7)
    
    yPos += 15
    
    // Items
    doc.setTextColor(0, 0, 0)
    let subtotal = 0
    
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 1) {
          doc.setFillColor(248, 248, 248)
          doc.rect(20, yPos - 3, 170, 10, 'F')
        }
        
        doc.setFontSize(8)
        doc.text(item.kodProduk || 'N/A', 22, yPos + 2)
        
        // Wrap long descriptions
        const description = doc.splitTextToSize(item.namaProduk || 'Unknown Item', 60)
        doc.text(description, 50, yPos + 2)
        
        doc.text((item.quantity || 1).toString(), 120, yPos + 2)
        doc.text(`RM${(item.finalPrice || 0).toFixed(2)}`, 140, yPos + 2)
        doc.text(`RM${(item.totalPrice || 0).toFixed(2)}`, 170, yPos + 2)
        
        subtotal += item.totalPrice || 0
        yPos += Math.max(10, description.length * 4)
      })
    }
    
    yPos += 10
    
    // Totals Section
    const totalsX = 130
    doc.setLineWidth(0.5)
    
    // Subtotal
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text('Subtotal:', totalsX, yPos)
    doc.text(`RM${(invoice.subtotal || subtotal).toFixed(2)}`, 175, yPos)
    yPos += 8
    
    // Discount (if applicable)
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      doc.setTextColor(34, 197, 94) // Green color
      doc.text(`Discount (${invoice.discount || 0}%):`, totalsX, yPos)
      doc.text(`-RM${invoice.discountAmount.toFixed(2)}`, 175, yPos)
      yPos += 8
      doc.setTextColor(0, 0, 0) // Reset to black
    }
    
    // Tax (if applicable)
    if (invoice.tax && invoice.tax > 0) {
      doc.text('SST (6%):', totalsX, yPos)
      doc.text(`RM${invoice.tax.toFixed(2)}`, 175, yPos)
      yPos += 8
    }
    
    // Line above total
    doc.line(totalsX, yPos, 190, yPos)
    yPos += 5
    
    // Total
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text('TOTAL:', totalsX, yPos)
    doc.text(`RM${(invoice.totalAmount || invoice.total || subtotal).toFixed(2)}`, 175, yPos)
    yPos += 10
    
    // Deposit (if applicable) and Balance Due
    if (invoice.deposit && invoice.deposit > 0) {
      doc.setFontSize(10)
      doc.setTextColor(59, 130, 246) // Blue color
      doc.text('Deposit Paid:', totalsX, yPos)
      doc.text(`-RM${invoice.deposit.toFixed(2)}`, 175, yPos)
      yPos += 8
      
      // Line above balance
      doc.setTextColor(0, 0, 0)
      doc.line(totalsX, yPos, 190, yPos)
      yPos += 5
      
      // Balance Due
      doc.setFontSize(12)
      doc.setTextColor(249, 115, 22) // Orange color
      doc.text('BALANCE DUE:', totalsX, yPos)
      doc.text(`RM${(invoice.balanceDue || 0).toFixed(2)}`, 175, yPos)
      yPos += 10
    }
    
    yPos += 10
    
    // Terms for quotations or Payment Terms for invoices
    if (invoice.isQuotation || invoice.type === 'quotation') {
      if (invoice.terms) {
        doc.setFontSize(9)
        doc.setTextColor(102, 102, 102)
        doc.text('Terms & Conditions:', 20, yPos)
        yPos += 6
        const termsLines = doc.splitTextToSize(invoice.terms, 170)
        doc.text(termsLines, 20, yPos)
        yPos += termsLines.length * 5 + 8
      }
    } else {
      if (invoice.paymentTerms) {
        doc.setFontSize(9)
        doc.setTextColor(102, 102, 102)
        doc.text(`Payment Terms: ${invoice.paymentTerms}`, 20, yPos)
        yPos += 8
      }
    }
    
    // Notes (for quotations) or Mechanic Notes (for invoices)
    if (invoice.isQuotation || invoice.type === 'quotation') {
      if (invoice.notes) {
        doc.setFontSize(9)
        doc.setTextColor(102, 102, 102)
        doc.text('Notes:', 20, yPos)
        yPos += 6
        const notesLines = doc.splitTextToSize(invoice.notes, 170)
        doc.text(notesLines, 20, yPos)
        yPos += notesLines.length * 5
      }
    } else {
      // Mechanic Notes (if provided and not customer-facing)
      if (invoice.mechanicNotes && invoice.showMechanicNotes) {
        doc.setFontSize(9)
        doc.setTextColor(102, 102, 102)
        doc.text('Notes:', 20, yPos)
        yPos += 6
        const notesLines = doc.splitTextToSize(invoice.mechanicNotes, 170)
        doc.text(notesLines, 20, yPos)
        yPos += notesLines.length * 5
      }
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(102, 102, 102)
    
    if (invoice.isQuotation || invoice.type === 'quotation') {
      doc.text('Thank you for considering One X Transmission!', 105, pageHeight - 25, { align: 'center' })
      doc.text('Gearbox Specialist - Please contact us to proceed with this quotation.', 105, pageHeight - 18, { align: 'center' })
    } else {
      doc.text('Thank you for choosing One X Transmission!', 105, pageHeight - 25, { align: 'center' })
      doc.text('Gearbox Specialist - For inquiries, please contact us at your earliest convenience.', 105, pageHeight - 18, { align: 'center' })
    }
    
    doc.text(`Generated on ${new Date().toLocaleDateString('en-MY')}`, 105, pageHeight - 10, { align: 'center' })
    
    return doc
  }

  static generateInvoicePDF(invoice) {
    const doc = new jsPDF()
    
    // Set up fonts and colors
    doc.setFont('helvetica')
    
    // Header - Company Logo (replaces "One X" text)
    let logoLoaded = false
    try {
      console.log('🎯 REGULAR PDF LOGO DEBUG: Starting logo addition process...')
      console.log('🎯 Logo base64 available:', !!logoBase64)
      console.log('🎯 Logo data length:', logoBase64 ? logoBase64.length : 0)
      
      if (logoBase64) {
        console.log('🎯 Adding logo to regular PDF at position (20, 8) with dimensions 60x24')
        
        // Extract just the base64 data without the data URL prefix
        const base64Data = logoBase64.replace('data:image/png;base64,', '')
        console.log('🎯 Extracted base64 length:', base64Data.length)
        
        // Use the base64 string directly without data URL prefix
        doc.addImage(base64Data, 'PNG', 20, 8, 60, 24)
        logoLoaded = true
        console.log('🎯 SUCCESS: Logo added to regular PDF!')
      } else {
        console.error('🎯 ERROR: Logo base64 data is empty or undefined')
      }
    } catch (error) {
      console.error('🎯 ERROR: Logo failed to load in regular PDF:', error)
      console.error('🎯 Error stack:', error.stack)
      logoLoaded = false
    }
    
    // Only show text if logo failed to load
    if (!logoLoaded) {
      doc.setFontSize(16)
      doc.setTextColor(220, 38, 38) // Red color matching your logo
      doc.text('One X', 20, 25)
    }
    
    // Company subtitle - position it below logo/text
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0) // Black
    doc.text('Transmission - Gearbox Specialist', 20, 35)
    
    // Invoice Details (Right side - moved down to avoid clash)
    doc.setFontSize(20)
    doc.setTextColor(220, 38, 38) // Red
    doc.text('INVOICE', 140, 35)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(invoice.invoiceNumber || 'INV-001', 140, 43)
    
    // Handle date safely
    let invoiceDate = new Date()
    try {
      if (invoice.dateCreated) {
        invoiceDate = new Date(invoice.dateCreated)
        if (isNaN(invoiceDate.getTime())) {
          invoiceDate = new Date()
        }
      }
    } catch (e) {
      console.warn('Invalid date in invoice.dateCreated, using current date')
      invoiceDate = new Date()
    }
    
    doc.text(`Date: ${invoiceDate.toLocaleDateString('en-MY')}`, 140, 51)
    
    // Customer Information (moved down to give more space)
    let yPos = 60
    if (invoice.customerInfo?.name || invoice.customerInfo?.phone || invoice.customerInfo?.address) {
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Bill To:', 20, yPos)
      yPos += 10
      
      if (invoice.customerInfo.name) {
        doc.setFontSize(11)
        doc.text(invoice.customerInfo.name, 20, yPos)
        yPos += 8
      }
      if (invoice.customerInfo.phone) {
        doc.setFontSize(10)
        doc.setTextColor(102, 102, 102)
        doc.text(invoice.customerInfo.phone, 20, yPos)
        yPos += 8
      }
      if (invoice.customerInfo.address) {
        doc.setFontSize(10)
        const addressLines = doc.splitTextToSize(invoice.customerInfo.address, 80)
        doc.text(addressLines, 20, yPos)
        yPos += addressLines.length * 6
      }
      yPos += 10
    } else {
      yPos += 10
    }
    
    // Items Table Header
    doc.setFillColor(0, 0, 0) // Black background
    doc.rect(20, yPos, 170, 10, 'F')
    
    doc.setTextColor(255, 255, 255) // White text
    doc.setFontSize(10)
    doc.text('Code', 22, yPos + 7)
    doc.text('Description', 45, yPos + 7)
    doc.text('Qty', 115, yPos + 7)
    doc.text('Unit Price', 140, yPos + 7)
    doc.text('Total', 170, yPos + 7)
    
    yPos += 15
    
    // Items
    doc.setTextColor(0, 0, 0)
    invoice.items.forEach((item, index) => {
      // Calculate row height based on longest description
      const productName = doc.splitTextToSize(item.namaProduk, 60) // Increased width for better wrapping
      const rowHeight = Math.max(12, productName.length * 5) // Minimum 12px height, more for wrapped text
      
      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245)
        doc.rect(20, yPos - 3, 170, rowHeight, 'F')
      }
      
      doc.setFontSize(8) // Slightly smaller for better fit
      doc.text(item.kodProduk, 22, yPos + 2)
      
      // Wrap long product names with better positioning
      doc.text(productName, 45, yPos + 2)
      
      doc.text(item.quantity.toString(), 115, yPos + 2)
      doc.text(`RM${item.finalPrice.toFixed(2)}`, 140, yPos + 2)
      
      doc.setTextColor(220, 38, 38) // Red for total
      doc.text(`RM${item.totalPrice.toFixed(2)}`, 170, yPos + 2)
      doc.setTextColor(0, 0, 0)
      
      yPos += rowHeight // Use calculated row height
    })
    
    yPos += 10
    
    // Total Amount Section
    const totalsStartX = 120
    // Total Amount
    doc.setFontSize(14)
    doc.setTextColor(220, 38, 38) // Red
    doc.text('Total Amount:', totalsStartX, yPos)
    doc.text(`RM${invoice.totalAmount.toFixed(2)}`, 180, yPos)
    
    yPos += 20
    
    // Notes (if any)
    if (invoice.notes) {
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('Notes:', 20, yPos)
      yPos += 8
      
      const notesLines = doc.splitTextToSize(invoice.notes, 170)
      doc.setTextColor(102, 102, 102)
      doc.text(notesLines, 20, yPos)
      yPos += notesLines.length * 6 + 10
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(102, 102, 102)
    doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' })
    doc.text('Generated by One X Transmission Parts System', 105, pageHeight - 12, { align: 'center' })
    
    return doc
  }
  
  static downloadInvoicePDF(invoice) {
    // Determine if this is a customer invoice or regular invoice
    const doc = invoice.customerInfo ? 
      this.generateCustomerInvoicePDF(invoice) : 
      this.generateInvoicePDF(invoice)
      
    const filename = `Invoice_${invoice.invoiceNumber || 'Unknown'}_${new Date(invoice.dateCreated || new Date()).toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }
  
  static downloadCustomerInvoicePDF(invoice) {
    const doc = this.generateCustomerInvoicePDF(invoice)
    
    // Determine document type and number for filename
    const isQuotation = invoice.isQuotation || invoice.type === 'quotation'
    const documentType = isQuotation ? 'Quotation' : 'Invoice'
    const documentNumber = isQuotation 
      ? (invoice.quotationNumber || invoice.invoiceNumber || 'Unknown')
      : (invoice.invoiceNumber || 'Unknown')
    
    const filename = `${documentType}_${documentNumber}_${invoice.customerInfo?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Customer'}_${new Date(invoice.dateCreated || new Date()).toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }
  
  static printInvoice(invoice) {
    const doc = invoice.customerInfo ? 
      this.generateCustomerInvoicePDF(invoice) : 
      this.generateInvoicePDF(invoice)
      
    const pdfBlob = doc.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    
    const printWindow = window.open(url)
    printWindow.onload = function() {
      printWindow.print()
      printWindow.onafterprint = function() {
        printWindow.close()
        URL.revokeObjectURL(url)
      }
    }
  }

  static printCustomerInvoice(invoice) {
    const doc = this.generateCustomerInvoicePDF(invoice)
    const pdfBlob = doc.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    
    const printWindow = window.open(url)
    printWindow.onload = function() {
      printWindow.print()
      printWindow.onafterprint = function() {
        printWindow.close()
        URL.revokeObjectURL(url)
      }
    }
  }
}

export default PDFGenerator
