const Sweet = require('../models/Sweet');

// @desc    Add a new sweet
// @route   POST /api/sweets
// @access  Protected
exports.addSweet = async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;

    // Validate required fields
    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({
        error: 'Please provide name, category, price, and quantity'
      });
    }

    // Validate price and quantity are not negative
    if (price < 0) {
      return res.status(400).json({
        error: 'Price cannot be negative'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        error: 'Quantity cannot be negative'
      });
    }

    const sweet = await Sweet.create({
      name,
      category,
      price,
      quantity
    });

    res.status(201).json({
      sweet
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      error: 'Server error while adding sweet'
    });
  }
};

// @desc    Get all sweets
// @route   GET /api/sweets
// @access  Public
exports.getAllSweets = async (req, res) => {
  try {
    const sweets = await Sweet.find({});

    res.status(200).json({
      sweets
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error while fetching sweets'
    });
  }
};

// @desc    Search sweets by name, category, or price range
// @route   GET /api/sweets/search
// @access  Public
exports.searchSweets = async (req, res) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;

    // Build search query
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    }

    if (category) {
      query.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    const sweets = await Sweet.find(query);

    res.status(200).json({
      sweets
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error while searching sweets'
    });
  }
};

// @desc    Update a sweet
// @route   PUT /api/sweets/:id
// @access  Protected
exports.updateSweet = async (req, res) => {
  try {
    const { name, category, price, quantity } = req.body;

    // Validate price and quantity if provided
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        error: 'Price cannot be negative'
      });
    }

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({
        error: 'Quantity cannot be negative'
      });
    }

    const sweet = await Sweet.findByIdAndUpdate(
      req.params.id,
      { name, category, price, quantity },
      {
        new: true,
        runValidators: true
      }
    );

    if (!sweet) {
      return res.status(404).json({
        error: 'Sweet not found'
      });
    }

    res.status(200).json({
      sweet
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: messages.join(', ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Sweet not found'
      });
    }

    res.status(500).json({
      error: 'Server error while updating sweet'
    });
  }
};

// @desc    Delete a sweet
// @route   DELETE /api/sweets/:id
// @access  Protected (Admin only)
exports.deleteSweet = async (req, res) => {
  try {
    const sweet = await Sweet.findByIdAndDelete(req.params.id);

    if (!sweet) {
      return res.status(404).json({
        error: 'Sweet not found'
      });
    }

    res.status(200).json({
      message: 'Sweet deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: 'Sweet not found'
      });
    }

    res.status(500).json({
      error: 'Server error while deleting sweet'
    });
  }
};
