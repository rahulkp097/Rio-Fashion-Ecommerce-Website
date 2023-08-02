const mongoose = require('mongoose');


const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  image: {
    type: String,
  },
  startDate: {
    type: Date,
    default:Date.now,
  },
 
  isExpired: {
    type: Boolean,
    default: false,
  },
});

const Banner = mongoose.model('banner', bannerSchema);

module.exports = Banner;
