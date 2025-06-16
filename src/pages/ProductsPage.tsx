// src/pages/ProductsPage.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  ImageIcon,
  X,
  Sliders,
} from "lucide-react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import Sidebar from "../components/dashboard/Sidebar";
import TopBar from "../components/dashboard/TopBar";
import { uploadImage } from "../utils/cloudinary";
import { useAuth } from "../context/AuthContext";
import ProfileCompletionModal from "../components/modals/ProfileCompletionModal";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string;
  subcategory?: string;
  images: string[];
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
  subcategories?: {
    name: string;
    imageUrl: string;
  }[];
}

interface NewProductForm {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  category: string;
  subcategory: string;
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
}

const ProductsPage = () => {
  const location = useLocation();
  const { user, seller } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] =
    useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    category: "",
    subcategory: "",
    images: [],
    sku: "",
    brandName: "",
    tags: "",
    colors: [],
    sizes: [],
    weight: {
      value: "",
      unit: "kg",
    },
    dimensions: {
      length: "",
      width: "",
      height: "",
      unit: "cm",
    },
    returnPolicy: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>("all");

  // Load products on component mount
  useEffect(() => {
    if (!user?.uid) return;

    // Set up real-time listener for products
    const productsRef = collection(db, "products");
    const productsQuery = query(
      productsRef,
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[];
      setProducts(productsData);
    });

    // Set up real-time listener for categories
    const categoriesRef = collection(db, "categories");
    const categoriesQuery = query(categoriesRef, orderBy("name"));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Category[];
      setCategories(categoriesData);
    });

    // Set active tab based on URL
    const pathParts = location.pathname.split("/");
    if (pathParts.length > 2 && pathParts[2]) {
      setActiveTab(pathParts[2]);
    } else {
      setActiveTab("all");
    }

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [user?.uid, location]);

  // Function to generate SKU
  const generateSKU = (category: string) => {
    const prefix = category ? category.substring(0, 3).toUpperCase() : "PRD";
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${prefix}-${randomNum}`;
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      if (newProduct.images.length + newImages.length <= 4) {
        setNewProduct((prev) => ({
          ...prev,
          images: [...prev.images, ...newImages],
        }));
      } else {
        alert("Maximum 4 images allowed");
      }
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Get subcategories for selected category
  const getSubcategoriesForCategory = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName);
    return category?.subcategories || [];
  };

  // Handle adding a new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      // Upload images to Cloudinary first
      const imageUrls = await Promise.all(
        newProduct.images.map(async (image) => {
          if (typeof image === "string") {
            return image; // Return existing URL
          }
          return uploadImage(image); // Upload new File
        })
      );

      // Add to Firestore
      const productData: Omit<Product, "id"> = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        discountPrice: newProduct.discountPrice
          ? parseFloat(newProduct.discountPrice)
          : undefined,
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        subcategory: newProduct.subcategory || undefined,
        images: imageUrls,
        sku: newProduct.sku || generateSKU(newProduct.category),
        brandName: newProduct.brandName,
        tags: newProduct.tags
          ? newProduct.tags.split(",").map((tag) => tag.trim())
          : [],
        colors: newProduct.colors,
        sizes: newProduct.sizes,
        weight: newProduct.weight.value
          ? {
              value: parseFloat(newProduct.weight.value),
              unit: newProduct.weight.unit,
            }
          : undefined,
        dimensions: newProduct.dimensions.length
          ? {
              length: parseFloat(newProduct.dimensions.length),
              width: parseFloat(newProduct.dimensions.width),
              height: parseFloat(newProduct.dimensions.height),
              unit: newProduct.dimensions.unit,
            }
          : undefined,
        returnPolicy: newProduct.returnPolicy || undefined,
        sellerId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "products"), productData);
      setShowAddProductModal(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        discountPrice: "",
        stock: "",
        category: "",
        subcategory: "",
        images: [],
        sku: "",
        brandName: "",
        tags: "",
        colors: [],
        sizes: [],
        weight: {
          value: "",
          unit: "kg",
        },
        dimensions: {
          length: "",
          width: "",
          height: "",
          unit: "cm",
        },
        returnPolicy: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // Handle editing a product
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      // Upload new images if any
      const newImageUrls = await Promise.all(
        newProduct.images
          .filter((img): img is File => img instanceof File)
          .map((img) => uploadImage(img))
      );

      // Keep existing image URLs
      const existingImageUrls = newProduct.images.filter(
        (img): img is string => typeof img === "string"
      );

      // Combine all image URLs
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      // Prepare dimensions object only if all values are present
      const dimensions =
        newProduct.dimensions.length &&
        newProduct.dimensions.width &&
        newProduct.dimensions.height
          ? {
              length: parseFloat(newProduct.dimensions.length),
              width: parseFloat(newProduct.dimensions.width),
              height: parseFloat(newProduct.dimensions.height),
              unit: newProduct.dimensions.unit,
            }
          : null;

      // Prepare weight object only if value is present
      const weight = newProduct.weight.value
        ? {
            value: parseFloat(newProduct.weight.value),
            unit: newProduct.weight.unit,
          }
        : null;

      // Update in Firestore
      const productRef = doc(db, "products", editingProduct.id);
      const updateData: Partial<Product> = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        discountPrice: newProduct.discountPrice
          ? parseFloat(newProduct.discountPrice)
          : null,
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        subcategory: newProduct.subcategory || null,
        images: allImageUrls,
        sku: newProduct.sku,
        brandName: newProduct.brandName || "No Brand",
        tags: newProduct.tags
          ? newProduct.tags.split(",").map((tag) => tag.trim())
          : [],
        colors: newProduct.colors,
        sizes: newProduct.sizes,
        weight: weight,
        dimensions: dimensions,
        returnPolicy: newProduct.returnPolicy || null,
        updatedAt: new Date(),
      };

      // Remove any undefined values from the update data
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(productRef, updateData);

      // Reset states
      setEditingProduct(null);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        discountPrice: "",
        stock: "",
        category: "",
        subcategory: "",
        images: [],
        sku: "",
        brandName: "",
        tags: "",
        colors: [],
        sizes: [],
        weight: {
          value: "",
          unit: "kg",
        },
        dimensions: {
          length: "",
          width: "",
          height: "",
          unit: "cm",
        },
        returnPolicy: "",
      });
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // Handle starting edit mode
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() || "",
      stock: product.stock.toString(),
      category: product.category,
      subcategory: product.subcategory || "",
      images: product.images,
      sku: product.sku,
      brandName: product.brandName || "No Brand",
      tags: product.tags?.join(", ") || "",
      colors: product.colors || [],
      sizes: product.sizes || [],
      weight: {
        value: product.weight?.value?.toString() || "",
        unit: product.weight?.unit || "kg",
      },
      dimensions: {
        length: product.dimensions?.length?.toString() || "",
        width: product.dimensions?.width?.toString() || "",
        height: product.dimensions?.height?.toString() || "",
        unit: product.dimensions?.unit || "cm",
      },
      returnPolicy: product.returnPolicy || "",
    });
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    if (!user?.uid) {
      console.error("No user logged in");
      return;
    }

    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const productRef = doc(db, "products", productId);
        await deleteDoc(productRef);
      } catch (error) {
        console.error("Error deleting product:", error);
        // You might want to show an error message to the user here
      }
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const categoryRef = doc(db, "categories", categoryId);
      await deleteDoc(categoryRef);
      // The UI will update automatically thanks to the onSnapshot listener
    } catch (error) {
      console.error("Error deleting category:", error);
      // You might want to show an error message to the user here
    }
  };

  // Handle sorting
  const requestSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
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
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Filter products based on search term and filters
  const filteredProducts = sortedProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === "all" ||
      product.category === selectedCategoryFilter;

    const matchesStock =
      selectedStockFilter === "all" ||
      (selectedStockFilter === "inStock" && product.stock > 0) ||
      (selectedStockFilter === "outOfStock" && product.stock === 0) ||
      (selectedStockFilter === "lowStock" &&
        product.stock > 0 &&
        product.stock <= 10);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Get unique categories for filter
  const uniqueCategories = ["all", ...new Set(products.map((p) => p.category))];

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return `₦${numPrice.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Handle add product button click
  const handleAddProductClick = () => {
    if (!seller?.isProfileComplete) {
      setShowProfileCompletionModal(true);
    } else {
      setShowAddProductModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />

      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">Products</h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeTab === "all" && "Manage your product catalog"}
                {activeTab === "inventory" &&
                  "Track and update inventory levels"}
                {activeTab === "categories" &&
                  "Organize products by categories"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                onClick={handleAddProductClick}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base w-full md:w-auto justify-center"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Add Product
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 mb-6">
            <Link
              to="/products"
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                activeTab === "all"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Products
            </Link>
            <Link
              to="/products/inventory"
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                activeTab === "inventory"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Inventory
            </Link>
            <Link
              to="/products/categories"
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                activeTab === "categories"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Categories
            </Link>
            <Link
              to="/products/subcategories"
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                activeTab === "subcategories"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Subcategories
            </Link>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Sliders className="w-4 h-4 mr-2 text-gray-500" />
                Filters
              </button>

              <button className="hidden md:flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                Filters
              </button>

              <div className="relative hidden md:block">
                <select
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories
                    .filter((c) => c !== "all")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative hidden md:block">
                <select
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="md:hidden bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    {uniqueCategories
                      .filter((c) => c !== "all")
                      .map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          {activeTab === "all" && (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort("name")}
                        >
                          Product
                          {sortConfig.key === "name" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1 w-3 h-3" />
                            ) : (
                              <ChevronDown className="ml-1 w-3 h-3" />
                            ))}
                        </button>
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort("category")}
                        >
                          Category
                          {sortConfig.key === "category" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1 w-3 h-3" />
                            ) : (
                              <ChevronDown className="ml-1 w-3 h-3" />
                            ))}
                        </button>
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort("price")}
                        >
                          Price
                          {sortConfig.key === "price" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1 w-3 h-3" />
                            ) : (
                              <ChevronDown className="ml-1 w-3 h-3" />
                            ))}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          className="flex items-center focus:outline-none"
                          onClick={() => requestSort("stock")}
                        >
                          Stock
                          {sortConfig.key === "stock" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1 w-3 h-3" />
                            ) : (
                              <ChevronDown className="ml-1 w-3 h-3" />
                            ))}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {product.images.length > 0 &&
                                typeof product.images[0] === "string" ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {product.sku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                            {product.category}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.stock > 10
                                  ? "bg-green-100 text-green-800"
                                  : product.stock > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.stock > 0
                                ? `${product.stock} in stock`
                                : "Out of stock"}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-3">
                              <button
                                onClick={() => startEdit(product)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit className="w-6 h-6" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No products found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium">{filteredProducts.length}</span>{" "}
                  of <span className="font-medium">{products.length}</span>{" "}
                  products
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {product.images.length > 0 &&
                              typeof product.images[0] === "string" ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-md object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
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
                              const updatedProducts = products.map((p) =>
                                p.id === product.id
                                  ? {
                                      ...p,
                                      stock: parseInt(e.target.value) || 0,
                                    }
                                  : p
                              );
                              setProducts(updatedProducts);
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.stock > 10
                                ? "bg-green-100 text-green-800"
                                : product.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock > 10
                              ? "In Stock"
                              : product.stock > 0
                              ? "Low Stock"
                              : "Out of Stock"}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          Today
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900">
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

          {activeTab === "categories" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {category.description || "No description available"}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Link
                      to="/products"
                      onClick={() => setSelectedCategoryFilter(category.name)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
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

          {activeTab === "subcategories" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map(
                (category) =>
                  category.subcategories &&
                  category.subcategories.length > 0 && (
                    <div key={category.id} className="col-span-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {category.name} Subcategories
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {category.subcategories.map((subcategory, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-4">
                              {subcategory.imageUrl && (
                                <img
                                  src={subcategory.imageUrl}
                                  alt={subcategory.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <h4 className="text-base font-medium text-gray-900">
                                  {subcategory.name}
                                </h4>
                                <Link
                                  to="/products"
                                  onClick={() =>
                                    setSelectedCategoryFilter(category.name)
                                  }
                                  className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                                >
                                  View products
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          )}

          {/* Add Product Modal */}
          {showAddProductModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                      Add New Product
                    </h3>
                    <button
                      onClick={() => setShowAddProductModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddProduct} className="p-3 sm:p-4 md:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">
                        Basic Information
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter product name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter product description"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (₦)
                          </label>
                          <input
                            type="number"
                            value={newProduct.price}
                            onChange={(e) => {
                              const price = e.target.value;
                              const priceNum = parseFloat(price);
                              setNewProduct((prev) => ({
                                ...prev,
                                price,
                                discountPrice:
                                  prev.discountPrice &&
                                  parseFloat(prev.discountPrice) > priceNum
                                    ? price
                                    : prev.discountPrice,
                              }));
                            }}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                            required
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Price (₦)
                            {newProduct.discountPrice &&
                              parseFloat(newProduct.price) > 0 && (
                                <span className="ml-2 text-sm text-red-600">
                                  {Math.round(
                                    ((parseFloat(newProduct.price) -
                                      parseFloat(newProduct.discountPrice)) /
                                      parseFloat(newProduct.price)) *
                                      100
                                  )}
                                  % off
                                </span>
                              )}
                          </label>
                          <input
                            type="number"
                            value={newProduct.discountPrice}
                            onChange={(e) => {
                              const discountPrice = e.target.value;
                              const discountPriceNum =
                                parseFloat(discountPrice);
                              const priceNum = parseFloat(newProduct.price);
                              if (discountPriceNum <= priceNum) {
                                setNewProduct((prev) => ({
                                  ...prev,
                                  discountPrice,
                                }));
                              }
                            }}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                            min="0"
                            max={newProduct.price}
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock
                          </label>
                          <input
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                stock: e.target.value,
                              })
                            }
                            placeholder="Enter available quantity"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                            required
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => {
                              const category = e.target.value;
                              setNewProduct((prev) => ({
                                ...prev,
                                category,
                                subcategory: "", // Reset subcategory when category changes
                                sku: generateSKU(category),
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                            required
                          >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {newProduct.category &&
                          getSubcategoriesForCategory(newProduct.category)
                            .length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subcategory
                              </label>
                              <select
                                value={newProduct.subcategory}
                                onChange={(e) => {
                                  setNewProduct((prev) => ({
                                    ...prev,
                                    subcategory: e.target.value,
                                  }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                              >
                                <option value="">Select a subcategory</option>
                                {getSubcategoriesForCategory(
                                  newProduct.category
                                ).map((subcategory, index) => (
                                  <option key={index} value={subcategory.name}>
                                    {subcategory.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brand Name
                        </label>
                        <input
                          type="text"
                          value={newProduct.brandName}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              brandName: e.target.value,
                            })
                          }
                          placeholder="Enter brand name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">
                        Product Images
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {newProduct.images.map((image, index) => (
                          <div key={index} className="relative group">
                            {typeof image === "string" ? (
                              <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            )}
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {newProduct.images.length < 8 && (
                          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                            <Plus className="w-6 h-6 text-gray-400" />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Additional Information (Optional)
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={newProduct.tags}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              tags: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Colors
                        </label>
                        <input
                          type="text"
                          value={newProduct.colors.join(", ")}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              colors: e.target.value
                                .split(",")
                                .map((c) => c.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="red, blue, green"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Sizes
                        </label>
                        <input
                          type="text"
                          value={newProduct.sizes.join(", ")}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              sizes: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="S, M, L, XL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Weight
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Weight"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.weight.value}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                weight: {
                                  ...newProduct.weight,
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.weight.unit}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                weight: {
                                  ...newProduct.weight,
                                  unit: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Dimensions
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="number"
                            placeholder="Length"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.length}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  length: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="number"
                            placeholder="Width"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.width}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  width: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="number"
                            placeholder="Height"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.height}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  height: e.target.value,
                                },
                              })
                            }
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.unit}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  unit: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                            <option value="in">in</option>
                            <option value="ft">ft</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Return Policy
                        </label>
                        <textarea
                          value={newProduct.returnPolicy}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              returnPolicy: e.target.value,
                            })
                          }
                          placeholder="Enter your return policy details..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddProductModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddProduct}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Add Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                      Edit Product
                    </h3>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setNewProduct({
                          name: "",
                          description: "",
                          price: "",
                          discountPrice: "",
                          stock: "",
                          category: "",
                          subcategory: "",
                          images: [],
                          sku: "",
                          brandName: "",
                          tags: "",
                          colors: [],
                          sizes: [],
                          weight: {
                            value: "",
                            unit: "kg",
                          },
                          dimensions: {
                            length: "",
                            width: "",
                            height: "",
                            unit: "cm",
                          },
                          returnPolicy: "",
                        });
                      }}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleEditProduct}
                  className="p-3 sm:p-4 md:p-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Basic Information
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter product name"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter product description"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price (₦)
                          </label>
                          <input
                            type="number"
                            value={newProduct.price}
                            onChange={(e) => {
                              const price = e.target.value;
                              const priceNum = parseFloat(price);
                              setNewProduct((prev) => ({
                                ...prev,
                                price,
                                discountPrice:
                                  prev.discountPrice &&
                                  parseFloat(prev.discountPrice) > priceNum
                                    ? price
                                    : prev.discountPrice,
                              }));
                            }}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            required
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Discount Price (₦)
                            {newProduct.discountPrice &&
                              parseFloat(newProduct.price) > 0 && (
                                <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                                  {Math.round(
                                    ((parseFloat(newProduct.price) -
                                      parseFloat(newProduct.discountPrice)) /
                                      parseFloat(newProduct.price)) *
                                      100
                                  )}
                                  % off
                                </span>
                              )}
                          </label>
                          <input
                            type="number"
                            value={newProduct.discountPrice}
                            onChange={(e) => {
                              const discountPrice = e.target.value;
                              const discountPriceNum =
                                parseFloat(discountPrice);
                              const priceNum = parseFloat(newProduct.price);
                              if (discountPriceNum <= priceNum) {
                                setNewProduct((prev) => ({
                                  ...prev,
                                  discountPrice,
                                }));
                              }
                            }}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            min="0"
                            max={newProduct.price}
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Stock
                          </label>
                          <input
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                stock: e.target.value,
                              })
                            }
                            placeholder="Enter available quantity"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            required
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category
                          </label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => {
                              const category = e.target.value;
                              setNewProduct((prev) => ({
                                ...prev,
                                category,
                                subcategory: "", // Reset subcategory when category changes
                                sku: generateSKU(category),
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                            required
                          >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {newProduct.category &&
                          getSubcategoriesForCategory(newProduct.category)
                            .length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subcategory
                              </label>
                              <select
                                value={newProduct.subcategory}
                                onChange={(e) => {
                                  setNewProduct((prev) => ({
                                    ...prev,
                                    subcategory: e.target.value,
                                  }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                              >
                                <option value="">Select a subcategory</option>
                                {getSubcategoriesForCategory(
                                  newProduct.category
                                ).map((subcategory, index) => (
                                  <option key={index} value={subcategory.name}>
                                    {subcategory.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Brand Name
                        </label>
                        <input
                          type="text"
                          value={newProduct.brandName}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              brandName: e.target.value,
                            })
                          }
                          placeholder="Enter brand name"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Product Images
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {newProduct.images.map((image, index) => (
                          <div key={index} className="relative group">
                            {typeof image === "string" ? (
                              <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            )}
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {newProduct.images.length < 8 && (
                          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                            <Plus className="w-6 h-6 text-gray-400" />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Additional Information (Optional)
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={newProduct.tags}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              tags: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Colors
                        </label>
                        <input
                          type="text"
                          value={newProduct.colors.join(", ")}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              colors: e.target.value
                                .split(",")
                                .map((c) => c.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="red, blue, green"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Available Sizes
                        </label>
                        <input
                          type="text"
                          value={newProduct.sizes.join(", ")}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              sizes: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="S, M, L, XL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Weight
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Weight"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.weight.value}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                weight: {
                                  ...newProduct.weight,
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.weight.unit}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                weight: {
                                  ...newProduct.weight,
                                  unit: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Dimensions
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="number"
                            placeholder="Length"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.length}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  length: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="number"
                            placeholder="Width"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.width}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  width: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="number"
                            placeholder="Height"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.height}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  height: e.target.value,
                                },
                              })
                            }
                          />
                          <select
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={newProduct.dimensions.unit}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                dimensions: {
                                  ...newProduct.dimensions,
                                  unit: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                            <option value="in">in</option>
                            <option value="ft">ft</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Return Policy
                        </label>
                        <textarea
                          value={newProduct.returnPolicy}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              returnPolicy: e.target.value,
                            })
                          }
                          placeholder="Enter your return policy details..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setNewProduct({
                          name: "",
                          description: "",
                          price: "",
                          discountPrice: "",
                          stock: "",
                          category: "",
                          subcategory: "",
                          images: [],
                          sku: "",
                          brandName: "",
                          tags: "",
                          colors: [],
                          sizes: [],
                          weight: {
                            value: "",
                            unit: "kg",
                          },
                          dimensions: {
                            length: "",
                            width: "",
                            height: "",
                            unit: "cm",
                          },
                          returnPolicy: "",
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Update Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Profile Completion Modal */}
          <ProfileCompletionModal
            isOpen={showProfileCompletionModal}
            onClose={() => setShowProfileCompletionModal(false)}
          />
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;
