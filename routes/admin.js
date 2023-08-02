const express = require('express');
const adminRouter = express.Router();
const adminController = require('../controller/adminController');
const session = require('../middleware/adminSession');
const categoryController = require("../controller/categoryController");
const productController=require("../controller/productController")
const couponController=require("../controller/couponController")
const multerMiddleware=require("../middleware/multer")

/* GET home page. */
adminRouter.get('/', session.adminloggedoff, adminController.getlogin);
adminRouter.post('/', session.adminloggedoff, adminController.loginpost);
adminRouter.get('/home', session.adminloggedin, adminController.gethome);
adminRouter.get("/logout", adminController.adminLogOut);
adminRouter.get("/category", session.adminloggedin, categoryController.getAllCategories);
adminRouter.post("/addcategory",multerMiddleware.uploadSingle, session.adminloggedin, categoryController.createCategory);
adminRouter.get("/category/action/:id",session.adminloggedin,categoryController.unlistcategory)
adminRouter.post("/editCategory/:id",multerMiddleware.uploadSingle,session.adminloggedin,categoryController.editCategory)
adminRouter.get("/product",session.adminloggedin,productController.getproduct)
adminRouter.post("/addproduct",multerMiddleware.upload,session.adminloggedin,productController.addproduct)
adminRouter.get("/product/action/:id",session.adminloggedin,productController.unlistporduct)
adminRouter.get("/userlist",session.adminloggedin,adminController.userlist)
adminRouter.get("/user/action/:id",session.adminloggedin,adminController.userunlist)
adminRouter.get("/product/editproduct/:id",multerMiddleware.upload,session.adminloggedin,productController.editproduct)
adminRouter.post("/product/updateproduct",multerMiddleware.upload,session.adminloggedin,productController.updateproduct)
adminRouter.get("/order",session.adminloggedin,adminController.orderList)
adminRouter.post("/updateOrderStatus/:id",adminController.updateOrderStatus)
adminRouter.post('/sort_sales_data',adminController.sortSalesData)
adminRouter.get('/coupon',session.adminloggedin,couponController.coupon)
adminRouter.post('/addcoupon',session.adminloggedin,couponController.addCoupon)
adminRouter.post('/editcoupon/:id',session.adminloggedin,couponController.updateCoupon)
adminRouter.get('/getOrderDetailsData',session.adminloggedin,adminController.getOrderDetailsData)
adminRouter.get('/downloadReportsPdf',session.adminloggedin,adminController.downloadReport)
adminRouter.post('/product/removeProductImage',session.adminloggedin,productController.removeProductImage)
adminRouter.get("/banner",session.adminloggedin,adminController.getBanner)
adminRouter.post("/addbanner", session.adminloggedin, multerMiddleware.uploadSingle, adminController.addbanner);
adminRouter.get("/banner/delete/:id",session.adminloggedin,adminController.deleteBanner)
adminRouter.post("/editbanner/:id",session.adminloggedin,multerMiddleware.uploadSingle,adminController.editbanner)
adminRouter.post("/banner/removeBannerImage",session.adminloggedin,adminController.removeBannerImage)
adminRouter.get("/coupon/deleteCoupon/:id",session.adminloggedin,couponController.deleteCoupon)
adminRouter.post("/confirm-return/:id",session.adminloggedin,adminController.confirmReturn)


module.exports = adminRouter;


