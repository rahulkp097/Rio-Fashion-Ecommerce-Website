const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number
  },
  couponDiscount:{
    type: Number
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  shippingAddress: {
    name: String,
    houseNumber: String,
    city: String,
    state: String,
    pin: Number,
    phone: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String, 
    default: "Pending"}
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
