import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { 
  Image as ImageIcon,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase.config';
import { uploadImage } from '../utils/cloudinary';

interface CarouselItem {
  id: string;
  image: string;
  title: string;
  description: string;
  link?: string;
  order: number;
}

const CarouselPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [formData, setFormData] = useState<Partial<CarouselItem>>({
    title: '',
    description: '',
    link: '',
    order: 0
  });

  // Fetch carousel items
  useEffect(() => {
    const carouselRef = collection(db, 'carousel');
    const q = query(carouselRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CarouselItem[];
        setItems(items);
      },
      (error) => {
        console.error('Error fetching carousel items:', error);
        setError('Failed to fetch carousel items');
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({
        ...prev,
        image: imageUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (!formData.image || !formData.title || !formData.description) {
        setError('Please fill in all required fields');
        return;
      }

      const carouselData = {
        ...formData,
        order: formData.order || items.length,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'carousel', editingItem.id), carouselData);
        setSuccess('Carousel item updated successfully');
      } else {
        await addDoc(collection(db, 'carousel'), carouselData);
        setSuccess('Carousel item added successfully');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        link: '',
        order: items.length
      });
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving carousel item:', error);
      setError('Failed to save carousel item');
    }
  };

  // Handle edit
  const handleEdit = (item: CarouselItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      link: item.link || '',
      order: item.order,
      image: item.image
    });
  };

  // Handle delete
  const handleDelete = async (item: CarouselItem) => {
    if (!confirm('Are you sure you want to delete this carousel item?')) return;

    try {
      await deleteDoc(doc(db, 'carousel', item.id));
      setSuccess('Carousel item deleted successfully');
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      setError('Failed to delete carousel item');
    }
  };

  // Handle reordering
  const handleReorder = async (item: CarouselItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === items.length - 1)
    ) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const otherItem = items[newIndex];

    try {
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'carousel', item.id), { order: otherItem.order });
      batch.update(doc(db, 'carousel', otherItem.id), { order: item.order });
      
      await batch.commit();
      setSuccess('Carousel item reordered successfully');
    } catch (error) {
      console.error('Error reordering carousel item:', error);
      setError('Failed to reorder carousel item');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900">Carousel Management</h2>
            <p className="text-gray-600">Manage your homepage carousel slides</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow border border-blue-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              {editingItem ? 'Edit Carousel Item' : 'Add New Carousel Item'}
            </h3>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carousel Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-blue-100 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="mx-auto h-32 w-auto object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload an image</span>
                            <input
                              id="image-upload"
                              name="image"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageUpload}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-blue-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-blue-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Link */}
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700">
                  Link (optional)
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="/category/summer"
                  className="mt-1 block w-full rounded-md border-blue-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Order */}
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                  Display Order
                </label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min={0}
                  className="mt-1 block w-full rounded-md border-blue-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({
                        title: '',
                        description: '',
                        link: '',
                        order: items.length
                      });
                    }}
                    className="px-4 py-2 border border-blue-100 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>

          {/* Carousel Items List */}
          <div className="bg-white rounded-lg shadow border border-blue-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900">Carousel Items</h3>
            </div>
            <div className="divide-y divide-blue-100">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-24 object-cover rounded"
                    />
                    <div>
                      <h4 className="text-lg font-medium text-blue-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      {item.link && (
                        <p className="text-sm text-blue-600">{item.link}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReorder(item, 'up')}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      disabled={items.findIndex(i => i.id === item.id) === 0}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReorder(item, 'down')}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      disabled={items.findIndex(i => i.id === item.id) === items.length - 1}
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CarouselPage; 