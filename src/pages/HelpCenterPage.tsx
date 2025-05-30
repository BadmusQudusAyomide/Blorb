import React from 'react';
import { HelpCircle, BookOpen, MessageSquare, Phone, Mail, Zap } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import { MessageCircle } from 'lucide-react';

const HelpCenterPage = () => {
  const helpTopics = [
    {
      title: "Getting Started",
      icon: <Zap className="w-5 h-5 text-blue-600" />,
      items: ["Account Setup", "First Steps", "Dashboard Tour"]
    },
    {
      title: "Guides",
      icon: <BookOpen className="w-5 h-5 text-green-600" />,
      items: ["Product Management", "Order Processing", "Analytics"]
    },
    {
      title: "Troubleshooting",
      icon: <HelpCircle className="w-5 h-5 text-red-600" />,
      items: ["Common Issues", "Error Messages", "Recovery"]
    }
  ];

  const supportMethods = [
    {
      name: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: <MessageCircle className="h-6 w-6 text-blue-600" />,
      action: 'Start Chat'
    },
    {
      name: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      action: 'Send Email'
    },
    {
      name: 'Phone Support',
      description: 'Call us directly for immediate assistance',
      icon: <Phone className="h-6 w-6 text-blue-600" />,
      action: 'Call Now'
    },
    {
      name: 'Knowledge Base',
      description: 'Browse our comprehensive help articles',
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
      action: 'Browse Articles'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900">Help Center</h2>
            <p className="text-gray-600">Get the support you need</p>
          </div>
          
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search help articles..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <HelpCircle className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {helpTopics.map((topic, index) => (
              <div key={index} className="bg-white rounded-lg shadow border border-blue-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-opacity-20 mr-3">
                    {topic.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">{topic.title}</h3>
                </div>
                <ul className="space-y-2">
                  {topic.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-blue-600 hover:underline cursor-pointer py-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportMethods.map((method, index) => (
              <div key={index} className="bg-white rounded-lg shadow border border-blue-100 p-6 hover:shadow-md transition-shadow text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-4">
                  {method.icon}
                </div>
                <h4 className="text-lg font-medium text-blue-900 mb-2">{method.name}</h4>
                <p className="text-gray-600 mb-4">{method.description}</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                  {method.action}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-blue-900 mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
                <h4 className="text-lg font-medium text-blue-900 mb-2">How do I track my order?</h4>
                <p className="text-gray-600">You can track your order by logging into your account and visiting the Orders page. Each order has a tracking number that you can use to monitor its status.</p>
              </div>
              <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
                <h4 className="text-lg font-medium text-blue-900 mb-2">What is your return policy?</h4>
                <p className="text-gray-600">We offer a 30-day return policy for most items. Products must be unused and in their original packaging. Please contact our support team to initiate a return.</p>
              </div>
              <div className="bg-white rounded-lg shadow border border-blue-100 p-6">
                <h4 className="text-lg font-medium text-blue-900 mb-2">How can I update my account information?</h4>
                <p className="text-gray-600">You can update your account information by going to the Settings page. Here you can modify your personal details, shipping addresses, and payment methods.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenterPage;