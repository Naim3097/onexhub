import { usePartsContext } from '../context/PartsContext'

function PartsTable({ parts, onEditPart }) {
  const { deletePart } = usePartsContext()

  const handleDelete = (part) => {
    if (window.confirm(`Are you sure you want to delete ${part.namaProduk}?`)) {
      deletePart(part.id)
    }
  }

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out', fullLabel: 'Out of Stock', className: 'bg-primary-red text-primary-white' }
    if (stock <= 10) return { label: 'Low', fullLabel: 'Low Stock', className: 'bg-red-light text-primary-white' }
    return { label: 'OK', fullLabel: 'In Stock', className: 'bg-primary-black text-primary-white' }
  }

  if (parts.length === 0) {
    return (
      <div className="card text-center py-8 sm:py-12">
        <div className="text-black-50 text-sm sm:text-base mb-4">No parts found.</div>
        <p className="text-xs sm:text-sm text-black-75">
          Add your first part to get started with inventory management.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card View - Stack on small screens */}
      <div className="lg:hidden space-y-3">
        {parts.map((part) => {
          const stockStatus = getStockStatus(part.unitStock)
          return (
            <div key={part.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-black-10 rounded border border-black-25 flex-shrink-0 flex items-center justify-center">
                  {part.gambar ? (
                    <img 
                      src={part.gambar} 
                      alt={part.namaProduk}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-black-50 text-xs">No Image</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-semibold text-sm sm:text-base truncate">{part.kodProduk}</div>
                      <div className="text-xs sm:text-sm text-black-75 truncate">{part.namaProduk}</div>
                      <div className="text-xs text-black-50 truncate">{part.supplier}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-sm sm:text-base">RM{part.harga.toFixed(2)}</div>
                      <div className="text-xs text-black-75">Stock: {part.unitStock}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${stockStatus.className}`}>
                      <span className="sm:hidden">{stockStatus.label}</span>
                      <span className="hidden sm:inline">{stockStatus.fullLabel}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditPart(part)}
                        className="bg-black-10 text-primary-black px-3 py-1 rounded text-xs sm:text-sm font-medium hover:bg-black-25 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(part)}
                        className="text-primary-red hover:bg-red-10 px-2 py-1 rounded transition-colors text-xs sm:text-sm"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table View - Hidden on mobile and tablet */}
      <div className="hidden lg:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black-10">
                <th className="table-header text-left">Image</th>
                <th className="table-header text-left">Product Code</th>
                <th className="table-header text-left">Product Name</th>
                <th className="table-header text-left">Supplier</th>
                <th className="table-header text-right">Price</th>
                <th className="table-header text-center">Stock</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => {
                const stockStatus = getStockStatus(part.unitStock)
                return (
                  <tr key={part.id} className="border-b border-black-10 hover:bg-black-10 transition-colors">
                    <td className="table-cell">
                      <div className="w-12 h-12 bg-black-10 rounded border border-black-25 flex items-center justify-center">
                        {part.gambar ? (
                          <img 
                            src={part.gambar} 
                            alt={part.namaProduk}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-black-50 text-xs">No Image</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold">{part.kodProduk}</div>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium">{part.namaProduk}</div>
                      {part.specification && (
                        <div className="text-sm text-black-75 mt-1">
                          {part.specification.length > 50 
                            ? `${part.specification.substring(0, 50)}...`
                            : part.specification
                          }
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div>{part.supplier}</div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="font-semibold">RM{part.harga.toFixed(2)}</div>
                    </td>
                    <td className="table-cell text-center">
                      <div className="font-semibold">{part.unitStock}</div>
                    </td>
                    <td className="table-cell text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${stockStatus.className}`}>
                        {stockStatus.fullLabel}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEditPart(part)}
                          className="bg-black-10 text-primary-black px-3 py-1 rounded text-sm font-medium hover:bg-black-25 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
                          className="text-primary-red hover:bg-red-10 px-2 py-1 rounded transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-center text-xs sm:text-sm text-black-75 mt-4">
        Showing {parts.length} part{parts.length !== 1 ? 's' : ''}
      </div>
    </>
  )
}

export default PartsTable
