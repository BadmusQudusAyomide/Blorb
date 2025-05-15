// // // AddCategory.tsx
// // import React from "react";
// // import { collection, addDoc } from "firebase/firestore";
// // import { db } from "./firebase.config";

// // // Define Category type
// // type Category = {
// //   name: string;
// //   description: string;
// //   imageUrl: string;
// // };

// // const AddCategory: React.FC = () => {
// //   const handleAddCategory = async () => {
// //     const newCategory: Category = {
// //       name: "Accessories",
// //       description: "All kinds of accessories",
// //       imageUrl: "https://example.com/accessories.jpg"
// //     };

// //     try {
// //       const docRef = await addDoc(collection(db, "categories"), newCategory);
// //       alert(`Category added with ID: ${docRef.id}`);
// //     } catch (error) {
// //       console.error("Error adding category: ", error);
// //       alert("Failed to add category.");
// //     }
// //   };

// //   return (
// //     <div>
// //       <h2>Add Category</h2>
// //       <button onClick={handleAddCategory}>Add Accessories Category</button>
// //     </div>
// //   );
// // };

// // export default AddCategory;


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
