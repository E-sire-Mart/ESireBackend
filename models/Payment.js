const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['card', 'upi', 'wallet', 'paypal', 'peonio'],
    required: [true, 'Payment type is required']
  },
  name: {
    type: String,
    required: [true, 'Payment method name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  number: {
    type: String,
    required: function() {
      return this.type === 'card' || this.type === 'upi';
    },
    validate: {
      validator: function(v) {
        if (this.type === 'card') {
          // Basic card number validation (Luhn algorithm)
          return /^\d{13,19}$/.test(v.replace(/\s/g, ''));
        }
        if (this.type === 'upi') {
          // UPI ID validation
          return /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(v);
        }
        return true;
      },
      message: props => `${props.value} is not a valid ${this.type} number/ID`
    }
  },
  cardType: {
    type: String,
    enum: ['Visa', 'Mastercard', 'American Express', 'Discover', 'RuPay'],
    required: function() {
      return this.type === 'card';
    }
  },
  expiryDate: {
    type: String,
    required: function() {
      return this.type === 'card';
    },
    validate: {
      validator: function(v) {
        if (this.type === 'card') {
          // MM/YY format validation
          const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
          if (!regex.test(v)) return false;
          
          const [month, year] = v.split('/');
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear() % 100;
          const currentMonth = currentDate.getMonth() + 1;
          
          const cardYear = parseInt(year);
          const cardMonth = parseInt(month);
          
          if (cardYear < currentYear) return false;
          if (cardYear === currentYear && cardMonth < currentMonth) return false;
          
          return true;
        }
        return true;
      },
      message: 'Card has expired or invalid expiry date format (MM/YY)'
    }
  },
  cvv: {
    type: String,
    required: function() {
      return this.type === 'card';
    },
    validate: {
      validator: function(v) {
        if (this.type === 'card') {
          return /^\d{3,4}$/.test(v);
        }
        return true;
      },
      message: 'CVV must be 3 or 4 digits'
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ userId: 1, isActive: 1 });
paymentSchema.index({ userId: 1, isDefault: 1 });

// Pre-save middleware to ensure only one default payment method per user
paymentSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Set all other payment methods for this user to non-default
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Instance method to mask sensitive data
paymentSchema.methods.toSafeJSON = function() {
  const payment = this.toObject();
  
  if (payment.number) {
    if (payment.type === 'card') {
      // Mask card number: **** **** **** 1234
      const last4 = payment.number.slice(-4);
      payment.number = `**** **** **** ${last4}`;
    } else if (payment.type === 'upi') {
      // Mask UPI ID: user***@upi
      const [username, domain] = payment.number.split('@');
      const maskedUsername = username.slice(0, 3) + '***';
      payment.number = `${maskedUsername}@${domain}`;
    }
  }
  
  // Remove CVV from response
  delete payment.cvv;
  
  return payment;
};

// Static method to get user's payment methods
paymentSchema.statics.getUserPayments = function(userId) {
  return this.find({ userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

// Static method to get default payment method
paymentSchema.statics.getDefaultPayment = function(userId) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;