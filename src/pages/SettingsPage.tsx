import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { 
  User,
  Store,
  MapPin,
  Building2,
  CreditCard,
  Share2,
  Upload,
  Edit2,
  Plus,
  Trash2
} from 'lucide-react';
import { uploadImage } from '../utils/cloudinary';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

const SettingsPage = () => {
  const { seller, updateSellerProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
    seller?.bankDetails ? [{
      id: '1',
      bankName: seller.bankDetails.bankName,
      accountNumber: seller.bankDetails.accountNumber,
      accountName: seller.bankDetails.accountName,
      isDefault: true
    }] : []
  );

  const [formData, setFormData] = useState({
    name: seller?.name || '',
    email: seller?.email || '',
    phone: seller?.phone || '',
    storeName: seller?.storeName || '',
    storeLogo: seller?.storeLogo || '',
    storeBanner: seller?.storeBanner || '',
    businessAddress: {
      street: seller?.businessAddress?.street || '',
      city: seller?.businessAddress?.city || '',
      state: seller?.businessAddress?.state || '',
      country: seller?.businessAddress?.country || '',
      zipCode: seller?.businessAddress?.zipCode || ''
    },
    businessType: seller?.businessType || '',
    taxId: seller?.taxId || '',
    socialMedia: {
      website: seller?.socialMedia?.website || '',
      facebook: seller?.socialMedia?.facebook || '',
      instagram: seller?.socialMedia?.instagram || '',
      twitter: seller?.socialMedia?.twitter || ''
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBankAccountChange = (id: string, field: keyof BankAccount, value: string | boolean) => {
    setBankAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, [field]: value } : account
    ));
  };

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: '',
      accountNumber: '',
      accountName: '',
      isDefault: bankAccounts.length === 0
    };
    setBankAccounts(prev => [...prev, newAccount]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(prev => {
      const filtered = prev.filter(account => account.id !== id);
      if (filtered.length > 0 && !filtered.some(account => account.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const setDefaultBankAccount = (id: string) => {
    setBankAccounts(prev => prev.map(account => ({
      ...account,
      isDefault: account.id === id
    })));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'storeLogo' | 'storeBanner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({
        ...prev,
        [type]: imageUrl
      }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert bank accounts to the format expected by the API
      const bankDetails = bankAccounts.find(account => account.isDefault) || bankAccounts[0];
      
      // Only include bankDetails if there are bank accounts
      const updateData = {
        ...formData,
        ...(bankDetails && {
          bankDetails: {
            bankName: bankDetails.bankName,
            accountNumber: bankDetails.accountNumber,
            accountName: bankDetails.accountName
          }
        })
      };
      
      await updateSellerProfile(updateData);
      
      setSuccess('Profile updated successfully');
      setEditMode(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: <User className="w-5 h-5" /> },
    { id: 'store', label: 'Store Details', icon: <Store className="w-5 h-5" /> },
    { id: 'address', label: 'Business Address', icon: <MapPin className="w-5 h-5" /> },
    { id: 'business', label: 'Business Information', icon: <Building2 className="w-5 h-5" /> },
    { id: 'banking', label: 'Banking Details', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'social', label: 'Social Media', icon: <Share2 className="w-5 h-5" /> }
  ];

  const renderEditButton = (tabId: string) => (
    <button
      type="button"
      onClick={() => setEditMode(tabId)}
      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <Edit2 className="w-4 h-4 mr-2" />
      Edit
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-150">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
          </div>

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

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-4">
              {/* Sidebar */}
              <div className="md:border-r border-gray-200 dark:border-gray-800 p-4">
                <nav className="space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                        activeTab === tab.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="md:col-span-3 p-4 md:p-6">
                <form onSubmit={handleSubmit}>
                  {activeTab === 'profile' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h3>
                        {editMode !== 'profile' && renderEditButton('profile')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          disabled={editMode !== 'profile'}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email address"
                          disabled={editMode !== 'profile'}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          disabled={editMode !== 'profile'}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                      {editMode === 'profile' && (
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setEditMode(null)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'store' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Store Name
                        </label>
                        <input
                          type="text"
                          name="storeName"
                          value={formData.storeName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Store Logo
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          {formData.storeLogo && (
                            <img
                              src={formData.storeLogo}
                              alt="Store Logo"
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          )}
                          <label className="cursor-pointer">
                            <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'storeLogo')}
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Store Banner
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          {formData.storeBanner && (
                            <img
                              src={formData.storeBanner}
                              alt="Store Banner"
                              className="w-32 h-16 object-cover rounded-md"
                            />
                          )}
                          <label className="cursor-pointer">
                            <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Banner
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'storeBanner')}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'address' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="businessAddress.street"
                          value={formData.businessAddress.street}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            name="businessAddress.city"
                            value={formData.businessAddress.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            name="businessAddress.state"
                            value={formData.businessAddress.state}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            name="businessAddress.country"
                            value={formData.businessAddress.country}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            name="businessAddress.zipCode"
                            value={formData.businessAddress.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'business' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Business Type
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="">Select Business Type</option>
                          <option value="individual">Individual</option>
                          <option value="partnership">Partnership</option>
                          <option value="corporation">Corporation</option>
                          <option value="llc">LLC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tax ID
                        </label>
                        <input
                          type="text"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'banking' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Banking Details</h3>
                        {editMode !== 'banking' && renderEditButton('banking')}
                      </div>
                      
                      {bankAccounts.map((account, index) => (
                        <div key={account.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Bank Account {index + 1}
                              {account.isDefault && (
                                <span className="ml-2 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-200 rounded-full">
                                  Default
                                </span>
                              )}
                            </h4>
                            {editMode === 'banking' && bankAccounts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBankAccount(account.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Bank Name
                              </label>
                              <input
                                type="text"
                                value={account.bankName}
                                onChange={(e) => handleBankAccountChange(account.id, 'bankName', e.target.value)}
                                placeholder="Enter bank name"
                                disabled={editMode !== 'banking'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Account Number
                              </label>
                              <input
                                type="text"
                                value={account.accountNumber}
                                onChange={(e) => handleBankAccountChange(account.id, 'accountNumber', e.target.value)}
                                placeholder="Enter account number"
                                disabled={editMode !== 'banking'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Account Name
                              </label>
                              <input
                                type="text"
                                value={account.accountName}
                                onChange={(e) => handleBankAccountChange(account.id, 'accountName', e.target.value)}
                                placeholder="Enter account name"
                                disabled={editMode !== 'banking'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                required
                              />
                            </div>
                            {!account.isDefault && (
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => setDefaultBankAccount(account.id)}
                                  disabled={editMode !== 'banking'}
                                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                                >
                                  Set as Default
                                </button>
                              </div>
                            )}
                          </div>
              </div>
            ))}

                      {editMode === 'banking' && (
                        <button
                          type="button"
                          onClick={addBankAccount}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Bank Account
                        </button>
                      )}

                      {editMode === 'banking' && (
                        <div className="flex justify-end space-x-3 mt-4">
                          <button
                            type="button"
                            onClick={() => setEditMode(null)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </button>
                </div>
                      )}
              </div>
                  )}

                  {activeTab === 'social' && (
              <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          name="socialMedia.website"
                          value={formData.socialMedia.website}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Facebook
                        </label>
                        <input
                          type="url"
                          name="socialMedia.facebook"
                          value={formData.socialMedia.facebook}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Instagram
                  </label>
                        <input
                          type="url"
                          name="socialMedia.instagram"
                          value={formData.socialMedia.instagram}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Twitter
                        </label>
                        <input
                          type="url"
                          name="socialMedia.twitter"
                          value={formData.socialMedia.twitter}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;