import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { usePaystack } from '../hooks/usePaystack';
import { 
  Image as ImageIcon,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Calendar,
  DollarSign,
  Star,
  Shield,
  Eye,
  Clock,
  ExternalLink
} from 'lucide-react';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase.config';
import { uploadImage } from '../utils/cloudinary';

interface CarouselPlan {
  id: string;
  name: string;
  days: number;
  price: number;
  features: string[];
  popular?: boolean;
}

interface CarouselItem {
  id?: string;
  image: string;
  title: string;
  description: string;
  link?: string;
  planId: string;
  planName: string;
  days: number;
  price: number;
  paymentStatus: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  status?: 'active' | 'expired' | 'pending';
  views?: number;
}

interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

const CarouselPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { initiatePayment, verifyPayment, loading: paymentLoading, error: paymentError } = usePaystack();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [pastAds, setPastAds] = useState<CarouselItem[]>([]);
  const [loadingPastAds, setLoadingPastAds] = useState(false);
  
  // Plans data with Nigerian Naira pricing
  const [plans] = useState<CarouselPlan[]>([
    {
      id: 'basic',
      name: 'Basic Plan',
      days: 7,
      price: 25000, // ₦25,000
      features: [
        '7 days carousel display',
        'Standard positioning',
        'Basic analytics',
        'Mobile optimized'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      days: 14,
      price: 45000, // ₦45,000
      features: [
        '14 days carousel display',
        'Priority positioning',
        'Advanced analytics',
        'Mobile optimized',
        'Featured badge'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      days: 30,
      price: 75000, // ₦75,000
      features: [
        '30 days carousel display',
        'Top priority positioning',
        'Comprehensive analytics',
        'Mobile optimized',
        'Featured badge',
        'Dedicated support'
      ]
    }
  ]);

  // Selected plan and form data
  const [selectedPlan, setSelectedPlan] = useState<CarouselPlan | null>(null);
  const [formData, setFormData] = useState<Partial<CarouselItem>>({
    title: '',
    description: '',
    link: '',
    image: ''
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '4111111111111111', // Default test card
    expiryDate: '12/25',
    cvv: '123',
    cardName: 'Test User'
  });

  const totalSteps = 4;
  const processingFee = 2500; // ₦2,500

  // Fetch past advertisements
  const fetchPastAds = useCallback(async () => {
    if (!user) return;
    
    setLoadingPastAds(true);
    try {
      const q = query(
        collection(db, 'carousel'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ads: CarouselItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: 'active' | 'expired' | 'pending' = 'pending';
        if (data.paymentStatus === 'completed') {
          status = daysDiff >= data.days ? 'expired' : 'active';
        }
        
        ads.push({
          id: doc.id,
          ...data,
          createdAt,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          status,
          views: data.views || Math.floor(Math.random() * 1000) // Mock views for demo
        } as CarouselItem);
      });
      
      setPastAds(ads);
    } catch (error) {
      console.error('Error fetching past ads:', error);
    } finally {
      setLoadingPastAds(false);
    }
  }, [user]);

  // Load past ads when component mounts or user changes
  useEffect(() => {
    if (user && activeTab === 'history') {
      fetchPastAds();
    }
  }, [user, activeTab, fetchPastAds]);

  // Clear messages when step changes
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [currentStep]);

  // Handle payment callback on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');

    if (paymentStatus === 'success' && reference) {
      // Verify payment
      verifyPayment(reference).then((success) => {
        if (success) {
          setSuccess('Payment successful! Your carousel ad has been submitted for review.');
          // Reset form
          setCurrentStep(1);
          setSelectedPlan(null);
          setFormData({
            title: '',
            description: '',
            link: '',
            image: ''
          });
          // Refresh past ads
          if (activeTab === 'history') {
            fetchPastAds();
          }
        } else {
          setError('Payment verification failed. Please contact support.');
        }
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [verifyPayment, activeTab, fetchPastAds]);

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

  // Handle payment input changes
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle plan selection
  const handlePlanSelect = (plan: CarouselPlan) => {
    setSelectedPlan(plan);
    setCurrentStep(2);
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 2) {
      // Validate ad details
      if (!formData.image || !formData.title || !formData.description) {
        setError('Please fill in all required fields and upload an image');
        return;
      }
    }
    
    if (currentStep === 3) {
      // Validate payment details
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardName) {
        setError('Please fill in all payment details');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  // Handle previous step
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle final submission with real Paystack payment
  const handleSubmit = async () => {
    if (!user || !selectedPlan || !user.email) return;

    setProcessing(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.image || !formData.title || !formData.description) {
        setError('Please fill in all required fields');
        return;
      }

      // Initiate real Paystack payment
      await initiatePayment(
        user.email,
        user.uid,
        {
          id: selectedPlan.id,
          name: selectedPlan.name,
          price: selectedPlan.price,
          days: selectedPlan.days,
        },
        {
          title: formData.title!,
          description: formData.description!,
          image: formData.image!,
          link: formData.link,
        }
      );

      // The payment hook will redirect to Paystack
      // Success handling will be done in the callback
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError(paymentError || 'Payment initialization failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Format Nigerian Naira
  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep >= step 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
            }
          `}>
            {currentStep > step ? <Check className="w-5 h-5" /> : step}
          </div>
          {index < 3 && (
            <div className={`
              w-12 h-1 mx-2
              ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <TopBar setIsOpen={setIsOpen} />
      
      <main className="pt-16 pl-0 lg:pl-64">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900">Carousel Advertisement</h2>
            <p className="text-gray-600">Promote your business with our homepage carousel</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('new')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'new'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Create New Ad
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Advertisement History
              </button>
            </nav>
          </div>

          {/* New Advertisement Section */}
          {activeTab === 'new' && (
            <>
              <StepIndicator />

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

              {/* Step 1: Plan Selection */}
              {currentStep === 1 && (
                <div className="bg-white rounded-lg shadow border border-blue-100 p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Choose Your Plan</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`
                          relative border-2 rounded-lg p-4 cursor-pointer transition-all
                          ${plan.popular 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                          }
                        `}
                        onClick={() => handlePlanSelect(plan)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </span>
                          </div>
                        )}
                        
                        <div className="text-center mb-3">
                          <h4 className="text-base font-semibold text-blue-900">{plan.name}</h4>
                          <div className="mt-1">
                            <span className="text-2xl font-bold text-blue-600">{formatNaira(plan.price)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{plan.days} days display</p>
                        </div>

                        <ul className="space-y-1 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-xs">
                              <Check className="w-3 h-3 text-green-500 mr-1" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <button className="w-full bg-blue-600 text-white py-1.5 text-sm rounded-md hover:bg-blue-700 transition-colors">
                          Select Plan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Ad Details */}
              {currentStep === 2 && selectedPlan && (
                <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-6">Advertisement Details</h3>
                  
                  <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advertisement Image *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-blue-100 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Preview"
                                className="mx-auto h-32 w-auto object-cover rounded"
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
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
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
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Advertisement Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter a catchy title for your ad"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Describe your product or service"
                  required
                />
              </div>

              {/* Link */}
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700">
                        Link URL (optional)
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="https://yourwebsite.com"
                />
              </div>
              </div>

                  <div className="flex justify-between mt-8">
                  <button
                      onClick={handlePrev}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                  </button>
                <button
                      onClick={handleNext}
                  disabled={uploading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
                </div>
              )}

              {/* Step 3: Quotation */}
              {currentStep === 3 && selectedPlan && (
                <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-6">Order Summary</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Selected Plan</h4>
                      <span className="text-sm text-blue-600 font-medium">{selectedPlan.name}</span>
          </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedPlan.days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium">{formatNaira(selectedPlan.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Fee:</span>
                        <span className="font-medium">{formatNaira(processingFee)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">{formatNaira(selectedPlan.price + processingFee)}</span>
            </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h5 className="font-medium text-blue-900 mb-2">What's Included:</h5>
                    <ul className="space-y-1">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-blue-800">
                          <Check className="w-4 h-4 text-blue-600 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={handlePrev}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Proceed to Payment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Payment */}
              {currentStep === 4 && selectedPlan && (
                <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-6">Payment Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center mb-2">
                          <Shield className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Secure Payment</span>
                        </div>
                        <p className="text-xs text-gray-600">Your payment information is encrypted and secure</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            id="cardName"
                            name="cardName"
                            value={paymentData.cardName}
                            onChange={handlePaymentChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                            Card Number
                          </label>
                          <div className="mt-1 relative">
                            <input
                              type="text"
                              id="cardNumber"
                              name="cardNumber"
                              value={paymentData.cardNumber}
                              onChange={handlePaymentChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
                              placeholder="1234 5678 9012 3456"
                              required
                            />
                            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              id="expiryDate"
                              name="expiryDate"
                              value={paymentData.expiryDate}
                              onChange={handlePaymentChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="MM/YY"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                              CVV
                            </label>
                            <input
                              type="text"
                              id="cvv"
                              name="cvv"
                              value={paymentData.cvv}
                              onChange={handlePaymentChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="123"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h4 className="font-semibold text-blue-900 mb-4">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Plan:</span>
                            <span>{selectedPlan.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{selectedPlan.days} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatNaira(selectedPlan.price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Fee:</span>
                            <span>{formatNaira(processingFee)}</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-blue-600">{formatNaira(selectedPlan.price + processingFee)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handlePrev}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      disabled={processing}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={processing || paymentLoading}
                      className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {(processing || paymentLoading) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {paymentLoading ? 'Redirecting to Payment...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay with Paystack - {formatNaira(selectedPlan.price + processingFee)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Advertisement History Section */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-blue-900">Advertisement History</h3>
                <button
                  onClick={fetchPastAds}
                  disabled={loadingPastAds}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingPastAds ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </button>
              </div>

              {loadingPastAds ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : pastAds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No advertisements yet</h4>
                  <p className="text-gray-600 mb-4">Create your first carousel advertisement to get started.</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Create New Ad
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-900">Total Ads</p>
                          <p className="text-2xl font-bold text-blue-600">{pastAds.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-900">Active</p>
                          <p className="text-2xl font-bold text-green-600">
                            {pastAds.filter(ad => ad.status === 'active').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-900">Pending</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {pastAds.filter(ad => ad.status === 'pending').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-900">Total Views</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {pastAds.reduce((sum, ad) => sum + (ad.views || 0), 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ads List */}
                  <div className="space-y-4">
                    {pastAds.map((ad) => (
                      <div key={ad.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={ad.image}
                              alt={ad.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900 truncate">{ad.title}</h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ad.description}</p>
                                
                                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {ad.createdAt.toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {ad.days} days
                                  </span>
                                  <span className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {(ad.views || 0).toLocaleString()} views
                                  </span>
                                  <span className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {formatNaira(ad.price)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ad.status || 'pending')}`}>
                                  {ad.status === 'active' && 'Active'}
                                  {ad.status === 'expired' && 'Expired'}
                                  {ad.status === 'pending' && 'Pending'}
                                </span>
                                
                                <div className="flex space-x-2">
                                  {ad.link && (
                                    <a
                                      href={ad.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                      title="Visit Link"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                  
                                  <button
                                    className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Plan: {ad.planName}</span>
                                <span className="text-gray-600">
                                  Status: {ad.paymentStatus === 'completed' ? 'Paid' : 'Pending Payment'}
                                </span>
                              </div>
                            </div>
                          </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CarouselPage; 