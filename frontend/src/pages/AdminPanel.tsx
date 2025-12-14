import { useState, useEffect } from 'react';
import { sweetsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import '../styles/Admin.css';

interface Sweet {
  _id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface SweetFormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
}

const AdminPanel = () => {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SweetFormData>({
    name: '',
    category: '',
    price: '',
    quantity: '',
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // Restock modal
  const [restockSweet, setRestockSweet] = useState<Sweet | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<string>('');
  const [restockLoading, setRestockLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchSweets();
  }, []);

  const fetchSweets = async () => {
    try {
      setLoading(true);
      const response = await sweetsAPI.getAll();
      setSweets(response.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load sweets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', price: '', quantity: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const data = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
    };

    try {
      if (isEditing && editingId) {
        await sweetsAPI.update(editingId, data);
        setSuccessMessage('Sweet updated successfully!');
      } else {
        await sweetsAPI.create(data);
        setSuccessMessage('Sweet added successfully!');
      }

      resetForm();
      fetchSweets();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (sweet: Sweet) => {
    setIsEditing(true);
    setEditingId(sweet._id);
    setFormData({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price.toString(),
      quantity: sweet.quantity.toString(),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await sweetsAPI.delete(id);
      setSuccessMessage('Sweet deleted successfully!');
      fetchSweets();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed. Please try again.');
    }
  };

  const handleRestock = async () => {
    if (!restockSweet) return;

    const qty = parseInt(restockQuantity);
    if (qty < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setRestockLoading(true);
    setError('');

    try {
      await sweetsAPI.restock(restockSweet._id, qty);
      setSuccessMessage(`Successfully restocked ${qty} units of ${restockSweet.name}!`);
      setRestockSweet(null);
      setRestockQuantity('');
      fetchSweets();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Restock failed. Please try again.');
    } finally {
      setRestockLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <Navbar />

      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>Manage your sweet inventory</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Add/Edit Form */}
        <div className="admin-form-section">
          <h2>{isEditing ? 'Edit Sweet' : 'Add New Sweet'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Chocolate Bar"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Chocolate"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g., 2.50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            <div className="form-actions">
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Saving...' : isEditing ? 'Update Sweet' : 'Add Sweet'}
              </button>
            </div>
          </form>
        </div>

        {/* Sweets Table */}
        <div className="admin-table-section">
          <h2>All Sweets</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : sweets.length === 0 ? (
            <div className="no-data">No sweets available. Add one above!</div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sweets.map((sweet) => (
                    <tr key={sweet._id}>
                      <td>{sweet.name}</td>
                      <td>
                        <span className="category-badge">{sweet.category}</span>
                      </td>
                      <td>${sweet.price.toFixed(2)}</td>
                      <td>
                        <span className={sweet.quantity === 0 ? 'low-stock' : ''}>
                          {sweet.quantity}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-small btn-info"
                            onClick={() => setRestockSweet(sweet)}
                          >
                            Restock
                          </button>
                          <button
                            className="btn btn-small btn-warning"
                            onClick={() => handleEdit(sweet)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDelete(sweet._id, sweet.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Restock Modal */}
      {restockSweet && (
        <div className="modal-overlay" onClick={() => setRestockSweet(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Restock {restockSweet.name}</h2>
            <div className="modal-content">
              <p><strong>Current Stock:</strong> {restockSweet.quantity}</p>

              <div className="form-group">
                <label htmlFor="restockQty">Add Quantity:</label>
                <input
                  type="number"
                  id="restockQty"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="Enter quantity to add"
                />
              </div>

              {restockQuantity && (
                <p className="new-stock">
                  <strong>New Stock:</strong> {restockSweet.quantity + parseInt(restockQuantity || '0')}
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setRestockSweet(null)}
                disabled={restockLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRestock}
                disabled={restockLoading || !restockQuantity}
              >
                {restockLoading ? 'Restocking...' : 'Confirm Restock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
