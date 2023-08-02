const productModel = require("../model/product");
const categoryModel = require("../model/category");
const userList = require("../model/user");
const orderModel=require("../model/order")
const Razorpay = require('razorpay');
require('dotenv').config()


const razorpay = new Razorpay({
  key_id: process.env.razorpaykey_id,
  key_secret: process.env.razorpaykey_secret
});

const calculateOfferPrice = (product) => {
  if (product.category && product.category.offer && product.category.offer.isOfferAvailable) {
    const discountPercentage = product.category.offer.discountPercentage;
    const originalPrice = product.offerprice;
    return originalPrice - (originalPrice * (discountPercentage / 100));
  } else {
    return product.offerprice;
  }
};
const getcheckout = async (req, res) => {
  try {
    const categories = await categoryModel.find({ isDeleted: false });
    const products = await productModel.find({ isDeleted: false });

    const user = await userList.findById(req.session.userId).populate({
      path: 'cart.product',
      populate: {
        path: 'category',
        model: 'category',
      },
    });

    const addresses = user.address;
    const cartItems = user.cart
      .filter((item) => item.product.quantity > 0)
      .map((item) => {
        const product = item.product;
        const quantity = item.quantity;
        const offerprice = calculateOfferPrice(product);

        return { product, quantity, offerprice };
      });

    if (cartItems.length === 0) {
      const message = "Cart is empty";
      return res.json({ message });
    }

    res.render("user/checkout", {
      userLogin: req.session.userLogin,
      user: req.session.user,
      name: req.session.username,
      categories,
      products,
      cartItems,
      addresses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

  

 

  const addaddress = async (req, res) => {
    try {
      const { name, houseNumber, state, city, pin, number } = req.body;
      
      const user = await userList.findById(req.session.userId);
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const newAddress = {
        name: name,
        houseNumber: houseNumber,
        city: city,
        state: state,
        pin: pin,
        phone: number,
        isDefault: false,
      };
  
      user.address.push(newAddress);

      await user.save();
  
     res.redirect("/checkout")
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  
  const successpage=async(req,res)=>{
    const orderId = req.query.orderId;
    const user= await userList.findById(req.session.userId)
    const order = await orderModel.findById(orderId).populate('items.product');


   console.log("orders",order)
    
    
    res.render("user/success",{userLogin :req.session.userLogin,user:req.session.user, name:req.session.username,order})
  }





  
  const submitorder = async (req, res, next) => {
    req.session.cartTotal = req.body.totalAmount;
  
    const { addressId, paymentMethod, totalAmount, subTotal, discount, products,couponDiscount } = req.body;
   
  
    try {
      const user = await userList.findById(req.session.userId);
      const address = user.address.find((item) => item._id.toString() === addressId);
  
      const parsedSubTotal = parseFloat(subTotal.replace('Rs ', ''));
      const parsedDiscount = parseFloat(discount.replace('Rs ', ''));
      const parsedTotal = parseFloat(totalAmount.replace('Rs ', ''));
      const parsedCouponDiscount = parseFloat(couponDiscount.replace('Rs ', ''));
    
      if (paymentMethod === 'cod') {
        const orderItems = products.map(async (product) => {
          await productModel.findByIdAndUpdate(product._id, { $inc: { quantity: -product.quantity } });
  
          return {
            product: product._id,
            quantity: product.quantity
          };
        });
  
        const order = new orderModel({
          user: user._id,
          items: await Promise.all(orderItems),
          subtotal: parsedSubTotal,
          discount: parsedDiscount,
          couponDiscount: parsedCouponDiscount,
          total: parsedTotal,
          paymentMethod: paymentMethod,
          shippingAddress: {
            name: address.name,
            houseNumber: address.houseNumber,
            city: address.city,
            state: address.state,
            pin: address.pin,
            phone: address.phone
          }
        });
  
        await order.save();
  
        user.cart = [];
        await user.save();
        const orderId = order._id;
        
        res.json({ success: true,orderId  });
      } else {
        // Razorpay payment method
        const orderOptions = {
          amount: Math.round(parsedTotal * 100), // Convert to an integer by rounding
          currency: 'INR',
          receipt: 'order_receipt', 
          payment_capture: 1 
        };
        
        console.log("orderOptions",orderOptions)
        

        // Create the order in Razorpay
        razorpay.orders.create(orderOptions, async (err, order) => {
          if (err) {
            console.error(err,"error message");
            res.json({ success: false });
            return;
          }
  
          const orderId = order.id;
  
          
          const orderItems = products.map(async (product) => {
            await productModel.findByIdAndUpdate(product._id, { $inc: { quantity: -product.quantity } });
  
            return {
              product: product._id,
              quantity: product.quantity
            };
          });
  
          const newOrder = new orderModel({
            user: user._id,
            items: await Promise.all(orderItems),
            subtotal: parsedSubTotal,
            discount: parsedDiscount,
            couponDiscount: parsedCouponDiscount,
            total: parsedTotal,
            paymentMethod: paymentMethod,
            shippingAddress: {
              name: address.name,
              houseNumber: address.houseNumber,
              city: address.city,
              state: address.state,
              pin: address.pin,
              phone: address.phone
            },
             // Store the Razorpay order ID
          });
         
  
          
          res.json({ success: true, orderId });
          await newOrder.save();
          user.cart = [];
          await user.save();
        });
      }
    } catch (error) {
      console.error(error);
  
      res.json({ success: false });
    }
  };



const addReview= async(req,res)=>{
  const { productId,reviewText } = req.body;

  try {
    // Find the product with the given productId
    const product = await productModel.findById(productId);

    const rating=5;
    
    // Create a new review object
    const review = {
      rating,
      reviewText,
      user: req.session.userId, // Assuming you have user authentication and the user ID is available in req.user._id
    };

    product.reviews.push(review);

    
    await product.save();

    return res.status(200).json({ message: 'Review added successfully!' });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
  
module.exports={
    getcheckout,
    addaddress,
    submitorder,
    successpage,
    addReview
    
 
}