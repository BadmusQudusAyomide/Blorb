import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { Edit2 } from 'lucide-react';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    
      setFormData(prev => ({
        ...prev,
        [parent]: {
        ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    try {
      setError(null);
    } catch {
      setError('Failed to upload image');
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

  const renderEditButton = (tabId: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tabId)}
      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <Edit2 className="w-4 h-4 mr-2" />
      Edit
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
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
                    <button
                  onClick={() => setActiveTab('notifications')}
                  className={`${
                    activeTab === 'notifications'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                  Notifications
                    </button>
                </nav>
              </div>

            <div className="p-6">
                  {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-blue-900">Profile Information</h3>
                    {renderEditButton('profile')}
                      </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          name="name"
                        value={formData.name || ''}
                          onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                        value={formData.email || ''}
                          onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                        value={formData.phone || ''}
                          onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                        </div>
                    </div>
                  )}

                  {activeTab === 'store' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-blue-900">Store Information</h3>
                    {renderEditButton('store')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                        <input
                          type="text"
                          name="storeName"
                        value={formData.storeName || ''}
                          onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                      <select
                        name="businessType"
                        value={formData.businessType || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Business Type</option>
                        <option value="individual">Individual</option>
                        <option value="company">Company</option>
                        <option value="partnership">Partnership</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                      <textarea
                        name="storeDescription"
                        value={formData.storeDescription || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
                        <div className="mt-1 flex items-center space-x-4">
                          {formData.storeLogo && (
                            <img
                              src={formData.storeLogo}
                              alt="Store Logo"
                            className="h-20 w-20 object-cover rounded-lg"
                            />
                          )}
                            <input
                              type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                              className="hidden"
                          id="storeLogo"
                            />
                        <label
                          htmlFor="storeLogo"
                          className="px-4 py-2 border border-blue-100 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          Upload Logo
                          </label>
                        </div>
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Banner</label>
                        <div className="mt-1 flex items-center space-x-4">
                          {formData.storeBanner && (
                            <img
                              src={formData.storeBanner}
                              alt="Store Banner"
                            className="h-32 w-full object-cover rounded-lg"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="storeBanner"
                        />
                        <label
                          htmlFor="storeBanner"
                          className="px-4 py-2 border border-blue-100 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          Upload Banner
                          </label>
                      </div>
                    </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'banking' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-blue-900">Bank Accounts</h3>
                              <button
                      onClick={addBankAccount}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                      Add Bank Account
                              </button>
                          </div>
                  <div className="space-y-4">
                    {bankAccounts.map((account) => (
                      <div key={account.id} className="bg-blue-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                              <input
                                type="text"
                                value={account.bankName}
                                onChange={(e) => handleBankAccountChange(account.id, 'bankName', e.target.value)}
                              className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                              <input
                                type="text"
                                value={account.accountNumber}
                                onChange={(e) => handleBankAccountChange(account.id, 'accountNumber', e.target.value)}
                              className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                              <input
                                type="text"
                                value={account.accountName}
                                onChange={(e) => handleBankAccountChange(account.id, 'accountName', e.target.value)}
                              className="w-full px-3 py-2 border border-blue-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          <div className="flex items-end space-x-4">
                                <button
                                  onClick={() => setDefaultBankAccount(account.id)}
                              className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                account.isDefault
                                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                                  : 'border-blue-100 text-gray-700 hover:bg-blue-50'
                              }`}
                            >
                              {account.isDefault ? 'Default Account' : 'Set as Default'}
                            </button>
                            {bankAccounts.length > 1 && (
                              <button
                                onClick={() => removeBankAccount(account.id)}
                                className="px-4 py-2 text-red-600 hover:text-red-700"
                              >
                                Remove
                                </button>
                            )}
                          </div>
                          </div>
              </div>
            ))}
                  </div>
                </div>
                      )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-blue-900">Notification Preferences</h3>
                    {renderEditButton('notifications')}
              </div>
              <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Order Notifications</h4>
                        <p className="text-sm text-gray-600">Receive notifications for new orders and updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                  </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Marketing Updates</h4>
                        <p className="text-sm text-gray-600">Receive updates about new features and promotions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
              </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;