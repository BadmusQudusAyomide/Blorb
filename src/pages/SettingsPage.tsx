import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/dashboard/Sidebar";
import TopBar from "../components/dashboard/TopBar";
import { uploadImage } from "../utils/cloudinary";
import {
  verifyBankAccount,
  fetchNigerianBanks,
  validateAccountNumber
} from "../utils/paystackVerification";
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImageIcon,
  Shield,
  UserCheck,
  IdCard,
  Home
} from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verifying' | 'verified' | 'failed';
  verificationMessage?: string;
}

// New verification interfaces
interface VerificationData {
  selfieImage: string;
  ninImage: string;
  ninNumber: string;
  bvnNumber: string;
  residentialAddress: string;
  verificationStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  submittedAt?: Date;
  verifiedAt?: Date;
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
  // New verification fields
  verification?: VerificationData;
}

// File validation constants
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


const SettingsPage = () => {
  const { seller, updateSellerProfile } = useAuth();
  
  // Security token generation (simple client-side implementation)
  const generateSecurityToken = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}:${random}:${seller?.id || 'unknown'}`).slice(0, 32);
  };
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
    seller?.bankDetails
      ? [
        {
          id: "1",
          bankName: seller.bankDetails.bankName,
          bankCode: (seller.bankDetails as any).bankCode || "",
          accountNumber: seller.bankDetails.accountNumber,
          accountName: seller.bankDetails.accountName,
          isDefault: true,
          isVerified: (seller.bankDetails as any).isVerified || false,
          verificationStatus: (seller.bankDetails as any).isVerified ? 'verified' : 'pending',
        },
      ]
      : []
  );

  const [formData, setFormData] = useState<FormData>({
    name: seller?.name || "",
    email: seller?.email || "",
    phone: seller?.phone || "",
    storeName: seller?.storeName || "",
    storeLogo: seller?.storeLogo || "",
    storeBanner: seller?.storeBanner || "",
    businessAddress: seller?.businessAddress || {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    businessType: seller?.businessType || "",
    taxId: seller?.taxId || "",
    socialMedia: seller?.socialMedia || {},
    storeDescription: "",
    verification: (seller as any)?.verification || {
      selfieImage: "",
      ninImage: "",
      ninNumber: "",
      bvnNumber: "",
      residentialAddress: "",
      verificationStatus: 'pending'
    }
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // New state for upload progress and verification
  const [uploadProgress, setUploadProgress] = useState<{
    selfie?: number;
    nin?: number;
    logo?: number;
    banner?: number;
  }>({});
  const [uploading, setUploading] = useState<string | null>(null);

  // Fetch Nigerian banks on component mount
  useEffect(() => {
    const loadBanks = async () => {
      setLoadingBanks(true);
      try {
        const bankList = await fetchNigerianBanks();
        setBanks(bankList);
      } catch (error) {
        console.error('Failed to load banks:', error);
        setError('Failed to load bank list. Some features may not work properly.');
      } finally {
        setLoadingBanks(false);
      }
    };

    loadBanks();
  }, []);

  // Input sanitization function
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '');
  };

  // Validation functions
  const validateNIN = (nin: string): boolean => {
    const ninRegex = /^\d{11}$/;
    return ninRegex.test(nin);
  };

  const validateBVN = (bvn: string): boolean => {
    const bvnRegex = /^\d{11}$/;
    return bvnRegex.test(bvn);
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    return { isValid: true };
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);

    if (name.includes(".")) {
      const [parent, child] = name.split(".");

      if (parent === "verification") {
        setFormData((prev) => ({
          ...prev,
          verification: {
            ...prev.verification!,
            [child]: sanitizedValue
          }
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...((prev[parent as keyof typeof prev] as Record<string, unknown>) || {}),
            [child]: sanitizedValue,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));
    }
  };

  // Enhanced image upload with progress tracking and security
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner" | "selfie" | "nin"
  ) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || null);
      return;
    }

    setUploading(type);
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      // Generate security token for this upload
      const securityToken = generateSecurityToken();

      // Create a custom file name with security token for traceability
      const originalName = file.name;
      const fileExtension = originalName.split('.').pop();
      const timestamp = Date.now();
      const secureFileName = `seller_${seller?.id}_${type}_${timestamp}_${securityToken.slice(0, 8)}.${fileExtension}`;

      // Create a new File object with the secure name
      const secureFile = new File([file], secureFileName, { type: file.type });

      // Simulate upload progress (since your current uploadImage doesn't support progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[type] || 0;
          if (currentProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [type]: currentProgress + 10 };
        });
      }, 200);

      const imageUrl = await uploadImage(secureFile);

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [type]: 100 }));

      // Update form data based on upload type
      if (type === "logo" || type === "banner") {
        setFormData((prev) => ({
          ...prev,
          [type === "logo" ? "storeLogo" : "storeBanner"]: imageUrl,
        }));
      } else if (type === "selfie" || type === "nin") {
        setFormData((prev) => ({
          ...prev,
          verification: {
            ...prev.verification!,
            [type === "selfie" ? "selfieImage" : "ninImage"]: imageUrl
          }
        }));
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);

      // Reset progress after success
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [type]: undefined }));
      }, 1000);

    } catch (error) {
      console.error("Error uploading image:", error);
      setError(`Failed to upload ${type}. Please try again.`);
      setUploadProgress(prev => ({ ...prev, [type]: undefined }));
    } finally {
      setUploading(null);
    }
  };

  const handleBankAccountChange = (
    id: string,
    field: keyof BankAccount,
    value: string | boolean
  ) => {
    setBankAccounts((prev) =>
      prev.map((account) =>
        account.id === id ? { ...account, [field]: value } : account
      )
    );
  };

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: "",
      bankCode: "",
      accountNumber: "",
      accountName: "",
      isDefault: bankAccounts.length === 0,
      isVerified: false,
      verificationStatus: 'pending',
    };
    setBankAccounts([...bankAccounts, newAccount]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts((prev) => {
      const newAccounts = prev.filter((account) => account.id !== id);
      // If we removed the default account and there are other accounts, make the first one default
      if (
        newAccounts.length > 0 &&
        !newAccounts.some((account) => account.isDefault)
      ) {
        newAccounts[0].isDefault = true;
      }
      return newAccounts;
    });
  };

  const setDefaultBankAccount = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((account) => ({
        ...account,
        isDefault: account.id === id,
      }))
    );
  };

  const verifyAccount = async (accountId: string) => {
    const account = bankAccounts.find(acc => acc.id === accountId);
    if (!account || !account.accountNumber || !account.bankCode) {
      setError('Please fill in account number and select a bank before verifying');
      return;
    }

    if (!validateAccountNumber(account.accountNumber)) {
      setError('Please enter a valid 10-digit account number');
      return;
    }

    // Update verification status to verifying
    setBankAccounts(prev =>
      prev.map(acc =>
        acc.id === accountId
          ? { ...acc, verificationStatus: 'verifying' as const }
          : acc
      )
    );

    try {
      const result = await verifyBankAccount(account.accountNumber, account.bankCode);

      if (result.status && result.data) {
        // Update account with verified information
        setBankAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId
              ? {
                ...acc,
                accountName: result.data!.account_name,
                isVerified: true,
                verificationStatus: 'verified' as const,
                verificationMessage: result.message,
              }
              : acc
          )
        );
        setSuccess('Account verified successfully!');
      } else {
        // Verification failed
        setBankAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId
              ? {
                ...acc,
                isVerified: false,
                verificationStatus: 'failed' as const,
                verificationMessage: result.message,
              }
              : acc
          )
        );
        setError(result.message || 'Account verification failed');
      }
    } catch (error) {
      setBankAccounts(prev =>
        prev.map(acc =>
          acc.id === accountId
            ? {
              ...acc,
              isVerified: false,
              verificationStatus: 'failed' as const,
              verificationMessage: 'Verification failed due to network error',
            }
            : acc
        )
      );
      setError('Failed to verify account. Please check your internet connection and try again.');
    }
  };

  // Validate all required verification fields
  const validateVerificationFields = (): boolean => {
    const verification = formData.verification;

    if (!verification?.selfieImage) {
      setError('Selfie image is required');
      return false;
    }

    if (!verification?.ninImage) {
      setError('NIN image is required');
      return false;
    }

    if (!verification?.ninNumber || !validateNIN(verification.ninNumber)) {
      setError('Valid NIN number is required (11 digits)');
      return false;
    }

    if (!verification?.bvnNumber || !validateBVN(verification.bvnNumber)) {
      setError('Valid BVN number is required (11 digits)');
      return false;
    }

    if (!verification?.residentialAddress) {
      setError('Residential address is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setError(null);
    setSuccess(null);

    try {
      // Validate verification fields if on verification tab
      if (activeTab === "verification") {
        if (!validateVerificationFields()) {
          return;
        }

        // Update verification status to submitted
        setFormData(prev => ({
          ...prev,
          verification: {
            ...prev.verification!,
            verificationStatus: 'submitted',
            submittedAt: new Date()
          }
        }));
      }

      // Get the default bank account
      const defaultAccount = bankAccounts.find((account) => account.isDefault);

      // Validate that default account is verified if banking tab is active
      if (activeTab === "banking" && defaultAccount && !defaultAccount.isVerified) {
        setError("Please verify your default bank account before saving.");
        return;
      }

      // Prepare the data to be saved with security token
      const securityToken = generateSecurityToken();
      const dataToSave = {
        ...formData,
        bankDetails: defaultAccount
          ? {
            bankName: defaultAccount.bankName,
            bankCode: defaultAccount.bankCode,
            accountNumber: defaultAccount.accountNumber,
            accountName: defaultAccount.accountName,
            isVerified: defaultAccount.isVerified,
          }
          : undefined,
        lastUpdated: new Date(),
        securityToken: securityToken // Add security token to the saved data
      };

      await updateSellerProfile(dataToSave);
      setSuccess("Settings updated successfully");
    } catch (error: any) {
      setError(error.message || "Failed to update settings. Please try again.");
    }
  };

  // Render upload progress indicator
  const renderUploadProgress = (type: string) => {
    const progress = uploadProgress[type as keyof typeof uploadProgress];

    if (uploading === type && progress !== undefined) {
      return (
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  // Render image preview with remove button
  const renderImagePreview = (imageUrl: string, onRemove: () => void, alt: string) => (
    <div className="relative">
      <img
        src={imageUrl}
        alt={alt}
        className="mx-auto h-32 w-auto object-contain border rounded-lg"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // Render file upload area
  const renderFileUpload = (
    type: "logo" | "banner" | "selfie" | "nin",
    currentImage: string,
    onRemove: () => void,
    label: string,
    description: string
  ) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
        <div className="space-y-1 text-center">
          {currentImage ? (
            renderImagePreview(currentImage, onRemove, label)
          ) : (
            <>
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex flex-col items-center text-sm text-gray-600">
                <label
                  htmlFor={`${type}-upload`}
                  className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${uploading === type ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <span>Upload {label}</span>
                  <input
                    id={`${type}-upload`}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleImageUpload(e, type)}
                    disabled={uploading === type}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              </div>
            </>
          )}
          {renderUploadProgress(type)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />

      <main className="pt-16 pl-0 lg:pl-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600">
              Manage your account settings and verification
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: "profile", label: "Profile", icon: UserCheck },
                  { id: "store", label: "Store", icon: IdCard },
                  { id: "verification", label: "Verification", icon: Shield },
                  { id: "banking", label: "Banking", icon: Home },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${activeTab === tab.id
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "profile" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "store" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="storeName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Store Name *
                      </label>
                      <input
                        type="text"
                        id="storeName"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="businessType"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Business Type *
                      </label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Select a business type</option>
                        <option value="individual">Individual</option>
                        <option value="company">Company</option>
                        <option value="partnership">Partnership</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="taxId"
                        className="block text-sm font-medium text-gray-700"
                      >
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
                    {renderFileUpload(
                      "logo",
                      formData.storeLogo,
                      () => setFormData(prev => ({ ...prev, storeLogo: "" })),
                      "Store Logo",
                      "Recommended: Square image, 500x500px, JPG/PNG/WEBP"
                    )}

                    {renderFileUpload(
                      "banner",
                      formData.storeBanner,
                      () => setFormData(prev => ({ ...prev, storeBanner: "" })),
                      "Store Banner",
                      "Recommended: 1200x300px, JPG/PNG/WEBP"
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "verification" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Identity Verification Required
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            To ensure the security of our platform and comply with regulatory requirements,
                            we need to verify your identity. All information is encrypted and stored securely.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Selfie Upload */}
                    <div className="md:col-span-2">
                      {renderFileUpload(
                        "selfie",
                        formData.verification?.selfieImage || "",
                        () => setFormData(prev => ({
                          ...prev,
                          verification: {
                            ...prev.verification!,
                            selfieImage: ""
                          }
                        })),
                        "Selfie Image *",
                        "Clear selfie showing your face. Make sure your face is visible and well-lit."
                      )}
                    </div>

                    {/* NIN Upload */}
                    <div className="md:col-span-2">
                      {renderFileUpload(
                        "nin",
                        formData.verification?.ninImage || "",
                        () => setFormData(prev => ({
                          ...prev,
                          verification: {
                            ...prev.verification!,
                            ninImage: ""
                          }
                        })),
                        "NIN Slip Image *",
                        "Clear image of your National Identification Number (NIN) slip"
                      )}
                    </div>

                    {/* NIN Number */}
                    <div>
                      <label
                        htmlFor="ninNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        NIN Number *
                      </label>
                      <input
                        type="text"
                        id="ninNumber"
                        name="verification.ninNumber"
                        value={formData.verification?.ninNumber || ""}
                        onChange={handleInputChange}
                        required
                        pattern="\d{11}"
                        maxLength={11}
                        placeholder="Enter 11-digit NIN"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {formData.verification?.ninNumber && !validateNIN(formData.verification.ninNumber) && (
                        <p className="mt-1 text-sm text-red-600">
                          NIN must be exactly 11 digits
                        </p>
                      )}
                    </div>

                    {/* BVN Number */}
                    <div>
                      <label
                        htmlFor="bvnNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        BVN Number *
                      </label>
                      <input
                        type="text"
                        id="bvnNumber"
                        name="verification.bvnNumber"
                        value={formData.verification?.bvnNumber || ""}
                        onChange={handleInputChange}
                        required
                        pattern="\d{11}"
                        maxLength={11}
                        placeholder="Enter 11-digit BVN"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {formData.verification?.bvnNumber && !validateBVN(formData.verification.bvnNumber) && (
                        <p className="mt-1 text-sm text-red-600">
                          BVN must be exactly 11 digits
                        </p>
                      )}
                    </div>

                    {/* Residential Address */}
                    <div className="md:col-span-2">
                      <label
                        htmlFor="residentialAddress"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Residential Address *
                      </label>
                      <textarea
                        id="residentialAddress"
                        name="verification.residentialAddress"
                        value={formData.verification?.residentialAddress || ""}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        placeholder="Enter your complete residential address"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Submit Verification
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "banking" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Account Verification Required
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            All bank accounts must be verified using Paystack to ensure authenticity
                            and prevent fraudulent transactions. This helps protect both you and your customers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Bank Name
                          </label>
                          {loadingBanks ? (
                            <div className="mt-1 flex items-center">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-sm text-gray-500">Loading banks...</span>
                            </div>
                          ) : (
                            <select
                              value={account.bankCode}
                              onChange={(e) => {
                                const selectedBank = banks.find(bank => bank.code === e.target.value);
                                handleBankAccountChange(account.id, "bankCode", e.target.value);
                                handleBankAccountChange(account.id, "bankName", selectedBank?.name || "");
                                // Reset verification status when bank changes
                                handleBankAccountChange(account.id, "isVerified", false);
                                handleBankAccountChange(account.id, "verificationStatus", "pending");
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Select a bank</option>
                              {banks.map((bank) => (
                                <option key={bank.id} value={bank.code}>
                                  {bank.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Account Number
                          </label>
                          <div className="mt-1 flex">
                            <input
                              type="text"
                              value={account.accountNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                handleBankAccountChange(account.id, "accountNumber", value);
                                // Reset verification when account number changes
                                if (account.isVerified) {
                                  handleBankAccountChange(account.id, "isVerified", false);
                                  handleBankAccountChange(account.id, "verificationStatus", "pending");
                                }
                              }}
                              placeholder="Enter 10-digit account number"
                              maxLength={10}
                              className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => verifyAccount(account.id)}
                              disabled={
                                !account.accountNumber ||
                                !account.bankCode ||
                                account.verificationStatus === 'verifying' ||
                                !validateAccountNumber(account.accountNumber)
                              }
                              className={`px-4 py-2 rounded-r-md text-sm font-medium border border-l-0 transition-colors ${account.verificationStatus === 'verifying'
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : account.isVerified
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
                                }`}
                            >
                              {account.verificationStatus === 'verifying' ? (
                                <div className="flex items-center">
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                  Verifying...
                                </div>
                              ) : account.isVerified ? (
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verified
                                </div>
                              ) : (
                                'Verify'
                              )}
                            </button>
                          </div>
                          {account.accountNumber && !validateAccountNumber(account.accountNumber) && (
                            <p className="mt-1 text-sm text-red-600">
                              Account number must be exactly 10 digits
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Account Name
                          </label>
                          <div className="mt-1 flex items-center">
                            <input
                              type="text"
                              value={account.accountName}
                              onChange={(e) =>
                                handleBankAccountChange(
                                  account.id,
                                  "accountName",
                                  e.target.value
                                )
                              }
                              readOnly={account.isVerified}
                              className={`block w-full rounded-md shadow-sm sm:text-sm ${account.isVerified
                                  ? 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                              placeholder={account.isVerified ? '' : 'Will be auto-filled after verification'}
                            />
                            {account.isVerified && (
                              <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                            )}
                            {account.verificationStatus === 'failed' && (
                              <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
                            )}
                          </div>
                          {account.verificationMessage && (
                            <p className={`mt-1 text-sm ${account.verificationStatus === 'verified'
                                ? 'text-green-600'
                                : account.verificationStatus === 'failed'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}>
                              {account.verificationMessage}
                            </p>
                          )}
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
                              className="text-red-600 hover:text-red-800 transition-colors"
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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Add Bank Account
                  </button>

                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;