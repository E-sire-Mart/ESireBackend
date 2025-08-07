const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules for payment methods
const paymentValidationRules = [
  body('type')
    .isIn(['card', 'upi', 'wallet', 'paypal', 'peonio'])
    .withMessage('Invalid payment type'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment method name is required and must be less than 100 characters'),
  body('number')
    .optional()
    .custom((value, { req }) => {
      if (req.body.type === 'card') {
        const cleanNumber = value.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cleanNumber)) {
          throw new Error('Invalid card number format');
        }
      }
      if (req.body.type === 'upi') {
        if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(value)) {
          throw new Error('Invalid UPI ID format');
        }
      }
      return true;
    }),
  body('cardType')
    .optional()
    .isIn(['Visa', 'Mastercard', 'American Express', 'Discover', 'RuPay'])
    .withMessage('Invalid card type'),
  body('expiryDate')
    .optional()
    .custom((value) => {
      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!expiryRegex.test(value)) {
        throw new Error('Invalid expiry date format. Use MM/YY format');
      }
      
      const [month, year] = value.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      const cardYear = parseInt(year);
      const cardMonth = parseInt(month);
      
      if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
        throw new Error('Card has expired');
      }
      
      return true;
    }),
  body('cvv')
    .optional()
    .isLength({ min: 3, max: 4 })
    .isNumeric()
    .withMessage('CVV must be 3 or 4 digits'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
];

// Update validation rules (more flexible)
const updatePaymentValidationRules = [
  body('type')
    .optional()
    .isIn(['card', 'upi', 'wallet', 'paypal', 'peonio'])
    .withMessage('Invalid payment type'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment method name must be less than 100 characters'),
  body('number')
    .optional()
    .custom((value, { req }) => {
      if (req.body.type === 'card' || req.body.type === 'upi') {
        if (req.body.type === 'card') {
          const cleanNumber = value.replace(/\s/g, '');
          if (!/^\d{13,19}$/.test(cleanNumber)) {
            throw new Error('Invalid card number format');
          }
        }
        if (req.body.type === 'upi') {
          if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(value)) {
            throw new Error('Invalid UPI ID format');
          }
        }
      }
      return true;
    }),
  body('cardType')
    .optional()
    .isIn(['Visa', 'Mastercard', 'American Express', 'Discover', 'RuPay'])
    .withMessage('Invalid card type'),
  body('expiryDate')
    .optional()
    .custom((value) => {
      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!expiryRegex.test(value)) {
        throw new Error('Invalid expiry date format. Use MM/YY format');
      }
      
      const [month, year] = value.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      const cardYear = parseInt(year);
      const cardMonth = parseInt(month);
      
      if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
        throw new Error('Card has expired');
      }
      
      return true;
    }),
  body('cvv')
    .optional()
    .isLength({ min: 3, max: 4 })
    .isNumeric()
    .withMessage('CVV must be 3 or 4 digits'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
];

// All routes require authentication
router.use(authenticate);

// GET /api/v1/payment - Get user's payment methods
router.get('/', paymentController.getUserPayments);

// GET /api/v1/payment/default - Get user's default payment method
router.get('/default', paymentController.getDefaultPayment);

// POST /api/v1/payment/add - Add new payment method
router.post('/add', paymentValidationRules, paymentController.addPayment);

// PUT /api/v1/payment/update/:id - Update payment method
router.put('/update/:id', updatePaymentValidationRules, paymentController.updatePayment);

// DELETE /api/v1/payment/delete/:id - Delete payment method
router.delete('/delete/:id', paymentController.deletePayment);

// PUT /api/v1/payment/default/:id - Set payment method as default
router.put('/default/:id', paymentController.setDefaultPayment);

module.exports = router;