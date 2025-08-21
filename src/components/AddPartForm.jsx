import { useState } from 'react'
import { usePartsContext } from '../context/PartsContext'

function AddPartForm({ onClose }) {
  const { addPart } = usePartsContext()
  const [formData, setFormData] = useState({
    kodProduk: '',
    namaProduk: '',
    harga: '',
    supplier: '',
    gambar: '',
    specification: '',
    unitStock: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.kodProduk.trim()) newErrors.kodProduk = 'Product code is required'
    if (!formData.namaProduk.trim()) newErrors.namaProduk = 'Product name is required'
    if (!formData.harga || parseFloat(formData.harga) <= 0) newErrors.harga = 'Valid price is required'
    if (!formData.supplier.trim()) newErrors.supplier = 'Supplier is required'
    if (!formData.unitStock || parseInt(formData.unitStock) < 0) newErrors.unitStock = 'Valid stock count is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      addPart(formData)
      onClose()
    } catch (error) {
      console.error('Error adding part:', error)
      alert('Error adding part. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target.result
        setImagePreview(imageUrl)
        setFormData({ ...formData, gambar: imageUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setImagePreview('')
    setFormData({ ...formData, gambar: '' })
    // Reset file input
    const fileInput = document.getElementById('image-upload')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content sm:max-w-2xl">
        {/* Modal Header - Sticky on mobile */}
        <div className="sticky top-0 bg-primary-white border-b border-black-10 p-4 sm:p-6 z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-semibold">Add New Part</h3>
            <button
              onClick={onClose}
              className="text-black-50 hover:text-primary-black text-2xl leading-none p-2 -m-2"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Mobile-first form layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Product Code *
              </label>
              <input
                type="text"
                value={formData.kodProduk}
                onChange={(e) => handleChange('kodProduk', e.target.value)}
                className={`input-field ${errors.kodProduk ? 'border-primary-red' : ''}`}
                placeholder="e.g., BRK001"
              />
              {errors.kodProduk && (
                <p className="text-primary-red text-sm mt-1">{errors.kodProduk}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Price (RM) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={formData.harga}
                onChange={(e) => handleChange('harga', e.target.value)}
                className={`input-field ${errors.harga ? 'border-primary-red' : ''}`}
                placeholder="0.00"
              />
              {errors.harga && (
                <p className="text-primary-red text-sm mt-1">{errors.harga}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-black mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.namaProduk}
              onChange={(e) => handleChange('namaProduk', e.target.value)}
              className={`input-field ${errors.namaProduk ? 'border-primary-red' : ''}`}
              placeholder="e.g., Brake Pads - Front"
            />
            {errors.namaProduk && (
              <p className="text-primary-red text-sm mt-1">{errors.namaProduk}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Supplier *
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                className={`input-field ${errors.supplier ? 'border-primary-red' : ''}`}
                placeholder="e.g., AutoParts Co."
              />
              {errors.supplier && (
                <p className="text-primary-red text-sm mt-1">{errors.supplier}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-black mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={formData.unitStock}
                onChange={(e) => handleChange('unitStock', e.target.value)}
                className={`input-field ${errors.unitStock ? 'border-primary-red' : ''}`}
                placeholder="0"
              />
              {errors.unitStock && (
                <p className="text-primary-red text-sm mt-1">{errors.unitStock}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-black mb-2">
              Product Image <span className="text-black-50">(Optional)</span>
            </label>
            
            {/* Image Preview */}
            {(imagePreview || formData.gambar) && (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img 
                    src={imagePreview || formData.gambar} 
                    alt="Product preview" 
                    className="w-24 h-24 object-cover border border-black-25 rounded"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div className="w-24 h-24 bg-black-10 border border-black-25 rounded flex items-center justify-center text-black-50 text-sm" style={{display: 'none'}}>
                    Invalid Image
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-primary-red text-primary-white rounded-full text-sm hover:bg-red-700 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* File Upload Option */}
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label 
                  htmlFor="image-upload"
                  className="inline-flex items-center px-4 py-2 border border-black-25 rounded-md text-sm font-medium text-primary-black bg-primary-white hover:bg-black-5 cursor-pointer transition-colors"
                >
                  📁 Upload from Device
                </label>
                <p className="text-xs text-black-75 mt-1">
                  Max 5MB • JPG, PNG, GIF supported
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-black-25"></div>
                <span className="text-sm text-black-50">OR</span>
                <div className="flex-1 h-px bg-black-25"></div>
              </div>

              <div>
                <input
                  type="url"
                  value={selectedFile ? '' : formData.gambar}
                  onChange={(e) => {
                    if (!selectedFile) {
                      handleChange('gambar', e.target.value)
                      setImagePreview('')
                    }
                  }}
                  disabled={!!selectedFile}
                  className={`input-field ${selectedFile ? 'bg-black-5 text-black-50' : ''}`}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-black-75 mt-1">
                  Provide a URL to an image of the part
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-black mb-2">
              Specifications <span className="text-black-50">(Optional)</span>
            </label>
            <textarea
              value={formData.specification}
              onChange={(e) => handleChange('specification', e.target.value)}
              className="input-field h-20 resize-none"
              placeholder="Technical details, compatibility, dimensions, etc."
            />
          </div>

          {/* Sticky bottom buttons on mobile */}
          <div className="sticky bottom-0 bg-primary-white border-t border-black-10 pt-4 sm:pt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary order-1 sm:order-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="loading-spinner"></div>
                    Adding Part...
                  </span>
                ) : (
                  'Add Part'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPartForm
