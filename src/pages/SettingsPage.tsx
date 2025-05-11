import { Settings, User, Shield, CreditCard, Bell } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';

const SettingsPage = () => {
  const settingsSections = [
    {
      title: 'Account Settings',
      icon: <User className="w-5 h-5 text-indigo-600" />,
      items: ['Profile Information', 'Change Password', 'Email Preferences']
    },
    {
      title: 'Security',
      icon: <Shield className="w-5 h-5 text-green-600" />,
      items: ['Two-Factor Authentication', 'Login History', 'Connected Devices']
    },
    {
      title: 'Billing',
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      items: ['Payment Methods', 'Billing History', 'Subscription']
    },
    {
      title: 'Notifications',
      icon: <Bell className="w-5 h-5 text-yellow-600" />,
      items: ['Email Notifications', 'Push Notifications', 'SMS Alerts']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <TopBar />
      
      <main className="pt-16 pl-0 lg:pl-64">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account preferences and security settings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsSections.map((section, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 mr-3">
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li 
                      key={itemIndex}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 text-gray-400" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* App Preferences Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20 mr-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  App Preferences
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-800 dark:text-gray-200">Dark Mode</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-800 dark:text-gray-200">Language</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      English (United States)
                    </p>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;