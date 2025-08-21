import { createContext, useContext, useState, useEffect } from 'react'

const PartsContext = createContext()

export const usePartsContext = () => {
  const context = useContext(PartsContext)
  if (!context) {
    throw new Error('usePartsContext must be used within a PartsProvider')
  }
  return context
}

export function PartsProvider({ children }) {
  const [parts, setParts] = useState(() => {
    const saved = localStorage.getItem('mechanic-parts')
    return saved ? JSON.parse(saved) : []
  })

  // Save to localStorage whenever parts change
  useEffect(() => {
    localStorage.setItem('mechanic-parts', JSON.stringify(parts))
  }, [parts])

  const addPart = (part) => {
    const newPart = {
      id: Date.now().toString(),
      kodProduk: part.kodProduk,
      namaProduk: part.namaProduk,
      harga: parseFloat(part.harga),
      supplier: part.supplier,
      gambar: part.gambar || '',
      specification: part.specification || '',
      unitStock: parseInt(part.unitStock) || 0,
      dateAdded: new Date().toISOString()
    }
    setParts(prev => [...prev, newPart])
    return newPart
  }

  const updatePart = (id, updatedPart) => {
    setParts(prev => prev.map(part => 
      part.id === id 
        ? { 
            ...part, 
            ...updatedPart,
            harga: parseFloat(updatedPart.harga),
            unitStock: parseInt(updatedPart.unitStock) || 0,
            dateUpdated: new Date().toISOString()
          }
        : part
    ))
  }

  const deletePart = (id) => {
    setParts(prev => prev.filter(part => part.id !== id))
  }

  const updateStock = (id, quantity) => {
    setParts(prev => prev.map(part => 
      part.id === id 
        ? { ...part, unitStock: Math.max(0, part.unitStock - quantity) }
        : part
    ))
  }

  const getPartById = (id) => {
    return parts.find(part => part.id === id)
  }

  const searchParts = (query) => {
    if (!query) return parts
    const lowercaseQuery = query.toLowerCase()
    return parts.filter(part => 
      part.kodProduk.toLowerCase().includes(lowercaseQuery) ||
      part.namaProduk.toLowerCase().includes(lowercaseQuery) ||
      part.supplier.toLowerCase().includes(lowercaseQuery)
    )
  }

  const getLowStockParts = (threshold = 10) => {
    return parts.filter(part => part.unitStock <= threshold)
  }

  return (
    <PartsContext.Provider value={{
      parts,
      addPart,
      updatePart,
      deletePart,
      updateStock,
      getPartById,
      searchParts,
      getLowStockParts
    }}>
      {children}
    </PartsContext.Provider>
  )
}
