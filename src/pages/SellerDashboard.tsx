import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';

const SellerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <TopBar />
      <main className="pt-20 pl-64 p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome to your Seller Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">Total Orders</div>
          <div className="bg-white p-4 rounded-lg shadow">Products</div>
          <div className="bg-white p-4 rounded-lg shadow">Revenue</div>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
