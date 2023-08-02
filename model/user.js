const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  number: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  
 
  cart:[{
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Products",
    },
    quantity:{
        type:Number,
        default:1
    },
    size:{
      type: String}
  }],
  wishlist:[{
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Products",
    },
   
    size:{
      type: String}
  }],

  address: [
    {
      name: String,
      houseNumber:String,
      city: String,
      state: String,
      pin: Number,
      phone: Number,
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
  wallet: {
    type: Number,
    default: 0,
  },
  usedCoupons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
    },
  ],
  referralCode:{
      type: String,
      unique: true,
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
