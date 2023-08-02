var express = require('express');
var userRouter = express.Router();
const userController=require("../controller/userController")
const session=require("../middleware/userSession")
const productController=require("../controller/productController")
const cartController=require("../controller/cartController")
const checkoutController=require("../controller/checkoutController")
const profileController=require("../controller/profileController")
const couponController=require("../controller/couponController")
/* GET users listing. */
userRouter.get("/",session.userloggedoff,userController.home)
userRouter.get("/login",session.userloggedoff,userController.userLogin)
userRouter.get("/register",userController.userRegister)
userRouter.post("/register",userController.createuser)
userRouter.post("/",userController.login)
userRouter.get("/home",session.userloggedin,userController.home)
userRouter.post("/sendOtp",userController.sentOtp)
userRouter.get("/sendOtp",session.userloggedin,userController.home)
userRouter.post("/verify-otp",userController.verifyOtp)
userRouter.get("/userLogout",userController.userLogout)
userRouter.get("/viewproduct/:id",productController.UserViewproduct)
userRouter.get("/cart",cartController.getCart)
userRouter.post("/addtocart/:id",cartController.addtocart)
userRouter.get("/addtocart/:id",cartController.addtocartFromwishlist)
userRouter.get("/deletecart/:id",session.userloggedin,cartController.deletecart)
userRouter.get("/profile",session.userloggedin,userController.userprofile)
userRouter.get("/wishlist",userController.getwishlist)
userRouter.post("/addtowishlist/:id",userController.addtowishlist)
userRouter.get("/wishlist/remove/:id",userController.removewishlist)
userRouter.post('/quantityupdate',cartController.quantityupdate)
userRouter.get('/checkout',session.userloggedin,checkoutController.getcheckout)
userRouter.post('/addaddress',session.userloggedin,checkoutController.addaddress)
userRouter.post('/submit-order',session.userloggedin,checkoutController.submitorder)
userRouter.get("/success",session.userloggedin,checkoutController.successpage)
userRouter.post("/profile/updatepassword",session.userloggedin,profileController.updatepassword)
userRouter.post("/search",productController.productSearch)
userRouter.get("/categoryFilter/:categoryId" ,productController.filterProductsByCategory )
userRouter.get("/forgotpassword" ,userController.forgotpassword )
userRouter.post('/forgotpassword/sendotp' ,userController.forgotpasswordOtp)
userRouter.get("/products/page" ,userController.userProductPages )
userRouter.post('/orders/cancelorder',profileController.cancelUserOrder )
userRouter.post("/applyCoupon", couponController.applycoupon);
userRouter.get("/download-order/:id", profileController.downloadOrder);
userRouter.post('/submit-review',checkoutController.addReview)
userRouter.get('/return-order/:id', productController.returnOrder);



module.exports = userRouter
