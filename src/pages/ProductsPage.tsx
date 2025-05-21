// src/pages/ProductsPage.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Image as ImageIcon,
  X,
  MoreVertical,
  Sliders
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { uploadImage } from '../utils/cloudinary';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string;
  images: (string | File)[];
  sku: string;
  brandName: string;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  weight?: {
    value: number;
    unit: string;
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  returnPolicy?: string;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  productCount?: number;
  createdAt?: Date;
}

const ProductsPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    price: string;
    discountPrice: string;
    stock: string;
    category: string;
    images: (string | File)[];
    sku: string;
    brandName: string;
    tags: string;
    colors: string[];
    sizes: string[];
    weight: {
      value: string;
      unit: string;
    };
    dimensions: {
      length: string;
      width: string;
      height: string;
      unit: string;
    };
    returnPolicy: string;
  }>({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    images: [],
    sku: '',
    brandName: '',
    tags: '',
    colors: [],
    sizes: [],
    weight: {
      value: '',
      unit: 'kg'
    },
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    returnPolicy: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load products on component mount
  useEffect(() => {
    if (!user?.uid) return;

    // Set up real-time listener for products
    const productsRef = collection(db, 'products');
    const productsQuery = query(
      productsRef,
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Product[];
      setProducts(productsData);
    });

    // Set up real-time listener for categories
    const categoriesRef = collection(db, 'categories');
    const categoriesQuery = query(categoriesRef, orderBy('name'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Category[];
      setCategories(categoriesData);
    });

    // Set active tab based on URL
    const pathParts = location.pathname.split('/');
  if (pathParts.length > 2 && pathParts[2]) {
    setActiveTab(pathParts[2]);
  } else {
      setActiveTab('all');
    }

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [user?.uid, location]);

  // Function to generate SKU
  const generateSKU = (category: string) => {
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${randomNum}`;
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      if (newProduct.images.length + newImages.length <= 4) {
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      } else {
        alert('Maximum 4 images allowed');
      }
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Handle adding a new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      console.error('No user logged in');
      return;
    }

    try {
      // Upload images to Cloudinary first
      const imageUrls = await Promise.all(
        newProduct.images.map(async (image) => {
          if (typeof image === 'string') {
            return image; // Return existing URL
          }
          return uploadImage(image); // Upload new File
        })
      );
      
      // Add to Firestore
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        discountPrice: newProduct.discountPrice ? parseFloat(newProduct.discountPrice) : null,
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        images: imageUrls,
        sku: newProduct.sku || generateSKU(newProduct.category),
        brandName: newProduct.brandName,
        tags: newProduct.tags ? newProduct.tags.split(',').map(tag => tag.trim()) : [],
        colors: newProduct.colors,
        sizes: newProduct.sizes,
        weight: newProduct.weight.value ? {
          value: parseFloat(newProduct.weight.value),
          unit: newProduct.weight.unit
        } : null,
        dimensions: newProduct.dimensions.length ? {
          length: parseFloat(newProduct.dimensions.length),
          width: parseFloat(newProduct.dimensions.width),
          height: parseFloat(newProduct.dimensions.height),
          unit: newProduct.dimensions.unit
        } : null,
        returnPolicy: newProduct.returnPolicy || null,
        sellerId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'products'), productData);
      setShowAddProductModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        stock: '',
        category: '',
        images: [],
        sku: '',
        brandName: '',
        tags: '',
        colors: [],
        sizes: [],
        weight: {
          value: '',
          unit: 'kg'
        },
        dimensions: {
          length: '',
          width: '',
          height: '',
          unit: 'cm'
        },
        returnPolicy: ''
      });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  // Handle adding a new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoriesRef = collection(db, 'categories');
      await addDoc(categoriesRef, {
        name: newCategory,
        description: '',
        imageUrl: 'https://example.com/placeholder.jpg',
        createdAt: new Date(),
        productCount: 0
      });
      
    setShowAddCategoryModal(false);
    setNewCategory('');
    } catch (error) {
      console.error('Error adding category:', error);
      // You might want to show an error message to the user here
    }
  };

  // Handle editing a product
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    try {
      // Upload new images if any
      const newImageUrls = await Promise.all(
        editingProduct.images
          .filter((img): img is File => {
            if (typeof img === 'string') return false;
            return img instanceof File;
          })
          .map(img => uploadImage(img))
      );

      // Keep existing image URLs
      const existingImageUrls = editingProduct.images
        .filter((img): img is string => typeof img === 'string');

      // Combine all image URLs
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      // Update in Firestore
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        name: editingProduct.name,
        price: editingProduct.price.toString(),
        discountPrice: editingProduct.discountPrice ? editingProduct.discountPrice.toString() : null,
        category: editingProduct.category,
        stock: editingProduct.stock.toString(),
        images: allImageUrls,
        description: editingProduct.description,
        sku: editingProduct.sku,
        brandName: editingProduct.brandName,
        tags: Array.isArray(editingProduct.tags) ? editingProduct.tags : [],
        colors: editingProduct.colors || [],
        sizes: editingProduct.sizes || [],
        weight: editingProduct.weight ? {
          value: editingProduct.weight.value ? editingProduct.weight.value.toString() : null,
          unit: editingProduct.weight.unit
        } : null,
        dimensions: editingProduct.dimensions ? {
          length: editingProduct.dimensions.length ? editingProduct.dimensions.length.toString() : null,
          width: editingProduct.dimensions.width ? editingProduct.dimensions.width.toString() : null,
          height: editingProduct.dimensions.height ? editingProduct.dimensions.height.toString() : null,
          unit: editingProduct.dimensions.unit
        } : null,
        returnPolicy: editingProduct.returnPolicy || null,
        updatedAt: new Date()
      });

      setShowEditModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      // You might want to show an error message to the user here
    }
  };

  // Handle starting edit mode
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '0',
      discountPrice: product.discountPrice?.toString() || '',
      stock: product.stock?.toString() || '0',
      category: product.category || '',
      images: product.images || [],
      sku: product.sku || '',
      brandName: product.brandName || '',
      tags: product.tags?.join(', ') || '',
      colors: product.colors || [],
      sizes: product.sizes || [],
      weight: product.weight ? {
        value: product.weight.value?.toString() || '0',
        unit: product.weight.unit || 'kg'
      } : { value: '0', unit: 'kg' },
      dimensions: product.dimensions ? {
        length: product.dimensions.length?.toString() || '0',
        width: product.dimensions.width?.toString() || '0',
        height: product.dimensions.height?.toString() || '0',
        unit: product.dimensions.unit || 'cm'
      } : { length: '0', width: '0', height: '0', unit: 'cm' },
      returnPolicy: product.returnPolicy || ''
    });
    setShowEditModal(true);
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    if (!user?.uid) {
      console.error('No user logged in');
      return;
    }

    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const productRef = doc(db, 'products', productId);
        await deleteDoc(productRef);
      } catch (error) {
        console.error('Error deleting product:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const categoryRef = doc(db, 'categories', categoryId);
      await deleteDoc(categoryRef);
      // The UI will update automatically thanks to the onSnapshot listener
    } catch (error) {
      console.error('Error deleting category:', error);
      // You might want to show an error message to the user here
    }
  };

  // Handle sorting
  const requestSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof Product];
    const bValue = b[sortConfig.key as keyof Product];
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Filter products based on search term and filters
  const filteredProducts = sortedProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategoryFilter === 'all' || 
      product.category === selectedCategoryFilter;
    
    const matchesStock = 
      selectedStockFilter === 'all' ||
      (selectedStockFilter === 'inStock' && product.stock > 0) ||
      (selectedStockFilter === 'outOfStock' && product.stock === 0) ||
      (selectedStockFilter === 'lowStock' && product.stock > 0 && product.stock <= 10);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Get unique categories for filter
  const uniqueCategories = ['all', ...new Set(products.map(p => p.category))];

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-150">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {activeTab === 'all' && 'Manage your product catalog'}
                {activeTab === 'inventory' && 'Track and update inventory levels'}
                {activeTab === 'categories' && 'Organize products by categories'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base w-full md:w-auto justify-center"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Add Product
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700 mb-6">
            <Link
  to="/products"
  className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
>
  All Products
</Link>
            <Link
              to="/products/inventory"
              className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'inventory' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Inventory
            </Link>
            <Link
              to="/products/categories"
              className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'categories' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Categories
            </Link>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-sm"
              >
                <Sliders className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                Filters
              </button>
              
              <button className="hidden md:flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-sm">
                <Filter className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                Filters
              </button>
              
              <div className="relative hidden md:block">
                <select
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.filter(c => c !== 'all').map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative hidden md:block">
                <select
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value)}
                >
                  <option value="all">All Stock</option>
                  <option value="inStock">In Stock</option>
                  <option value="lowStock">Low Stock</option>
                  <option value="outOfStock">Out of Stock</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile filters */}
          {showMobileFilters && (
            <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    {uniqueCategories.filter(c => c !== 'all').map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    value={selectedStockFilter}
                    onChange={(e) => setSelectedStockFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="inStock">In Stock</option>
                    <option value="lowStock">Low Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'all' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort('name')}
                        >
                          Product
                          {sortConfig.key === 'name' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-1 w-3 h-3" /> : 
                            <ChevronDown className="ml-1 w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort('category')}
                        >
                          Category
                          {sortConfig.key === 'category' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-1 w-3 h-3" /> : 
                            <ChevronDown className="ml-1 w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort('price')}
                        >
                          Price
                          {sortConfig.key === 'price' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-1 w-3 h-3" /> : 
                            <ChevronDown className="ml-1 w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort('stock')}
                        >
                          Stock
                          {sortConfig.key === 'stock' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="ml-1 w-3 h-3" /> : 
                            <ChevronDown className="ml-1 w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {product.images.length > 0 && typeof product.images[0] === 'string' ? (
                                <img 
                                    src={product.images[0]} 
                                  alt={product.name} 
                                    className="w-12 h-12 rounded-md object-cover"
                                />
                              ) : (
                                  <div className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.sku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm">
                            {product.category}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                            ${formatPrice(product.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              product.stock > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-2">
                              <button 
                                onClick={() => startEdit(product)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Edit className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                              <button className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No products found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-medium">{filteredProducts.length}</span> of <span className="font-medium">{products.length}</span> products
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {product.images.length > 0 && typeof product.images[0] === 'string' ? (
                                <img 
                                  src={product.images[0]} 
                                alt={product.name} 
                                  className="w-12 h-12 rounded-md object-cover"
                              />
                            ) : (
                                <div className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {product.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            value={product.stock}
                            onChange={(e) => {
                              const updatedProducts = products.map(p => 
                                p.id === product.id ? { ...p, stock: parseInt(e.target.value) || 0 } : p
                              );
                              setProducts(updatedProducts);
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            product.stock > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          Today
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm">
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{category.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {category.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Link 
                      to="/products" 
                      onClick={() => setSelectedCategoryFilter(category.name)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      View products
                    </Link>
                    {category.imageUrl && (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Modal */}
          {showAddProductModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add New Product</h3>
                    <button 
                      onClick={() => setShowAddProductModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleAddProduct}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                      {/* Required Fields Section */}
                      <div className="col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Required Information</h4>
                      </div>

                      {/* Product Name */}
                      <div className="col-span-2">
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="product-name"
                          placeholder="e.g., Premium Cotton T-Shirt"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                                </div>

                      {/* Product Description */}
                      <div className="col-span-2">
                        <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="product-description"
                          rows={4}
                          placeholder="Detailed description of the product..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          required
                        />
                      </div>

                      {/* Price and Discount Price */}
                      <div className="col-span-1">
                        <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Regular Price <span className="text-red-500">*</span>
                                  </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                          <input
                            type="number"
                            id="product-price"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-discount-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Discount Price
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                        <input
                            type="number"
                            id="product-discount-price"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.discountPrice}
                            onChange={(e) => setNewProduct({...newProduct, discountPrice: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* Stock and Category */}
                      <div className="col-span-1">
                        <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="product-stock"
                          min="0"
                          placeholder="Available quantity"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                          required
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="product-category"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.category}
                          onChange={(e) => {
                            const category = e.target.value;
                            setNewProduct(prev => ({
                              ...prev,
                              category,
                              sku: generateSKU(category)
                            }));
                          }}
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* SKU and Brand Name */}
                      <div className="col-span-1">
                        <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="product-sku"
                            placeholder="Auto-generated SKU"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setNewProduct(prev => ({
                              ...prev,
                              sku: generateSKU(prev.category)
                            }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          </div>
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Brand Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="product-brand"
                          placeholder="Enter brand name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.brandName}
                          onChange={(e) => setNewProduct({...newProduct, brandName: e.target.value})}
                          required
                        />
                      </div>

                      {/* Product Images */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product Images <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(Max 4 images)</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          {newProduct.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {newProduct.images.length < 4 && (
                            <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                              <label className="cursor-pointer text-center p-4">
                                <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                                <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                  multiple
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Optional Fields Section */}
                      <div className="col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information (Optional)</h4>
                      </div>

                      {/* Tags */}
                      <div className="col-span-2">
                        <label htmlFor="product-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tags
                        </label>
                        <input
                          type="text"
                          id="product-tags"
                          placeholder="Enter tags separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.tags}
                          onChange={(e) => setNewProduct({...newProduct, tags: e.target.value})}
                        />
                      </div>

                      {/* Colors and Sizes */}
                      <div className="col-span-1">
                        <label htmlFor="product-colors" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Colors
                        </label>
                        <input
                          type="text"
                          id="product-colors"
                          placeholder="Enter colors separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.colors.join(', ')}
                          onChange={(e) => setNewProduct({...newProduct, colors: e.target.value.split(',').map(c => c.trim())})}
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-sizes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Sizes
                        </label>
                        <input
                          type="text"
                          id="product-sizes"
                          placeholder="Enter sizes separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.sizes.join(', ')}
                          onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value.split(',').map(s => s.trim())})}
                        />
                      </div>

                      {/* Weight and Dimensions */}
                      <div className="col-span-1">
                        <label htmlFor="product-weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Weight
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            id="product-weight"
                            min="0"
                            step="0.01"
                            placeholder="Weight"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.weight.value}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              weight: { ...newProduct.weight, value: e.target.value }
                            })}
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.weight.unit}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              weight: { ...newProduct.weight, unit: e.target.value }
                            })}
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Dimensions
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                        <input
                          type="number"
                            placeholder="L"
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.length}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, length: e.target.value }
                            })}
                          />
                          <input
                            type="number"
                            placeholder="W"
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.width}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, width: e.target.value }
                            })}
                          />
                          <input
                            type="number"
                            placeholder="H"
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.height}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, height: e.target.value }
                            })}
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.unit}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, unit: e.target.value }
                            })}
                          >
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                            <option value="in">in</option>
                            <option value="ft">ft</option>
                          </select>
                        </div>
                      </div>

                      {/* Return Policy */}
                      <div className="col-span-2">
                        <label htmlFor="return-policy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Return Policy
                        </label>
                        <textarea
                          id="return-policy"
                          rows={3}
                          placeholder="Enter your return policy details..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.returnPolicy}
                          onChange={(e) => setNewProduct({...newProduct, returnPolicy: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddProductModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Add Category Modal */}
          {showAddCategoryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md">
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add New Category</h3>
                    <button 
                      onClick={() => setShowAddCategoryModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleAddCategory}>
                    <div className="mb-6">
                      <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        id="category-name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Add Category
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Product</h3>
                    <button 
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingProduct(null);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleEditProduct}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                      {/* Required Fields Section */}
                      <div className="col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Required Information</h4>
                      </div>

                      {/* Product Name */}
                      <div className="col-span-2">
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="product-name"
                          placeholder="e.g., Premium Cotton T-Shirt"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                      </div>

                      {/* Product Description */}
                      <div className="col-span-2">
                        <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="product-description"
                          rows={4}
                          placeholder="Detailed description of the product..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          required
                        />
                      </div>

                      {/* Price and Discount Price */}
                      <div className="col-span-1">
                        <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Regular Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="product-price"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-discount-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Discount Price
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="product-discount-price"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.discountPrice}
                            onChange={(e) => setNewProduct({...newProduct, discountPrice: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* Stock and Category */}
                      <div className="col-span-1">
                        <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="product-stock"
                          min="0"
                          placeholder="Available quantity"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                          required
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="product-category"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.category}
                          onChange={(e) => {
                            const category = e.target.value;
                            setNewProduct(prev => ({
                              ...prev,
                              category,
                              sku: generateSKU(category)
                            }));
                          }}
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* SKU and Brand Name */}
                      <div className="col-span-1">
                        <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="product-sku"
                            placeholder="Auto-generated SKU"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setNewProduct(prev => ({
                              ...prev,
                              sku: generateSKU(prev.category)
                            }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Brand Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="product-brand"
                          placeholder="Enter brand name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.brandName}
                          onChange={(e) => setNewProduct({...newProduct, brandName: e.target.value})}
                          required
                        />
                      </div>

                      {/* Product Images */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product Images <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(Max 4 images)</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          {newProduct.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {newProduct.images.length < 4 && (
                            <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                              <label className="cursor-pointer text-center p-4">
                                <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                                <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                  multiple
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Optional Fields Section */}
                      <div className="col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information (Optional)</h4>
                      </div>

                      {/* Tags */}
                      <div className="col-span-2">
                        <label htmlFor="product-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tags
                        </label>
                        <input
                          type="text"
                          id="product-tags"
                          placeholder="Enter tags separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.tags}
                          onChange={(e) => setNewProduct({...newProduct, tags: e.target.value})}
                        />
                      </div>

                      {/* Colors and Sizes */}
                      <div className="col-span-1">
                        <label htmlFor="product-colors" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Colors
                        </label>
                        <input
                          type="text"
                          id="product-colors"
                          placeholder="Enter colors separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.colors.join(', ')}
                          onChange={(e) => setNewProduct({...newProduct, colors: e.target.value.split(',').map(c => c.trim())})}
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="product-sizes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Sizes
                        </label>
                        <input
                          type="text"
                          id="product-sizes"
                          placeholder="Enter sizes separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.sizes.join(', ')}
                          onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value.split(',').map(s => s.trim())})}
                        />
                      </div>

                      {/* Weight and Dimensions */}
                      <div className="col-span-1">
                        <label htmlFor="product-weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Weight
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            id="product-weight"
                            min="0"
                            step="0.01"
                            placeholder="Weight"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.weight.value}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              weight: { ...newProduct.weight, value: e.target.value }
                            })}
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.weight.unit}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              weight: { ...newProduct.weight, unit: e.target.value }
                            })}
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Dimensions
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="number"
                            placeholder="L"
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.length}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, length: e.target.value }
                            })}
                          />
                          <input
                            type="number"
                            placeholder="W"
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.width}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, width: e.target.value }
                            })}
                          />
                          <input
                            type="number"
                            placeholder="H"
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.height}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, height: e.target.value }
                            })}
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.dimensions.unit}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              dimensions: { ...newProduct.dimensions, unit: e.target.value }
                            })}
                          >
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                            <option value="in">in</option>
                            <option value="ft">ft</option>
                          </select>
                        </div>
                      </div>

                      {/* Return Policy */}
                      <div className="col-span-2">
                        <label htmlFor="return-policy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Return Policy
                        </label>
                        <textarea
                          id="return-policy"
                          rows={3}
                          placeholder="Enter your return policy details..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.returnPolicy}
                          onChange={(e) => setNewProduct({...newProduct, returnPolicy: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingProduct(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Update Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;