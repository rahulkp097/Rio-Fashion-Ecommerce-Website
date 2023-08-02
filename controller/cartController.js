const productModel = require("../model/product");
const categoryModel = require("../model/category");
const userList = require("../model/user");

const calculateOfferPrice = (product) => {
  if (product.category && product.category.offer && product.category.offer.isOfferAvailable) {
    const discountPercentage = product.category.offer.discountPercentage;
    const originalPrice = product.offerprice;
    return originalPrice - (originalPrice * (discountPercentage / 100));
  } else {
    return product.offerprice;
  }
};


const addtocart = async (req, res) => {
  try {
    if (!req.session.userLogin) {
      return res.render("user/login", { message: "You have to login first",userLogin :req.session.userLogin,user:req.session.user, name:req.session.username });
    }

    const productId = req.params.id;
    let  quantity = parseInt(req.body.quantity);
   
    if (isNaN(quantity)) {
      quantity = 1;
    }
    const size=req.body.size
    
    const product = await productModel.findById(productId);

    const userId = req.session.userId;
    const user = await userList.findById(userId);
    
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      const updatedQuantity = existingCartItem.quantity + quantity;
      if (updatedQuantity > product.quantity) {
        existingCartItem.quantity = product.quantity;
      } else {
        existingCartItem.quantity += quantity;
      }
      await user.save();
    } else {
      const cartItem = {
        product: productId,
        quantity: Math.min(quantity, product.quantity), 
        size:size
      };
      user.cart.push(cartItem);
      await user.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const addtocartFromwishlist = async (req, res) => {
  try {
    if (!req.session.userLogin) {
      return res.render("user/login", { message: "You have to login first",userLogin :req.session.userLogin,user:req.session.user, name:req.session.username });
    }

    const productId = req.params.id;
    let  quantity = parseInt(req.body.quantity);
   
    if (isNaN(quantity)) {
      quantity = 1;
    }
    const size=req.query.size
    
    const product = await productModel.findById(productId);

    const userId = req.session.userId;
    const user = await userList.findById(userId);
    
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      const updatedQuantity = existingCartItem.quantity + quantity;
      if (updatedQuantity > product.quantity) {
        existingCartItem.quantity = product.quantity;
      } else {
        existingCartItem.quantity += quantity;
      }
      await user.save();
    } else {
      const cartItem = {
        product: productId,
        quantity: Math.min(quantity, product.quantity), 
        size:size
      };
      user.cart.push(cartItem);
      await user.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



const getCart = async (req, res) => {
  try {
    const userLogin = req.session.userLogin;
    if (!userLogin) {
      return res.render("user/login", { message: "You have to login first", userLogin: req.session.userLogin, user: req.session.user, name: req.session.username });
    }

    const categories = await categoryModel.find({ isDeleted: false });
    const products = await productModel.find({ isDeleted: false });

    const userId = req.session.userId;
    const user = await userList.findById(userId).populate({
      path: 'cart.product',
      populate: {
        path: 'category',
        model: 'category',
      },
    });

    const cartItems = user.cart.map((item) => {
      const size=item.size
      const product = item.product;
      const quantity = item.quantity;
      const offerprice = calculateOfferPrice(product);

      
      return { product, quantity, offerprice,size };
    });
   

    res.render("user/cart", {
      userLogin,
      user: req.session.user,
      name: req.session.username,
      categories,
      products,
      cartItems,
    });
  } catch (error) {
    console.log(error.message);
  }
};


const deletecart = async (req, res) => {
  const userId = req.session.userId;
  const productId = req.params.id;

  try {
    const user = await userList
      .findById(userId)
      .populate("cart.product");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

  
    const cartItemIndex = user.cart.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({ message: "Product not found in the cart" });
    }

    user.cart.splice(cartItemIndex, 1);
    await user.save();

    res.redirect("/cart");
  } catch (error) {
    console.error("Error deleting product from the cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const quantityupdate = async (req, res) => {
  const productId = req.body.product;
  const quantity = parseInt(req.body.quantity);
  
  try {
    if (req.session.userLogin) {
      const userId = req.session.user;
      const user = await userList.findById(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const cartItem = user.cart.find(
        (item) => item.product.toString() === productId
      );
      

      if (cartItem) {
      
        const product = await productModel.findById(productId).populate("category");
        if (quantity > product.quantity) {
          return res.status(400).json({ success: false, message: "Insufficient product quantity" });
        }

      

        cartItem.quantity = quantity;
        await user.save();
        let price=(product.offerprice-(product.offerprice*product.category.offer.discountPercentage)/100)
        
        res.status(200).json({ success: true, message: "Quantity updated successfully", price });
      } else {
        res.status(404).json({ success: false, message: "Item not found in cart" });
      }
    } 
  } catch (error) {
    console.error("Failed to update quantity:", error);
    res.status(500).json({ success: false, message: "Failed to update quantity" });
  }
};









module.exports = {
  addtocart,
  getCart,
  deletecart,
  quantityupdate,
  addtocartFromwishlist
 
  
};
