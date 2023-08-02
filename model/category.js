const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  offer: {
    isOfferAvailable: {
      type: Boolean,
      default: false,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    offerDescription: {
      type: String,
    },
   
  },
});

const Category = mongoose.model('category', categorySchema);

module.exports = Category;
