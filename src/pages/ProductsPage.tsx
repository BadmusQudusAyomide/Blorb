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
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  description: string;
  sku: string;
}

interface Category {
  id: number;
  name: string;
  productCount: number;
}

const ProductsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    sku: '',
    image: null as File | null
  });
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('all');

  // Load sample data on component mount
  useEffect(() => {
    const sampleProducts: Product[] = [
      {
        id: 1,
        name: 'Premium T-Shirt',
        price: 29.99,
        category: 'Clothing',
        stock: 45,
        image: '',
        description: 'High quality cotton t-shirt with premium stitching and durable fabric',
        sku: 'TSH-001'
      },
      {
        id: 2,
        name: 'Wireless Headphones Pro',
        price: 199.99,
        category: 'Electronics',
        stock: 12,
        image: '',
        description: 'Noise cancelling wireless headphones with 30hr battery life',
        sku: 'AUD-042'
      },
      {
        id: 3,
        name: 'Ceramic Coffee Mug',
        price: 12.50,
        category: 'Home',
        stock: 30,
        image: '',
        description: 'Handcrafted ceramic mug with ergonomic handle',
        sku: 'HOM-205'
      },
      {
        id: 4,
        name: 'Yoga Mat',
        price: 34.99,
        category: 'Fitness',
        stock: 8,
        image: '',
        description: 'Eco-friendly non-slip yoga mat with carrying strap',
        sku: 'FIT-112'
      },
      {
        id: 5,
        name: 'Smart Watch',
        price: 159.99,
        category: 'Electronics',
        stock: 0,
        image: '',
        description: 'Fitness tracker with heart rate monitor and GPS',
        sku: 'ELE-556'
      }
    ];

    const sampleCategories: Category[] = [
      { id: 1, name: 'Clothing', productCount: 1 },
      { id: 2, name: 'Electronics', productCount: 2 },
      { id: 3, name: 'Home', productCount: 1 },
      { id: 4, name: 'Fitness', productCount: 1 }
    ];

    setProducts(sampleProducts);
    setCategories(sampleCategories);

    // Set active tab based on URL
    const pathParts = location.pathname.split('/');
  if (pathParts.length > 2 && pathParts[2]) {
    setActiveTab(pathParts[2]);
  } else {
    setActiveTab('all'); // Default to 'all' when at base /products route
  }
}, [location]);
  // Handle adding a new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    const productToAdd: Product = {
      id: newId,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      stock: parseInt(newProduct.stock),
      image: newProduct.image ? URL.createObjectURL(newProduct.image) : '',
      description: newProduct.description,
      sku: newProduct.sku
    };

    setProducts([...products, productToAdd]);
    
    // Update category count
    const updatedCategories = categories.map(cat => 
      cat.name === newProduct.category 
        ? { ...cat, productCount: cat.productCount + 1 } 
        : cat
    );
    setCategories(updatedCategories);
    
    setShowAddProductModal(false);
    setNewProduct({
      name: '',
      price: '',
      category: '',
      stock: '',
      description: '',
      sku: '',
      image: null
    });
  };

  // Handle adding a new category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    
    setCategories([...categories, { id: newId, name: newCategory, productCount: 0 }]);
    setShowAddCategoryModal(false);
    setNewCategory('');
  };

  // Handle deleting a product
  const handleDeleteProduct = (id: number) => {
    const productToDelete = products.find(p => p.id === id);
    if (productToDelete) {
      // Update category count
      const updatedCategories = categories.map(cat => 
        cat.name === productToDelete.category 
          ? { ...cat, productCount: cat.productCount - 1 } 
          : cat
      );
      setCategories(updatedCategories);
    }
    
    setProducts(products.filter(product => product.id !== id));
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
    if (a[sortConfig.key as keyof Product] < b[sortConfig.key as keyof Product]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key as keyof Product] > b[sortConfig.key as keyof Product]) {
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
              {activeTab === 'categories' && (
                <button 
                  onClick={() => setShowAddCategoryModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base w-full md:w-auto justify-center"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Add Category
                </button>
              )}
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
                            <div className="flex items-center">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-10 h-10 rounded-md object-cover mr-3"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm">
                            {product.category}
                          </td>
                          <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-gray-900 dark:text-white text-sm">
                            ${product.price.toFixed(2)}
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
                              <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
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
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-10 h-10 rounded-md object-cover mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
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
                        {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {category.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Modal */}
          {showAddProductModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Image
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg dark:border-gray-700">
                          <div className="space-y-1 text-center">
                            {newProduct.image ? (
                              <>
                                <img 
                                  src={URL.createObjectURL(newProduct.image)} 
                                  alt="Preview" 
                                  className="mx-auto h-32 w-32 object-cover rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewProduct({...newProduct, image: null})}
                                  className="text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Remove image
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-center">
                                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                </div>
                                <div className="flex flex-col sm:flex-row text-sm text-gray-600 dark:text-gray-400 items-center justify-center">
                                  <label
                                    htmlFor="product-image"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none dark:bg-gray-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    <span>Upload a file</span>
                                    <input
                                      id="product-image"
                                      name="product-image"
                                      type="file"
                                      className="sr-only"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          setNewProduct({...newProduct, image: e.target.files[0]});
                                        }
                                      }}
                                    />
                                  </label>
                                  <p className="sm:pl-1 mt-1 sm:mt-0">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  PNG, JPG, GIF up to 10MB
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          id="product-name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          id="product-sku"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                          required
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          id="product-category"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Price
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
                            className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          id="product-stock"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          id="product-description"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        />
                      </div>
                    </div>
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
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;