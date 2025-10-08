import PDFGenerator from '../utils/PDFGenerator'

function InvoicePreview({ invoice, onClose, isViewMode = false, setActiveSection }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    PDFGenerator.printInvoice(invoice)
  }

  const handleDownloadPDF = () => {
    PDFGenerator.downloadInvoicePDF(invoice)
  }

  return (
    <div className="fixed inset-0 bg-black-50 flex items-center justify-center p-4 z-50">
      <div className="bg-primary-white rounded-lg shadow-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-primary-white border-b border-black-10 p-6 flex justify-between items-center">
          <h3 className="text-xl font-semibold">
            {isViewMode ? 'Invoice Details' : 'Invoice Generated Successfully'}
          </h3>
          <button
            onClick={onClose}
            className="text-black-50 hover:text-primary-black text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-6" id="invoice-content">
          {/* Invoice Header */}
          <div className="border-b border-black-10 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-primary-black">INVOICE</h1>
                <p className="text-black-75 mt-1">BYKI Lite - One X Transmission</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-red">{invoice.invoiceNumber}</div>
                <div className="text-small text-black-75">{formatDate(invoice.dateCreated)}</div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {(invoice.customerInfo?.name || invoice.customerInfo?.phone || invoice.customerInfo?.address) && (
            <div className="mb-6">
              <h3 className="font-semibold text-primary-black mb-3">Bill To:</h3>
              <div className="space-y-1">
                {invoice.customerInfo.name && (
                  <div className="font-medium">{invoice.customerInfo.name}</div>
                )}
                {invoice.customerInfo.phone && (
                  <div className="text-black-75">{invoice.customerInfo.phone}</div>
                )}
                {invoice.customerInfo.address && (
                  <div className="text-black-75">{invoice.customerInfo.address}</div>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-primary-black mb-3">Items:</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-black-10">
                <thead>
                  <tr className="bg-primary-black text-primary-white">
                    <th className="table-header text-left">Product Code</th>
                    <th className="table-header text-left">Description</th>
                    <th className="table-header text-center">Qty</th>
                    <th className="table-header text-right">Unit Price</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-black-10">
                      <td className="table-cell font-semibold">{item.kodProduk}</td>
                      <td className="table-cell">{item.namaProduk}</td>
                      <td className="table-cell text-center">{item.quantity}</td>
                      <td className="table-cell text-right">RM{item.finalPrice.toFixed(2)}</td>
                      <td className="table-cell text-right font-semibold">RM{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2">
              <div className="border-t border-black-25 pt-2">
                <div className="flex justify-between py-2 text-xl font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary-red">RM{invoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-primary-black mb-3">Notes:</h3>
              <p className="text-black-75 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-black-10 pt-6 text-center text-small text-black-50">
            <p>Thank you for your business!</p>
            <p className="mt-1">Generated by BYKI Lite - One X Transmission Business System</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-primary-white border-t border-black-10 p-6">
          {!isViewMode && setActiveSection ? (
            /* New invoice buttons with history redirect */
            <div className="space-y-3">
              <div className="flex gap-4">
                <button
                  onClick={handlePrint}
                  className="btn-tertiary flex-1"
                >
                  Print
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="btn-primary flex-1"
                >
                  Download PDF
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveSection('history')
                    onClose()
                  }}
                  className="btn-primary flex-1"
                >
                  View All Invoices
                </button>
              </div>
            </div>
          ) : (
            /* View mode buttons */
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="btn-tertiary flex-1"
              >
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn-primary flex-1"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoicePreview
