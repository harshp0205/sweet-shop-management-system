import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { sweetsAPI } from '../services/api';
import Navbar from '../components/Navbar.tsx';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Process each item in cart
      for (const item of cart) {
        await sweetsAPI.purchase(item.sweetId, item.quantity);
      }

      setSuccess(`Successfully purchased ${getTotalItems()} items for ₹${getTotalPrice().toFixed(2)}!`);
      
      // Clear cart after successful purchase
      setTimeout(() => {
        clearCart();
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.error || 'Failed to complete purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some delicious sweets to your cart!</p>
            <Link to="/dashboard" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Navbar />
      
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <p>Review your items and proceed to checkout</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="cart-content">
          <div className="cart-items">
            <h2>Cart Items ({getTotalItems()})</h2>
            
            {cart.map((item) => (
              <div key={item.sweetId} className="cart-item">
                <div className="item-image">
                  {item.name.charAt(0)}
                </div>
                
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <span className="item-category">{item.category}</span>
                  <div className="item-price">₹{item.price.toFixed(2)} each</div>
                  <div style={{ fontSize: '14px', color: '#999', marginTop: '4px' }}>
                    Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div className="item-actions">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.sweetId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.sweetId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.sweetId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-row">
              <span>Items ({getTotalItems()})</span>
              <span>₹{getTotalPrice().toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Delivery</span>
              <span style={{ color: '#28a745', fontWeight: 600 }}>FREE</span>
            </div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span className="price">₹{getTotalPrice().toFixed(2)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
            >
              {loading ? 'Processing...' : 'Checkout'}
            </button>

            <button
              className="clear-cart-btn"
              onClick={handleClearCart}
              disabled={loading}
            >
              Clear Cart
            </button>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '10px', fontSize: '14px', color: '#666' }}>
              <p style={{ margin: 0 }}>💡 <strong>Note:</strong> All purchases will update inventory in real-time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
