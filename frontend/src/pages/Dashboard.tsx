import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { sweetsAPI } from '../services/api';
import Navbar from '../components/Navbar.tsx';
import '../styles/Dashboard.css';

interface Sweet {
  _id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  console.log('[Dashboard] Rendering, user:', user);
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [filteredSweets, setFilteredSweets] = useState<Sweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Search filters
  const [searchName, setSearchName] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    console.log('[Dashboard] Component mounted, fetching sweets');
    fetchSweets();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchName, searchCategory, minPrice, maxPrice, sweets]);

  const fetchSweets = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[Dashboard] Fetching sweets...');
      const response = await sweetsAPI.getAll();
      const sweetsData = response.data.sweets || response.data || [];
      console.log('[Dashboard] Sweets fetched:', sweetsData.length);
      setSweets(sweetsData);
      setFilteredSweets(sweetsData);
    } catch (err: any) {
      console.error('[Dashboard] Failed to fetch sweets:', err);
      if (err.response?.status !== 401) {
        setError('Failed to load sweets. Please try again.');
      }
    } finally {
      setLoading(false);
      console.log('[Dashboard] Fetch complete');
    }
  };

  const handleSearch = async () => {
    if (!searchName && !searchCategory && !minPrice && !maxPrice) {
      setFilteredSweets(sweets);
      return;
    }

    try {
      const params: any = {};
      if (searchName) params.name = searchName;
      if (searchCategory) params.category = searchCategory;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);

      const response = await sweetsAPI.search(params);
      const searchResults = response.data.sweets || response.data || [];
      setFilteredSweets(searchResults);
    } catch (err: any) {
      console.error('Search error:', err);
      setFilteredSweets([]);
    }
  };

  const handleAddToCart = (sweet: Sweet) => {
    addToCart({
      sweetId: sweet._id,
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: 1,
      maxQuantity: sweet.quantity,
    });
    setSuccessMessage(`Added ${sweet.name} to cart!`);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const clearFilters = () => {
    setSearchName('');
    setSearchCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  const categories = Array.from(new Set(sweets.map(s => s.category)));

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Sweet Shop Dashboard</h1>
          <p>Welcome, {user?.name}!</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Search Filters */}
        <div className="search-section">
          <h2>Search Sweets</h2>
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="search-input"
            />
            
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="search-select"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="search-input price-input"
              min="0"
              step="0.01"
            />

            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="search-input price-input"
              min="0"
              step="0.01"
            />

            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>

        {/* Sweets Grid */}
        {loading ? (
          <div className="loading">Loading sweets...</div>
        ) : filteredSweets.length === 0 ? (
          <div className="no-results">
            <p>No sweets found matching your criteria.</p>
          </div>
        ) : (
          <div className="sweets-grid">
            {filteredSweets.map((sweet) => (
              <div key={sweet._id} className="sweet-card">
                <div className="sweet-header">
                  <h3>{sweet.name}</h3>
                  <span className="category-badge">{sweet.category}</span>
                </div>
                <div className="sweet-details">
                  <p className="price">₹{sweet.price.toFixed(2)}</p>
                  <p className={`stock ${sweet.quantity === 0 ? 'out-of-stock' : ''}`}>
                    Stock: {sweet.quantity}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddToCart(sweet)}
                  disabled={sweet.quantity === 0}
                >
                  {sweet.quantity === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
