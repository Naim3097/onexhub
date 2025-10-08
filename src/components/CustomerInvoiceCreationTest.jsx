function CustomerInvoiceCreationTest({ setActiveSection }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-black">Customer Invoicing Test</h2>
          <p className="text-black-75 text-sm sm:text-base">
            Testing if navigation works
          </p>
        </div>
        <button
          onClick={() => setActiveSection('customers')}
          className="btn-secondary text-sm sm:text-base"
        >
          Back to Customers
        </button>
      </div>

      <div className="bg-primary-white rounded-lg border border-black-10 p-4 sm:p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-primary-black mb-2">
            Navigation Test Success!
          </h3>
          <p className="text-black-75 max-w-md mx-auto">
            If you can see this page, navigation is working. The issue might be with the original component.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CustomerInvoiceCreationTest