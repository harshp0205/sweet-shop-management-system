import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sweetsAPI } from '../services/api';
import Navbar from '../components/Navbar';
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
  
  // Purchase modal
  const [selectedSweet, setSelectedSweet] = useState<Sweet | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchSweets();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchName, searchCategory, minPrice, maxPrice, sweets]);

  const fetchSweets = async () => {
    try {
      setLoading(true);
      const response = await sweetsAPI.getAll();
      setSweets(response.data);
      setFilteredSweets(response.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load sweets. Please try again.');
    } finally {
      setLoading(false);
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
      setFilteredSweets(response.data);
    } catch (err: any) {
      console.error('Search error:', err);
      setFilteredSweets([]);
    }
  };

  const handlePurchase = async () => {
    if (!selectedSweet) return;

    if (purchaseQuantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    if (purchaseQuantity > selectedSweet.quantity) {
      setError('Not enough stock available');
      return;
    }

    setPurchaseLoading(true);
    setError('');

    try {
      await sweetsAPI.purchase(selectedSweet._id, purchaseQuantity);
      setSuccessMessage(`Successfully purchased ${purchaseQuantity} ${selectedSweet.name}(s)!`);
      setSelectedSweet(null);
      setPurchaseQuantity(1);
      fetchSweets(); // Refresh list
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Purchase failed. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
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
                  <p className="price">${sweet.price.toFixed(2)}</p>
                  <p className={`stock ${sweet.quantity === 0 ? 'out-of-stock' : ''}`}>
                    Stock: {sweet.quantity}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setSelectedSweet(sweet)}
                  disabled={sweet.quantity === 0}
                >
                  {sweet.quantity === 0 ? 'Out of Stock' : 'Purchase'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedSweet && (
        <div className="modal-overlay" onClick={() => setSelectedSweet(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Purchase {selectedSweet.name}</h2>
            <div className="modal-content">
              <p><strong>Category:</strong> {selectedSweet.category}</p>
              <p><strong>Price:</strong> ${selectedSweet.price.toFixed(2)}</p>
              <p><strong>Available:</strong> {selectedSweet.quantity}</p>
              
              <div className="form-group">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={selectedSweet.quantity}
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <p className="total-price">
                <strong>Total:</strong> ${(selectedSweet.price * purchaseQuantity).toFixed(2)}
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedSweet(null)}
                disabled={purchaseLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePurchase}
                disabled={purchaseLoading}
              >
                {purchaseLoading ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
