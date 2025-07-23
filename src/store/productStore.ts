import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  g_code: string;
  ean_code: string;
  product_sku_code?: string;
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
  brand?: string;
  weight?: string;
  dimensions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductByGCode: (g_code: string) => Product | undefined;
  getProductByEANCode: (ean_code: string) => Product | undefined;
  searchProducts: (searchTerm: string) => Product[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      loading: false,
      error: null,

      addProduct: (productData) => {
        const newProduct: Product = {
          ...productData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set((state) => ({
          products: [...state.products, newProduct],
          error: null,
        }));
      },

      updateProduct: (id, productData) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id
              ? { ...product, ...productData, updated_at: new Date().toISOString() }
              : product
          ),
          error: null,
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
          error: null,
        }));
      },

      getProductByGCode: (g_code) => {
        const { products } = get();
        return products.find((product) => product.g_code === g_code);
      },

      getProductByEANCode: (ean_code) => {
        const { products } = get();
        return products.find((product) => product.ean_code === ean_code);
      },

      searchProducts: (searchTerm) => {
        const { products } = get();
        const term = searchTerm.toLowerCase();
        
        return products.filter((product) =>
          product.g_code.toLowerCase().includes(term) ||
          product.ean_code.toLowerCase().includes(term) ||
          product.name.toLowerCase().includes(term) ||
          product.product_sku_code?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term) ||
          product.brand?.toLowerCase().includes(term)
        );
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'product-storage',
    }
  )
); 