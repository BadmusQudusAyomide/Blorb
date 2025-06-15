import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { uploadImage } from "./utils/cloudinary";
import { useAuth } from "./context/AuthContext";
import {
  X,
  Upload,
  Plus,
  Minus,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Define types
type Subcategory = {
  name: string;
  imageUrl: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  subcategories?: Subcategory[];
  createdAt?: Date;
  updatedAt?: Date;
};

type SubcategoryInput = {
  name: string;
  imageFile: File | null;
  imageUrl: string;
};

const AddCategory: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // State for managing subcategory inputs for each category
  const [subcategoryInputs, setSubcategoryInputs] = useState<{
    [categoryId: string]: SubcategoryInput[];
  }>({});

  // Fetch existing categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setFetchingCategories(true);
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const fetchedCategories: Category[] = categoriesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Category)
        );

        setCategories(fetchedCategories);

        // Initialize subcategory inputs for each category
        const initialInputs: { [categoryId: string]: SubcategoryInput[] } = {};
        fetchedCategories.forEach((category) => {
          initialInputs[category.id] = [
            { name: "", imageFile: null, imageUrl: "" },
          ];
        });
        setSubcategoryInputs(initialInputs);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to fetch categories");
      } finally {
        setFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Add a new subcategory input field for a category
  const addSubcategoryInput = (categoryId: string) => {
    setSubcategoryInputs((prev) => ({
      ...prev,
      [categoryId]: [
        ...prev[categoryId],
        { name: "", imageFile: null, imageUrl: "" },
      ],
    }));
  };

  // Remove a subcategory input field
  const removeSubcategoryInput = (categoryId: string, index: number) => {
    setSubcategoryInputs((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((_, i) => i !== index),
    }));
  };

  // Update subcategory input
  const updateSubcategoryInput = (
    categoryId: string,
    index: number,
    field: keyof SubcategoryInput,
    value: string | File | null
  ) => {
    setSubcategoryInputs((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId].map((input, i) =>
        i === index ? { ...input, [field]: value } : input
      ),
    }));
  };

  // Handle image upload for subcategory
  const handleSubcategoryImageUpload = async (
    categoryId: string,
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const imageUrl = await uploadImage(file);
      updateSubcategoryInput(categoryId, index, "imageUrl", imageUrl);
      updateSubcategoryInput(categoryId, index, "imageFile", file);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  // Save subcategories for a specific category
  const saveSubcategories = async (categoryId: string) => {
    if (!user?.uid) {
      setError("You must be logged in to add subcategories");
      return;
    }

    const inputs = subcategoryInputs[categoryId];
    const validSubcategories = inputs.filter(
      (input) => input.name.trim() !== "" && input.imageUrl !== ""
    );

    if (validSubcategories.length === 0) {
      setError(
        "Please provide at least one valid subcategory with name and image"
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const subcategories: Subcategory[] = validSubcategories.map((input) => ({
        name: input.name.trim(),
        imageUrl: input.imageUrl,
      }));

      // Update the category document with subcategories
      const categoryRef = doc(db, "categories", categoryId);
      await updateDoc(categoryRef, {
        subcategories: arrayUnion(...subcategories),
        updatedAt: new Date(),
      });

      // Update local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                subcategories: [...(cat.subcategories || []), ...subcategories],
              }
            : cat
        )
      );

      // Reset inputs for this category
      setSubcategoryInputs((prev) => ({
        ...prev,
        [categoryId]: [{ name: "", imageFile: null, imageUrl: "" }],
      }));

      setSuccess(
        `Subcategories added successfully to ${
          categories.find((c) => c.id === categoryId)?.name
        }!`
      );
    } catch (error) {
      console.error("Error adding subcategories:", error);
      setError("Failed to add subcategories");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Manage Categories & Subcategories
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              {/* Category Header */}
              <div
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => toggleCategoryExpansion(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {category.imageUrl && (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                      {category.subcategories &&
                        category.subcategories.length > 0 && (
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                            {category.subcategories.length} subcategories
                          </p>
                        )}
                    </div>
                  </div>
                  {expandedCategories.has(category.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCategories.has(category.id) && (
                <div className="p-6">
                  {/* Existing Subcategories */}
                  {category.subcategories &&
                    category.subcategories.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          Existing Subcategories
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {category.subcategories.map((sub, index) => (
                            <div key={index} className="text-center">
                              <img
                                src={sub.imageUrl}
                                alt={sub.name}
                                className="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                              />
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {sub.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Add New Subcategories */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Add New Subcategories
                    </h3>
                    <div className="space-y-4">
                      {subcategoryInputs[category.id]?.map((input, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Subcategory name"
                              value={input.name}
                              onChange={(e) =>
                                updateSubcategoryInput(
                                  category.id,
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            {input.imageUrl && (
                              <div className="relative">
                                <img
                                  src={input.imageUrl}
                                  alt="Subcategory"
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSubcategoryInput(
                                      category.id,
                                      index,
                                      "imageUrl",
                                      ""
                                    )
                                  }
                                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <label className="cursor-pointer">
                              <span className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Upload className="w-4 h-4" />
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) =>
                                  handleSubcategoryImageUpload(
                                    category.id,
                                    index,
                                    e
                                  )
                                }
                              />
                            </label>
                          </div>

                          {subcategoryInputs[category.id].length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeSubcategoryInput(category.id, index)
                              }
                              className="p-2 text-red-500 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <button
                        type="button"
                        onClick={() => addSubcategoryInput(category.id)}
                        className="inline-flex items-center px-4 py-2 border border-indigo-300 dark:border-indigo-700 rounded-md text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Subcategory
                      </button>

                      <button
                        onClick={() => saveSubcategories(category.id)}
                        disabled={loading}
                        className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Saving..." : "Save Subcategories"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No categories found. Please add some categories first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCategory;

// // AddCategory.tsx
// import React, { useState } from "react";
// import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
// import { db } from "./firebase.config";
// import { uploadImage } from "./utils/cloudinary";
// import { useAuth } from "./context/AuthContext";
// import { X, Upload } from "lucide-react";

// // Define Category type
// type Category = {
//   id?: string;
//   name: string;
//   description: string;
//   imageUrl: string;
//   sellerId?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// };

// const AddCategory: React.FC = () => {
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [category, setCategory] = useState<Category>({
//     name: "Flash Sales",
//     description: "Special time-limited offers and discounts",
//     imageUrl: "",
//   });

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       setLoading(true);
//       const imageUrl = await uploadImage(file);
//       setCategory((prev) => ({
//         ...prev,
//         imageUrl,
//       }));
//     } catch (err) {
//       console.error("Error uploading image:", err);
//       setError("Failed to upload image");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddCategory = async () => {
//     if (!user?.uid) {
//       setError("You must be logged in to add a category");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);
//       setSuccess(null);

//       const categoryData = {
//         name: category.name,
//         description: category.description,
//         imageUrl: category.imageUrl,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };

//       await addDoc(collection(db, "categories"), categoryData);
//       setSuccess("Category added successfully!");
//       setCategory({
//         name: "Flash Sales",
//         description: "Special time-limited offers and discounts",
//         imageUrl: "",
//       });
//     } catch (error) {
//       console.error("Error adding category:", error);
//       setError("Failed to add category");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
//           Add Flash Sales Category
//         </h2>

//         {error && (
//           <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
//             {success}
//           </div>
//         )}

//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Category Name
//             </label>
//             <input
//               type="text"
//               value={category.name}
//               onChange={(e) =>
//                 setCategory((prev) => ({ ...prev, name: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Description
//             </label>
//             <textarea
//               value={category.description}
//               onChange={(e) =>
//                 setCategory((prev) => ({
//                   ...prev,
//                   description: e.target.value,
//                 }))
//               }
//               rows={3}
//               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Category Image
//             </label>
//             <div className="mt-1 flex items-center space-x-4">
//               {category.imageUrl && (
//                 <div className="relative">
//                   <img
//                     src={category.imageUrl}
//                     alt="Category"
//                     className="w-32 h-32 object-cover rounded-lg"
//                   />
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setCategory((prev) => ({ ...prev, imageUrl: "" }))
//                     }
//                     className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
//                   >
//                     <X className="w-4 h-4" />
//                   </button>
//                 </div>
//               )}
//               <label className="cursor-pointer">
//                 <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
//                   <Upload className="w-4 h-4 mr-2" />
//                   Upload Image
//                 </span>
//                 <input
//                   type="file"
//                   className="hidden"
//                   accept="image/*"
//                   onChange={handleImageUpload}
//                 />
//               </label>
//             </div>
//           </div>

//           <button
//             onClick={handleAddCategory}
//             disabled={loading}
//             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//           >
//             {loading ? "Adding..." : "Add Flash Sales Category"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddCategory;

// // // import React from "react";
// // // import { collection, addDoc } from "firebase/firestore";
// // // import { db } from "./firebase.config";

// // // type Category = {
// // //   name: string;
// // //   description: string;
// // //   imageUrl: string;
// // // };

// // // const categories: Category[] = [
// // //   {
// // //     name: "Electronics",
// // //     description: "Devices and gadgets like phones, laptops, etc.",
// // //     imageUrl: "https://example.com/electronics.jpg"
// // //   },
// // //   {
// // //     name: "Fashion",
// // //     description: "Clothing, shoes, and accessories.",
// // //     imageUrl: "https://example.com/fashion.jpg"
// // //   },
// // //   {
// // //     name: "Groceries",
// // //     description: "Everyday food and household items.",
// // //     imageUrl: "https://example.com/groceries.jpg"
// // //   },
// // //   {
// // //     name: "Home & Kitchen",
// // //     description: "Furniture, appliances, and kitchen tools.",
// // //     imageUrl: "https://example.com/home-kitchen.jpg"
// // //   },
// // //   {
// // //     name: "Books",
// // //     description: "All kinds of books and reading materials.",
// // //     imageUrl: "https://example.com/books.jpg"
// // //   },
// // //   {
// // //     name: "Toys",
// // //     description: "Toys and games for children of all ages.",
// // //     imageUrl: "https://example.com/toys.jpg"
// // //   },
// // //   {
// // //     name: "Health & Beauty",
// // //     description: "Makeup, skincare, and wellness products.",
// // //     imageUrl: "https://example.com/health-beauty.jpg"
// // //   },
// // //   {
// // //     name: "Sports & Outdoors",
// // //     description: "Sports gear, exercise tools, and outdoor items.",
// // //     imageUrl: "https://example.com/sports.jpg"
// // //   },
// // //   {
// // //     name: "Automotive",
// // //     description: "Car accessories, tools, and maintenance items.",
// // //     imageUrl: "https://example.com/automotive.jpg"
// // //   },
// // //   {
// // //     name: "Others",
// // //     description: "Miscellaneous items that don't fit a category.",
// // //     imageUrl: "https://example.com/others.jpg"
// // //   }
// // // ];

// // // const AddCategory: React.FC = () => {
// // //   const handleAddCategories = async () => {
// // //     try {
// // //       for (const category of categories) {
// // //         const docRef = await addDoc(collection(db, "categories"), category);
// // //         console.log(`Added ${category.name} with ID: ${docRef.id}`);
// // //       }
// // //       alert("All categories added successfully!");
// // //     } catch (error) {
// // //       console.error("Error adding categories: ", error);
// // //       alert("Failed to add categories.");
// // //     }
// // //   };

// // //   return (
// // //     <div>
// // //       <h2>Add All Categories</h2>
// // //       <button onClick={handleAddCategories}>Add Categories</button>
// // //     </div>
// // //   );
// // // };

// // // export default AddCategory;
