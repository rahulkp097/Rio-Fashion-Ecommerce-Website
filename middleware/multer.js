const multer=require("multer")
const Jimp = require('jimp');

const storageCategory = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/images/");
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}.${file.originalname}`);
    },
  });
  
  const uploadSingle = multer({
    storage: storageCategory,
  }).single("image");

  const storageProducts = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/images/");
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}.${file.originalname}`);
    },
  });

 
  
  const upload = multer({
    storage: storageProducts,
  }).array('image[]',7);


  module.exports={
    upload,
    uploadSingle,
  
  }