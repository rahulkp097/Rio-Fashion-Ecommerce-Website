const session = require("express-session")
const User=require("../model/user");
const categorymodal=require("../model/category")
const productmodal=require("../model/product")
const orderModel=require("../model/order")
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const bannerModel=require("../model/banner")
require('dotenv').config()

const accountSid = process.env.twilioaAccountSid
const authToken = process.env.twilioAuthToken
const client = require('twilio')(accountSid, authToken);


const applyCategoryOffers = (products, categoryOffers) => {
 
  const updatedProducts = products.map(product => ({
    ...product.toObject(),
  }));

  
  for (const updatedProduct of updatedProducts) {
    const category = categoryOffers.find(category => category._id.toString() === updatedProduct.category.toString());

    if (category && category.offer.isOfferAvailable) {
      const discountPercentage = category.offer.discountPercentage;
      const discountAmount = updatedProduct.sellingprice * (discountPercentage / 100);
      updatedProduct.sellingprice -= discountAmount;

   
      const offerDiscountAmount = updatedProduct.offerprice * (discountPercentage / 100);
      updatedProduct.offerprice -= offerDiscountAmount;

     
      updatedProduct.sellingprice = updatedProduct.sellingprice.toFixed(2);
      updatedProduct.offerprice = updatedProduct.offerprice.toFixed(2);
    }
  }

  return updatedProducts;
};



function generateUniqueReferralCode() {
  
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const codeLength = 6;
  let referralCode = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
}



const forgotpassword=(req,res)=>{
  res.render("user/resetPassword")
}

const forgotpasswordOtp = async (req, res) => {
  console.log(req.body)
  const email = req.body.email; 
  const user = await User.findOne({ email });
  console.log(user);
  if (!user) {
  
    return res.render('user/resetPassword', { message: 'User does not exist' });
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.nodeMailerUserName,
      pass: process.env.nodeMailerPassword
    },
  });

  const userName = user.email;
  const password = user.password
  const mailOptions = {
    from: 'riofashionstoreeco@gmail.com',
    to: email,
    subject: 'Password Reset Request',
    text: `Hi, ${user.username}, We have received your forgot password request. Here are your login details:\n\nUsername: ${userName}\nPassword(encrypted): ${password}\n please Login Link: http://localhost:3000/login`, // Replace "http://yourdomain.com/login" with the actual login URL
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
       res.render('user/resetPassword', { message: ' something went wrong please try again' });
     
    } else {
       res.render('user/resetPassword', { message: 'The username and password send to your Maild id ' });
     
    }
  });
};






const userLogin=(req,res)=>{
    res.render("user/login",{userLogin :req.session.userLogin,user:req.session.user, name:req.session.username})
}

const userRegister=(req,res)=>{
    res.render("user/register")
}


const createuser = async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;
    let number = "91" + req.body.number;
    let existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.render("user/register", { message: "User already exists" });
    }

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode });
      if (!referredByUser) {
        return res.render("user/register", {
          message: "Invalid referral code",
        });
      }
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10); // You can adjust the number of salt rounds (10 in this example)

    const user = new User({
      username,
      email,
      number,
      password: hashedPassword, // Save the hashed password
    });

    if (referredByUser) {
      referredByUser.wallet += 50;
      await referredByUser.save();
    }

    await user.save();
    let message = "New user created";

    res.render("user/login", {
      message: message,
      userLogin: req.session.userLogin,
      user: req.session.user,
      name: req.session.username,
    });
  } catch (err) {
    console.log(err);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  

  try {
    const categories=await categorymodal.find({isDeleted:false})
    const products=await productmodal.find({isDeleted:false})
    
    
    const user = await User.findOne({ email });
    console.log("user",user)
     if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render("user/login", { message: "Invalid email or password", userLogin: req.session.userLogin, user: req.session.user, name: req.session.username });
    }
    if(user.isDeleted){
      return res.render("user/login", { message: "You have been bloked by admin",userLogin :req.session.userLogin,user:req.session.user, name:req.session.username });
    }

    const activeCategoryOffers = await categorymodal.find({ isDeleted: false, 'offer.isOfferAvailable': true });

    const updatedProducts = activeCategoryOffers.length > 0 ? applyCategoryOffers(products, activeCategoryOffers) : products;

    req.session.userLogin = true;
    const userLogin = req.session.userLogin;
    const name = user.username;
    req.session.userId=user._id
    req.session.username=name
    req.session.user=user
    req.session.email=user.email
    req.session.phoneNumber=user.number

    if (!user.referralCode) {
      user.referralCode = generateUniqueReferralCode();
      await user.save();
    }

    const perPage = parseInt(req.query.perPage) || 6;

    

    // Calculate the total number of pages
    const totalPages = Math.ceil(products / perPage);
    const banners=await bannerModel.find()


    res.render("user/home", {page:1,selectedCategoryId:null,perPage,totalPages,
      banners,
      searchResults:null, 
      userLogin,user, name,categories, 
      products: activeCategoryOffers.length > 0 ? updatedProducts : products, });
  } catch (err) {
    console.log(err);
    res.render("user/login", { message: "An error occurred, please try again",userLogin :req.session.userLogin,user:req.session.user, name:req.session.username });
  }
};

const home = async (req, res) => {
  try {
    const userLogin = req.session.userLogin;
    const categories = await categorymodal.find({ isDeleted: false });

    const perPage = parseInt(req.query.perPage) || 6;

    // Count the total number of products
    const totalProducts = await productmodal.countDocuments({ isDeleted: false });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalProducts / perPage);

    // Get the current page from the query parameters, default to 1 if not provided or invalid
    let page = parseInt(req.query.page);
    if (isNaN(page) || page < 1 || page > totalPages) {
      page = 1;
    }

    // Calculate the number of products to skip
    const skip = (page - 1) * perPage;

    // Fetch the products for the current page
    const products = await productmodal
      .find({ isDeleted: false })
      .skip(skip)
      .limit(perPage);

    const activeCategoryOffers = await categorymodal.find({ isDeleted: false, 'offer.isOfferAvailable': true });

    const updatedProducts = activeCategoryOffers.length > 0 ? applyCategoryOffers(products, activeCategoryOffers) : products;
    const banners=await bannerModel.find()
    res.render('user/home', {
      banners,
      page,
      perPage,
      totalPages, // Pass perPage to the view to use it for display or pagination
      selectedCategoryId: null,
      searchResults: null,
      userLogin,
      user: req.session.user,
      name: req.session.username,
      categories,
      products: activeCategoryOffers.length > 0 ? updatedProducts : products,
    });
  } catch (error) {
    console.log(error.message);
  }
};




const singnWithOtp=(req,res)=>{
  try {
    res.render('user/otplogin',);
  } catch (error) {
    console.log(error.message);
  }
}

const sentOtp = (req, res) => {
  const phoneNumber = req.body.number;
  req.session.phoneNumber=phoneNumber
  console.log(phoneNumber); 
  const otp = generateOTP();
  
  req.session.otp = otp;

  console.log("your OTP is ",req.session.otp)

  res.render('user/otplogin',{userLogin :req.session.userLogin,user:req.session.user, name:req.session.username});
  client.messages
    .create({
      body: `Your OTP is: ${otp}`, 
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${phoneNumber}`
    })
    .then(message => {
      console.log('OTP sent successfully:', message.sid);
      res.render('user/otplogin',{userLogin :req.session.userLogin,user:req.session.user, name:req.session.username});
    })
    .catch(err => {
      console.error('Error sending OTP:', err);
      res.redirect('/login');
    });
};


const verifyOtp = async(req, res) => {

const name=await User.find({number:req.session.phoneNumber})
if(name.isDeleted){
  return res.render("user/login", { message: "You have been bloked by admin",userLogin :req.session.userLogin,user:req.session.user, name:req.session.username });
}
  const userEnteredOtp = req.body.otp;
  const otp = req.session.otp; 
  console.log(userEnteredOtp)
  if (userEnteredOtp === otp) {
 
    const categories=await categorymodal.find()

    const products=await productmodal.find()

    req.session.userLogin = true;
    const userLogin = req.session.userLogin;
    
    const username = name[0].username;
    req.session.userId=name[0]._id
    const user=await User.findById(req.session.userId)
    req.session.username=username
    req.session.user=name
    req.session.email=user.email
    req.session.phoneNumber=user.number

    const activeCategoryOffers = await categorymodal.find({ isDeleted: false, 'offer.isOfferAvailable': true });

    const updatedProducts = activeCategoryOffers.length > 0 ? applyCategoryOffers(products, activeCategoryOffers) : products;
    let page = parseInt(req.query.page);
    const totalProducts = products.length;
    const perPage=products.length;
    const totalPages = Math.ceil(totalProducts / perPage);
    const banners=await bannerModel.find()
    res.render('user/home', {selectedCategoryId:null,searchResults:null, userLogin ,user,name:username,categories,perPage,totalPages,page,banners,
      products: activeCategoryOffers.length > 0 ? updatedProducts : products,
     });
  } else {
    res.render('user/otplogin');
  }
};







function generateOTP() {
  const otpLength = 6;
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < otpLength; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}


const userLogout=(req,res)=>{
 
req.session.destroy()
  res.redirect("/login")


}


const userprofile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
    const orders = await orderModel.find({ user: req.session.userId }).populate('items.product');

    res.render("user/profile", {
      userLogin: req.session.userLogin,
      name: user.username,
      user: user,
      addresses: user.address,
      orders: orders,
      messages: "",
      wallet:user.wallet
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



const getwishlist=async(req,res)=>{
  try {
    const userLogin = req.session.userLogin;
    if (!userLogin) {
      return res.render("user/login", { message: "You have to login first",userLogin :req.session.userLogin,user:req.session.user, name:req.session.username });
    }

    const categories = await categorymodal.find({ isDeleted: false });
    const products = await productmodal.find({ isDeleted: false });

    const userId = req.session.userId;
    const user = await User
      .findById(userId)
      .populate("wishlist.product");

    const wishlistitems = user.wishlist.map((item) => ({
      product: item.product,
      size:item.size,
    }));

    const activeCategoryOffers = await categorymodal.find({ isDeleted: false, 'offer.isOfferAvailable': true });

    const updatedProducts = activeCategoryOffers.length > 0 ? applyCategoryOffers(products, activeCategoryOffers) : products;

    res.render("user/wishlist", {
      userLogin,
      user: req.session.user,
      name: req.session.username,
      categories,
      products: activeCategoryOffers.length > 0 ? updatedProducts : products,
      wishlistitems,
    });
  } catch (error) {
    console.log(error.message);
  }
};


const addtowishlist = async (req, res) => {
  if (!req.session.userLogin) {
    return res.render("user/login", { message: "You have to login first", userLogin: req.session.userLogin, user: req.session.user, name: req.session.username });
  }
  try {
    

    const productId = req.params.id;
    const selectedSize = req.body.size; // Extract the selected size from the request body
    
    const product = await productmodal.findById(productId);
    const userId = req.session.userId;
    const user = await User.findById(userId);

    // Check if the product already exists in the wishlist
    const isProductInWishlist = user.wishlist.some((item) => item.product.toString() === productId);

    if (isProductInWishlist) {
      return res.status(200).json({ message: 'Product already exists in the wishlist' });
    }

    const wishlist = {
      product: productId,
      size: selectedSize // Add the selected size to the wishlist item
    };

    user.wishlist.push(wishlist);
    await user.save();

    return res.status(200).json({ message: 'Product added to wishlist successfully' });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

  const removewishlist = async(req, res) => {
    const productId = req.params.id;
  
    // Remove the product from the wishlist
      const user=await User.findById(req.session.userId)
  
      // Find the index of the product in the wishlist array
      const index =await user.wishlist.findIndex(
        (item) => item.product.toString() === productId
      );
  
     
      user.wishlist.splice(index, 1);
  
      // Save the updated user object
      user.save()
        console.log("Product removed from the wishlist");
        return res.redirect("/wishlist");
      }
  
      const userProductPages = async (req, res) => {
        try {
          const page = parseInt(req.query.page) || 1; // Get the current page from the query parameters
          const perPage = 6; // Number of products per page, default to 6
          const skip = (page - 1) * perPage; // Calculate the number of products to skip
      
          const categories = await categorymodal.find({ isDeleted: false });
      
          const products = await productmodal.find({ isDeleted: false });
      
          const totalProducts = products.length;
          const totalPages = Math.ceil(totalProducts / perPage);
      
          const paginatedProducts = await productmodal
            .find({ isDeleted: false })
            .skip(skip)
            .limit(perPage);
      
          const activeCategoryOffers = await categorymodal.find({ isDeleted: false, 'offer.isOfferAvailable': true });
          const updatedProducts = activeCategoryOffers.length > 0 ? applyCategoryOffers(paginatedProducts, activeCategoryOffers) : paginatedProducts;
          const banners=await bannerModel.find()
          console.log(banners)
          res.render('user/home', {
            banners,
            page,
            perPage,
            totalPages, // Pass the totalPages variable to the EJS template
            products: activeCategoryOffers.length > 0 ? updatedProducts : paginatedProducts,
            selectedCategoryId: null,
            searchResults: null,
            userLogin,
            user: req.session.user,
            name: req.session.username,
            categories,
          });
          
        } catch (err) {
          console.error('Error fetching products:', err);
          res.status(500).json({ message: 'Failed to fetch products' });
        }
      };
      
      





module.exports={
    userLogin,
    userRegister,
    createuser,
    login,
    home,
    singnWithOtp,
    sentOtp,
    verifyOtp,
    userLogout,
    userprofile,
    getwishlist,
    forgotpassword,
    userProductPages,
    forgotpasswordOtp,
    addtowishlist,
    removewishlist
    
}