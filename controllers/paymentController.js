const User = require('../models/User');
const Payment = require('../models/Payment');

// Add new payment method
const addPayment = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const paymentData = req.body;

    console.log('Adding payment method for user:', userId);
    console.log('Payment data:', paymentData);

    // Validate required fields
    if (!paymentData.type || !paymentData.name) {
      return res.status(400).json({
        success: false,
        message: 'Payment type and name are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate payment type
    const validTypes = ['card', 'upi', 'wallet', 'paypal', 'peonio'];
    if (!validTypes.includes(paymentData.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type'
      });
    }

    // Additional validation for card type
    if (paymentData.type === 'card') {
      if (!paymentData.number || !paymentData.cardType || !paymentData.expiryDate || !paymentData.cvv) {
        return res.status(400).json({
          success: false,
          message: 'Card number, type, expiry date, and CVV are required for card payments'
        });
      }

      // Validate card number format (remove spaces for validation)
      const cleanNumber = paymentData.number.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cleanNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card number format'
        });
      }

      // Validate expiry date format
      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!expiryRegex.test(paymentData.expiryDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expiry date format. Use MM/YY format'
        });
      }

      // Check if card is expired
      const [month, year] = paymentData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      const cardYear = parseInt(year);
      const cardMonth = parseInt(month);
      
      if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
        return res.status(400).json({
          success: false,
          message: 'Card has expired'
        });
      }

      // Validate CVV
      if (!/^\d{3,4}$/.test(paymentData.cvv)) {
        return res.status(400).json({
          success: false,
          message: 'CVV must be 3 or 4 digits'
        });
      }
    }

    // Additional validation for UPI
    if (paymentData.type === 'upi') {
      if (!paymentData.number) {
        return res.status(400).json({
          success: false,
          message: 'UPI ID is required'
        });
      }

      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
      if (!upiRegex.test(paymentData.number)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UPI ID format'
        });
      }
    }

    // Check if this payment method already exists for the user
    const existingPayment = await Payment.findOne({
      userId,
      type: paymentData.type,
      number: paymentData.number,
      isActive: true
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'This payment method already exists'
      });
    }

    // Create new payment method
    const newPayment = new Payment({
      userId,
      ...paymentData
    });

    // If this is the first payment method, make it default
    const existingPayments = await Payment.countDocuments({ userId, isActive: true });
    if (existingPayments === 0) {
      newPayment.isDefault = true;
    }

    await newPayment.save();

    // Return masked payment data
    const safePayment = newPayment.toSafeJSON();

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: safePayment
    });

  } catch (error) {
    console.error('Error adding payment method:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's payment methods
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const payments = await Payment.getUserPayments(userId);
    const safePayments = payments.map(payment => payment.toSafeJSON());

    res.json({
      success: true,
      data: safePayments
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update payment method
const updatePayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentId = req.params.id;
    const updateData = req.body;

    console.log('Updating payment method:', paymentId);
    console.log('Update data:', updateData);

    // Find the payment method
    const payment = await Payment.findOne({ _id: paymentId, userId, isActive: true });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Validate payment type if being updated
    if (updateData.type && !['card', 'upi', 'wallet', 'paypal', 'peonio'].includes(updateData.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type'
      });
    }

    // Additional validation for card updates
    if (updateData.type === 'card' || payment.type === 'card') {
      if (updateData.number) {
        const cleanNumber = updateData.number.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cleanNumber)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid card number format'
          });
        }
      }

      if (updateData.expiryDate) {
        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryRegex.test(updateData.expiryDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid expiry date format. Use MM/YY format'
          });
        }

        // Check if card is expired
        const [month, year] = updateData.expiryDate.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        const cardYear = parseInt(year);
        const cardMonth = parseInt(month);
        
        if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
          return res.status(400).json({
            success: false,
            message: 'Card has expired'
          });
        }
      }

      if (updateData.cvv && !/^\d{3,4}$/.test(updateData.cvv)) {
        return res.status(400).json({
          success: false,
          message: 'CVV must be 3 or 4 digits'
        });
      }
    }

    // Additional validation for UPI updates
    if (updateData.type === 'upi' || payment.type === 'upi') {
      if (updateData.number) {
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
        if (!upiRegex.test(updateData.number)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid UPI ID format'
          });
        }
      }
    }

    // Update the payment method
    Object.assign(payment, updateData);
    await payment.save();

    // Return masked payment data
    const safePayment = payment.toSafeJSON();

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: safePayment
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete payment method (soft delete)
const deletePayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentId = req.params.id;

    console.log('Deleting payment method:', paymentId);

    // Find the payment method
    const payment = await Payment.findOne({ _id: paymentId, userId, isActive: true });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // If this is the default payment method, we need to set another one as default
    if (payment.isDefault) {
      const otherPayments = await Payment.find({ 
        userId, 
        _id: { $ne: paymentId }, 
        isActive: true 
      }).limit(1);

      if (otherPayments.length > 0) {
        otherPayments[0].isDefault = true;
        await otherPayments[0].save();
      }
    }

    // Soft delete by setting isActive to false
    payment.isActive = false;
    payment.isDefault = false;
    await payment.save();

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Set default payment method
const setDefaultPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentId = req.params.id;

    console.log('Setting default payment method:', paymentId);

    // Find the payment method
    const payment = await Payment.findOne({ _id: paymentId, userId, isActive: true });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Set all other payment methods to non-default
    await Payment.updateMany(
      { userId, _id: { $ne: paymentId }, isActive: true },
      { isDefault: false }
    );

    // Set this payment method as default
    payment.isDefault = true;
    await payment.save();

    // Return masked payment data
    const safePayment = payment.toSafeJSON();

    res.json({
      success: true,
      message: 'Default payment method updated successfully',
      data: safePayment
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get default payment method
const getDefaultPayment = async (req, res) => {
  try {
    const userId = req.user.userId;

    const defaultPayment = await Payment.getDefaultPayment(userId);
    
    if (!defaultPayment) {
      return res.status(404).json({
        success: false,
        message: 'No default payment method found'
      });
    }

    // Return masked payment data
    const safePayment = defaultPayment.toSafeJSON();

    res.json({
      success: true,
      data: safePayment
    });

  } catch (error) {
    console.error('Error fetching default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  addPayment,
  getUserPayments,
  updatePayment,
  deletePayment,
  setDefaultPayment,
  getDefaultPayment
};