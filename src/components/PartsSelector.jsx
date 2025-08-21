import { useState } from 'react'
import { usePartsContext } from '../context/PartsContext'

function PartsSelector({ onAddPart, selectedParts }) {
  const { parts, searchParts } = usePartsContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [quantities, setQuantities] = useState({})

  const displayedParts = searchParts(searchQuery)
  
  const handleAddPart = (part) => {
    const quantity = quantities[part.id] || 1
    onAddPart(part, quantity)
    // Reset quantity after adding
    setQuantities({ ...quantities, [part.id]: 1 })
  }

  const getPartQuantity = (partId) => {
    return quantities[partId] || 1
  }

  const setPartQuantity = (partId, quantity) => {
    setQuantities({ ...quantities, [partId]: Math.max(1, quantity) })
  }

  const isPartSelected = (partId) => {
    return selectedParts.some(item => item.partId === partId)
  }

  const getAvailableStock = (part) => {
    const selectedItem = selectedParts.find(item => item.partId === part.id)
    const alreadySelected = selectedItem ? selectedItem.quantity : 0
    return part.unitStock - alreadySelected
  }

  if (parts.length === 0) {
    return (
      <div className="card text-center py-8">
        <div className="text-black-50 text-body mb-2">No parts in inventory</div>
        <p className="text-small text-black-75">
          Add parts in the Parts Management section first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Search parts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full"
        />
      </div>

      <div className="card max-h-96 overflow-y-auto">
        {displayedParts.length === 0 ? (
          <div className="text-center py-8 text-black-50">
            No parts found matching your search.
          </div>
        ) : (
          <div className="space-y-3">
            {displayedParts.map((part) => {
              const availableStock = getAvailableStock(part)
              const canAddMore = availableStock > 0
              const selectedQuantity = getPartQuantity(part.id)

              return (
                <div
                  key={part.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isPartSelected(part.id)
                      ? 'border-primary-red bg-red-10'
                      : 'border-black-10 hover:border-black-25'
                  }`}
                >
                  <div className="space-y-3">
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
                            <div className="font-semibold text-primary-black truncate">{part.kodProduk}</div>
                            <div className="text-small text-black-75 truncate">{part.namaProduk}</div>
                            <div className="text-small text-black-50 truncate">{part.supplier}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-primary-black">RM{part.harga.toFixed(2)}</div>
                            <div className={`text-small ${
                              part.unitStock <= 0 ? 'text-primary-red' :
                              part.unitStock <= 10 ? 'text-red-light' : 'text-black-75'
                            }`}>
                              Stock: {part.unitStock}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {part.unitStock <= 0 ? (
                      <div className="space-y-2">
                        <div className="text-center">
                          <span className="text-primary-red font-medium">Out of Stock</span>
                        </div>
                        <button 
                          disabled
                          className="w-full bg-black-25 text-black-50 px-4 py-2 rounded cursor-not-allowed min-h-[44px]"
                        >
                          Cannot Add
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="text-small text-black-75">Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            max={availableStock}
                            value={selectedQuantity}
                            onChange={(e) => setPartQuantity(part.id, parseInt(e.target.value) || 1)}
                            className="input-field w-20 text-center py-1"
                          />
                          <span className="text-small text-black-50">
                            (Available: {availableStock})
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleAddPart(part)}
                          disabled={!canAddMore || selectedQuantity > availableStock}
                          className={`w-full px-4 py-2 rounded font-medium transition-colors min-h-[44px] ${
                            canAddMore && selectedQuantity <= availableStock
                              ? 'btn-primary text-small'
                              : 'bg-black-25 text-black-50 cursor-not-allowed'
                          }`}
                        >
                          {isPartSelected(part.id) ? 'Add More' : 'Add to Invoice'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="text-center text-small text-black-75">
        Showing {displayedParts.length} of {parts.length} parts
      </div>
    </div>
  )
}

export default PartsSelector
