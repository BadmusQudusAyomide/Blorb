import { HelpCircle, BookOpen, MessageSquare, Phone, Mail, Zap } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';

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

  const contactMethods = [
    {
      name: "Live Chat",
      icon: <MessageSquare className="w-6 h-6" />,
      description: "Chat with our support team in real-time",
      action: "Start Chat"
    },
    {
      name: "Email Support",
      icon: <Mail className="w-6 h-6" />,
      description: "Get a response within 24 hours",
      action: "Send Email"
    },
    {
      name: "Phone Support",
      icon: <Phone className="w-6 h-6" />,
      description: "Available 9AM-5PM EST",
      action: "Call Now"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Help Center</h2>
            <p className="text-gray-600 dark:text-gray-400">Find answers to common questions or contact our support team</p>
          </div>
          
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search help articles..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
              />
              <HelpCircle className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {helpTopics.map((topic, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-opacity-20 mr-3">
                    {topic.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{topic.title}</h3>
                </div>
                <ul className="space-y-2">
                  {topic.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer py-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                "How do I reset my password?",
                "Where can I find my invoices?",
                "How to integrate with Shopify?",
                "What payment methods do you accept?",
                "How to cancel my subscription?"
              ].map((question, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-800 pb-4">
                  <h4 className="text-gray-800 dark:text-gray-200 font-medium mb-1">{question}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris.</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Contact Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                    {method.icon}
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">{method.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{method.description}</p>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm">
                    {method.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenterPage;