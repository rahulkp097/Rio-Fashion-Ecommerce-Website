const CategoryModel = require('../model/category');
const mongoose = require('mongoose');


const { Schema } = mongoose;

const productSchema = new Schema({
    sellingprice: {
    type: Number,
    required: true
  }, 
  offerprice: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },
  image: {
    type: Array,
    required:true
  },
  size:{
    type: String,
       
  },
 brand: {
       type: String,
       required:true},

category: {
      type: Schema.Types.ObjectId,
      ref: 'category'
    },
isDeleted: {
      type: Boolean,
      default: false,
    },
    reviews: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: {
          type: Number,
          required: true,
        },
        reviewText: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

}); 

const ProductModel = mongoose.model('Products', productSchema);

module.exports = ProductModel;