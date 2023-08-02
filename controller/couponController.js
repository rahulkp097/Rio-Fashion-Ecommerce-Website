const couponModel = require("../model/coupon")
const userModel=require("../model/user")


const coupon=async(req,res)=>{

    const coupons=await couponModel.find()


    res.render("admin/coupon",{currentPage: req.path,coupons})
  }



  const addCoupon = async (req, res) => {
    try {
      const { couponCode, discountPercentage, description, startDate, endDate } = req.body;
  
      // Create a new instance of the coupon model with the data from the request body
      const newCoupon = new couponModel({
        code:couponCode,
        discountPercentage,
        description,
        startDate,
        endDate,
      });
  
      // Save the new coupon to the database
      await newCoupon.save();
  
      // Fetch all coupons from the database to render the updated list
     res.redirect("/admin/coupon")
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error saving coupon" });
    }
  };
  


  const updateCoupon = async (req, res) => {
    try {
      const { couponCode, discountPercentage, description, startDate, endDate } = req.body;
      const couponId = req.params.id; // Get the coupon ID from the request params
        
      // Find the coupon in the database by its ID
      const coupon = await couponModel.findById(couponId);
  
      // Update the coupon details
      coupon.code = couponCode;
      coupon.discountPercentage = discountPercentage;
      coupon.description = description;
      coupon.startDate = startDate;
      coupon.endDate = endDate;
  
      
      await coupon.save();
  
      
      res.redirect("/admin/coupon");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating coupon" });
    }
  };



  const applycoupon = async (req, res, next) => {
    try {
      const enteredCouponCode = req.body.couponCode;
  
      console.log("couponCode", enteredCouponCode);
  
      const dbCoupon = await couponModel.findOne({ code: enteredCouponCode });
        const user=await userModel.findById(req.session.userId)
      console.log("dbCoupon", dbCoupon);
  
      if (!dbCoupon) {
        console.log("Coupon not found");
        return res.json({ success: false, message: "Invalid coupon code. Please try again." });
      }

      if (user.usedCoupons.includes(dbCoupon._id)) {
        console.log("Coupon has already been used.");
        return res.json({ success: false, message: "Coupon has already been used." });
      }



      const now =new Date()
      
      if (now > dbCoupon.endDate) {
        return res.json({ success: false, message: 'Coupon has expired.' });
      }
      let totalAmount = req.body.totalAmount // Replace this with the actual total amount from your code
  
    
      const discountPercentage = dbCoupon.discountPercentage;
      const discountAmount = (totalAmount * discountPercentage) / 100;
      const discountedTotal = totalAmount - discountAmount;
  
      console.log("Discounted total:", discountedTotal);
  
      if (totalAmount < 1000) {
        console.log("Total amount should be at least 1000 to apply the coupon");
        return res.json({ success: false, message: "Total amount should be at least 1000 to apply the coupon" });
      }
      user.usedCoupons.push(dbCoupon._id);
    await user.save();
  
      return res.json({ success: true, discountedTotal,discountAmount });
  
    } catch (error) {
      console.error("Error applying coupon:", error);
      return res.json({ success: false, message: "An error occurred while applying the coupon. Please try again later." });
    }
  };

  
  
const deleteCoupon= async(req,res)=>{
  const couponId = req.params.id;

  try {
    // Find the banner by its ID and delete it
    const deletedCoupon = await couponModel.findByIdAndRemove(couponId);

    if (!deletedCoupon) {
      // Banner with the given ID was not found
      return res.status(404).send('Coupon not found');
    }

    
    res.redirect('/admin/coupon'); 
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).send('An error occurred while deleting the coupn.');
  }
}

  
  module.exports = {
    coupon,
    addCoupon,
    updateCoupon,
    applycoupon,
    deleteCoupon
  };
  

 