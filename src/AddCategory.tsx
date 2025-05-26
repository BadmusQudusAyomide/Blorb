// AddCategory.tsx
import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase.config";
import { uploadImage } from "./utils/cloudinary";
import { useAuth } from "./context/AuthContext";
import { X, Upload } from "lucide-react";

// Define Category type
type Category = {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  sellerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const AddCategory: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>({
    name: "Flash Sales",
    description: "Special time-limited offers and discounts",
    imageUrl: ""
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const imageUrl = await uploadImage(file);
      setCategory(prev => ({
        ...prev,
        imageUrl
      }));
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!user?.uid) {
      setError("You must be logged in to add a category");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const categoryData = {
        ...category,
        sellerId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, "categories"), categoryData);
      setSuccess("Category added successfully!");
      setCategory({
        name: "Flash Sales",
        description: "Special time-limited offers and discounts",
        imageUrl: ""
      });
    } catch (err) {
      console.error("Error adding category:", err);
      setError("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Flash Sales Category</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={category.name}
              onChange={(e) => setCategory(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={category.description}
              onChange={(e) => setCategory(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Image
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {category.imageUrl && (
                <div className="relative">
                  <img
                    src={category.imageUrl}
                    alt="Category"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setCategory(prev => ({ ...prev, imageUrl: "" }))}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <label className="cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleAddCategory}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Flash Sales Category"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;


// import React from "react";
// import { collection, addDoc } from "firebase/firestore";
// import { db } from "./firebase.config";

// type Category = {
//   name: string;
//   description: string;
//   imageUrl: string;
// };

// const categories: Category[] = [
//   {
//     name: "Electronics",
//     description: "Devices and gadgets like phones, laptops, etc.",
//     imageUrl: "https://example.com/electronics.jpg"
//   },
//   {
//     name: "Fashion",
//     description: "Clothing, shoes, and accessories.",
//     imageUrl: "https://example.com/fashion.jpg"
//   },
//   {
//     name: "Groceries",
//     description: "Everyday food and household items.",
//     imageUrl: "https://example.com/groceries.jpg"
//   },
//   {
//     name: "Home & Kitchen",
//     description: "Furniture, appliances, and kitchen tools.",
//     imageUrl: "https://example.com/home-kitchen.jpg"
//   },
//   {
//     name: "Books",
//     description: "All kinds of books and reading materials.",
//     imageUrl: "https://example.com/books.jpg"
//   },
//   {
//     name: "Toys",
//     description: "Toys and games for children of all ages.",
//     imageUrl: "https://example.com/toys.jpg"
//   },
//   {
//     name: "Health & Beauty",
//     description: "Makeup, skincare, and wellness products.",
//     imageUrl: "https://example.com/health-beauty.jpg"
//   },
//   {
//     name: "Sports & Outdoors",
//     description: "Sports gear, exercise tools, and outdoor items.",
//     imageUrl: "https://example.com/sports.jpg"
//   },
//   {
//     name: "Automotive",
//     description: "Car accessories, tools, and maintenance items.",
//     imageUrl: "https://example.com/automotive.jpg"
//   },
//   {
//     name: "Others",
//     description: "Miscellaneous items that don't fit a category.",
//     imageUrl: "https://example.com/others.jpg"
//   }
// ];

// const AddCategory: React.FC = () => {
//   const handleAddCategories = async () => {
//     try {
//       for (const category of categories) {
//         const docRef = await addDoc(collection(db, "categories"), category);
//         console.log(`Added ${category.name} with ID: ${docRef.id}`);
//       }
//       alert("All categories added successfully!");
//     } catch (error) {
//       console.error("Error adding categories: ", error);
//       alert("Failed to add categories.");
//     }
//   };

//   return (
//     <div>
//       <h2>Add All Categories</h2>
//       <button onClick={handleAddCategories}>Add Categories</button>
//     </div>
//   );
// };

// export default AddCategory;
