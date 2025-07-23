import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useProductStore, Product } from '../store/productStore';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, product }) => {
  const { updateProduct, getProductByGCode, getProductByEANCode } = useProductStore();
  const [formData, setFormData] = useState({
    g_code: '',
    ean_code: '',
    product_sku_code: '',
    name: '',
    description: '',
    image_url: '',
    category: '',
    brand: '',
    weight: '',
    dimensions: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        g_code: product.g_code,
        ean_code: product.ean_code,
        product_sku_code: product.product_sku_code || '',
        name: product.name,
        description: product.description || '',
        image_url: product.image_url || '',
        category: product.category || '',
        brand: product.brand || '',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        is_active: product.is_active,
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.g_code.trim()) {
      newErrors.g_code = 'G-Code is required';
    } else {
      const existingProduct = getProductByGCode(formData.g_code);
      if (existingProduct && existingProduct.id !== product.id) {
        newErrors.g_code = 'G-Code already exists';
      }
    }

    if (!formData.ean_code.trim()) {
      newErrors.ean_code = 'EAN Code is required';
    } else {
      const existingProduct = getProductByEANCode(formData.ean_code);
      if (existingProduct && existingProduct.id !== product.id) {
        newErrors.ean_code = 'EAN Code already exists';
      }
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateProduct(product.id, formData);
      onClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* G-Code */}
              <div>
                <label htmlFor="g_code" className="form-label">G-Code *</label>
                <input
                  type="text"
                  id="g_code"
                  name="g_code"
                  value={formData.g_code}
                  onChange={handleInputChange}
                  className={`input-field ${errors.g_code ? 'border-error-500' : ''}`}
                  placeholder="Enter G-Code"
                />
                {errors.g_code && <p className="text-error-600 text-sm mt-1">{errors.g_code}</p>}
              </div>

              {/* EAN Code */}
              <div>
                <label htmlFor="ean_code" className="form-label">EAN Code *</label>
                <input
                  type="text"
                  id="ean_code"
                  name="ean_code"
                  value={formData.ean_code}
                  onChange={handleInputChange}
                  className={`input-field ${errors.ean_code ? 'border-error-500' : ''}`}
                  placeholder="Enter EAN Code"
                />
                {errors.ean_code && <p className="text-error-600 text-sm mt-1">{errors.ean_code}</p>}
              </div>

              {/* Product Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="form-label">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input-field ${errors.name ? 'border-error-500' : ''}`}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="text-error-600 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Product SKU Code */}
              <div>
                <label htmlFor="product_sku_code" className="form-label">Product SKU Code</label>
                <input
                  type="text"
                  id="product_sku_code"
                  name="product_sku_code"
                  value={formData.product_sku_code}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter SKU code"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="form-label">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter category"
                />
              </div>

              {/* Brand */}
              <div>
                <label htmlFor="brand" className="form-label">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter brand"
                />
              </div>

              {/* Weight */}
              <div>
                <label htmlFor="weight" className="form-label">Weight</label>
                <input
                  type="text"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 500g"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label htmlFor="dimensions" className="form-label">Dimensions</label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 10x5x2 cm"
                />
              </div>

              {/* Image URL */}
              <div className="md:col-span-2">
                <label htmlFor="image_url" className="form-label">Image URL</label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter image URL"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="Enter product description"
                />
              </div>

              {/* Active Status */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active Product</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Update Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal; 