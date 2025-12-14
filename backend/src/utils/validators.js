// Validation helper functions

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object|null} - Error object or null if valid
 */
exports.validateRequiredFields = (body, requiredFields) => {
  const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0);
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Please provide ${missingFields.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Validate positive number
 * @param {Number} value - Value to validate
 * @param {String} fieldName - Name of the field
 * @returns {Object} - Validation result
 */
exports.validatePositiveNumber = (value, fieldName = 'value') => {
  if (typeof value !== 'number' || value < 0) {
    return {
      isValid: false,
      message: `${fieldName} must be a positive number`
    };
  }
  
  return { isValid: true };
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Object} - Validation result
 */
exports.validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please provide a valid email'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate quantity
 * @param {Number} quantity - Quantity to validate
 * @returns {Object} - Validation result
 */
exports.validateQuantity = (quantity) => {
  if (!quantity || quantity === undefined) {
    return {
      isValid: false,
      message: 'Please provide a quantity'
    };
  }

  if (quantity <= 0) {
    return {
      isValid: false,
      message: 'Quantity must be greater than zero'
    };
  }

  return { isValid: true };
};
