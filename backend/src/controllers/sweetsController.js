const Sweet = require('../models/Sweet');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { validateRequiredFields, validatePositiveNumber, validateQuantity } = require('../utils/validators');

// @desc    Add a new sweet
// @route   POST /api/sweets
// @access  Protected
exports.addSweet = asyncHandler(async (req, res, next) => {
  const { name, category, price, quantity } = req.body;

  // Validate required fields
  const validation = validateRequiredFields(req.body, ['name', 'category', 'price', 'quantity']);
  if (!validation.isValid) {
    return next(new ErrorResponse(validation.message, 400));
  }

  // Validate price
  const priceValidation = validatePositiveNumber(price, 'Price');
  if (!priceValidation.isValid) {
    return next(new ErrorResponse(priceValidation.message, 400));
  }

  // Validate quantity
  const quantityValidation = validatePositiveNumber(quantity, 'Quantity');
  if (!quantityValidation.isValid) {
    return next(new ErrorResponse(quantityValidation.message, 400));
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
});

// @desc    Get all sweets
// @route   GET /api/sweets
// @access  Public
exports.getAllSweets = asyncHandler(async (req, res) => {
  const sweets = await Sweet.find({});

  res.status(200).json({
    sweets
  });
});

// @desc    Search sweets by name, category, or price range
// @route   GET /api/sweets/search
// @access  Public
exports.searchSweets = asyncHandler(async (req, res) => {
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
});

// @desc    Update a sweet
// @route   PUT /api/sweets/:id
// @access  Protected
exports.updateSweet = asyncHandler(async (req, res, next) => {
  const { price, quantity } = req.body;

  // Validate price if provided
  if (price !== undefined) {
    const priceValidation = validatePositiveNumber(price, 'Price');
    if (!priceValidation.isValid) {
      return next(new ErrorResponse(priceValidation.message, 400));
    }
  }

  // Validate quantity if provided
  if (quantity !== undefined) {
    const quantityValidation = validatePositiveNumber(quantity, 'Quantity');
    if (!quantityValidation.isValid) {
      return next(new ErrorResponse(quantityValidation.message, 400));
    }
  }

  const sweet = await Sweet.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!sweet) {
    return next(new ErrorResponse('Sweet not found', 404));
  }

  res.status(200).json({
    sweet
  });
});

// @desc    Delete a sweet
// @route   DELETE /api/sweets/:id
// @access  Protected (Admin only)
exports.deleteSweet = asyncHandler(async (req, res, next) => {
  const sweet = await Sweet.findByIdAndDelete(req.params.id);

  if (!sweet) {
    return next(new ErrorResponse('Sweet not found', 404));
  }

  res.status(200).json({
    message: 'Sweet deleted successfully'
  });
});

// @desc    Purchase a sweet (reduce quantity)
// @route   POST /api/sweets/:id/purchase
// @access  Protected
exports.purchaseSweet = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  // Validate quantity
  const validation = validateQuantity(quantity);
  if (!validation.isValid) {
    return next(new ErrorResponse(validation.message, 400));
  }

  // Find the sweet
  const sweet = await Sweet.findById(req.params.id);

  if (!sweet) {
    return next(new ErrorResponse('Sweet not found', 404));
  }

  // Check if sweet is in stock
  if (sweet.quantity === 0) {
    return next(new ErrorResponse('Sweet is out of stock', 400));
  }

  // Check if sufficient quantity available
  if (sweet.quantity < quantity) {
    return next(new ErrorResponse('Insufficient quantity available', 400));
  }

  // Reduce quantity
  sweet.quantity -= quantity;
  await sweet.save();

  res.status(200).json({
    message: 'Purchase successful',
    sweet
  });
});

// @desc    Restock a sweet (increase quantity)
// @route   POST /api/sweets/:id/restock
// @access  Protected (Admin only)
exports.restockSweet = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  // Validate quantity
  const validation = validateQuantity(quantity);
  if (!validation.isValid) {
    return next(new ErrorResponse(validation.message, 400));
  }

  // Find the sweet
  const sweet = await Sweet.findById(req.params.id);

  if (!sweet) {
    return next(new ErrorResponse('Sweet not found', 404));
  }

  // Increase quantity
  sweet.quantity += quantity;
  await sweet.save();

  res.status(200).json({
    message: 'Restock successful',
    sweet
  });
});
