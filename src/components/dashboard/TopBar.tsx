const TopBar = () => {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-10 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">Hello, Seller</span>
        <img
          src="https://i.pravatar.cc/40"
          alt="avatar"
          className="w-10 h-10 rounded-full border"
        />
      </div>
    </header>
  );
};

export default TopBar;
