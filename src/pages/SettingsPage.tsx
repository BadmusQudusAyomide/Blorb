import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { uploadImage } from '../utils/cloudinary';
import { X } from 'lucide-react';
import { ImageIcon } from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  storeName: string;
  storeLogo: string;
  storeBanner: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  businessType: string;
  taxId: string;
  socialMedia: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  storeDescription?: string;
}

const SettingsPage = () => {
  const { seller, updateSellerProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
    seller?.bankDetails ? [{
      id: '1',
      bankName: seller.bankDetails.bankName,
      accountNumber: seller.bankDetails.accountNumber,
      accountName: seller.bankDetails.accountName,
      isDefault: true
    }] : []
  );
  const [formData, setFormData] = useState<FormData>({
    name: seller?.name || '',
    email: seller?.email || '',
    phone: seller?.phone || '',
    storeName: seller?.storeName || '',
    storeLogo: seller?.storeLogo || '',
    storeBanner: seller?.storeBanner || '',
    businessAddress: seller?.businessAddress || {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    businessType: seller?.businessType || '',
    taxId: seller?.taxId || '',
    socialMedia: seller?.socialMedia || {},
    storeDescription: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Check if the field is nested (contains a dot)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof typeof prev] as Record<string, unknown>) || {}),
          [child]: value
        }
      }));
    } else {
      // Handle direct fields
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
    setBankAccounts([...bankAccounts, newAccount]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(prev => {
      const newAccounts = prev.filter(account => account.id !== id);
      // If we removed the default account and there are other accounts, make the first one default
      if (newAccounts.length > 0 && !newAccounts.some(account => account.isDefault)) {
        newAccounts[0].isDefault = true;
      }
      return newAccounts;
    });
  };

  const setDefaultBankAccount = (id: string) => {
    setBankAccounts(prev => prev.map(account => ({
      ...account,
      isDefault: account.id === id
    })));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setLoading(true);
    
    try {
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'storeLogo' : 'storeBanner']: imageUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSellerProfile(formData);
      setSuccess('Settings updated successfully');
    } catch {
      setError('Failed to update settings. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900">Settings</h2>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md">
              {error}
                  </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-md">
              {success}
                </div>
          )}

          <div className="bg-white rounded-lg shadow border border-blue-100">
            <div className="border-b border-blue-100">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${
                    activeTab === 'profile'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className={`${
                    activeTab === 'store'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Store
                </button>
                <button
                  onClick={() => setActiveTab('banking')}
                  className={`${
                    activeTab === 'banking'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Banking
                    </button>
                </nav>
              </div>

            <div className="p-6">
                  {activeTab === 'profile' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                        <input
                          type="text"
                        id="name"
                          name="name"
                        value={formData.name}
                          onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                        <input
                          type="email"
                        id="email"
                          name="email"
                        value={formData.email}
                          onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                        <input
                          type="tel"
                        id="phone"
                          name="phone"
                        value={formData.phone}
                          onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                        </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                    </div>
                </form>
                  )}

                  {activeTab === 'store' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                      <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                        Store Name
                      </label>
                        <input
                          type="text"
                        id="storeName"
                          name="storeName"
                        value={formData.storeName}
                          onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                      <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                        Business Type
                      </label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Select a business type</option>
                        <option value="individual">Individual</option>
                        <option value="company">Company</option>
                        <option value="partnership">Partnership</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Logo
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {formData.storeLogo ? (
                            <div className="relative">
                            <img
                              src={formData.storeLogo}
                              alt="Store Logo"
                                className="mx-auto h-32 w-auto object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, storeLogo: '' }))}
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
                                  htmlFor="logo-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                >
                                  <span>Upload a logo</span>
                            <input
                                    id="logo-upload"
                              type="file"
                          accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => handleImageUpload(e, 'logo')}
                                    disabled={loading}
                                  />
                          </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Banner
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {formData.storeBanner ? (
                            <div className="relative">
                            <img
                              src={formData.storeBanner}
                              alt="Store Banner"
                                className="mx-auto h-48 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, storeBanner: '' }))}
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
                                  htmlFor="banner-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                >
                                  <span>Upload a banner</span>
                        <input
                                    id="banner-upload"
                          type="file"
                          accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => handleImageUpload(e, 'banner')}
                                    disabled={loading}
                                  />
                          </label>
                      </div>
                            </>
                          )}
                    </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
                  )}

                  {activeTab === 'banking' && (
                <div className="space-y-6">
                    {bankAccounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Bank Name
                          </label>
                              <input
                                type="text"
                                value={account.bankName}
                                onChange={(e) => handleBankAccountChange(account.id, 'bankName', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Account Number
                          </label>
                              <input
                                type="text"
                                value={account.accountNumber}
                                onChange={(e) => handleBankAccountChange(account.id, 'accountNumber', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Account Name
                          </label>
                              <input
                                type="text"
                                value={account.accountName}
                                onChange={(e) => handleBankAccountChange(account.id, 'accountName', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                          <div className="flex items-end space-x-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={account.isDefault}
                              onChange={() => setDefaultBankAccount(account.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              Default Account
                            </label>
                          </div>
                          {bankAccounts.length > 1 && (
                                <button
                              type="button"
                              onClick={() => removeBankAccount(account.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                                </button>
                            )}
                          </div>
                          </div>
              </div>
            ))}
                  <button
                    type="button"
                    onClick={addBankAccount}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Bank Account
                  </button>
              </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;