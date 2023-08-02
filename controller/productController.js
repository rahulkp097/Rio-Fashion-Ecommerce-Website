const Category = require("../model/category");
const ProductModel = require("../model/product");
const mongoose=require("mongoose")
const session=require("express-session")
const orderModel=require("../model/order")
const userModel=require("../model/user")
const bannerModel=require("../model/banner")
 
const applyCategoryOffers = (products, categoryOffers) => {
  // Create a copy of products to hold the updated product data
  const updatedProducts = products.map(product => ({
    ...product.toObject(), // Convert Mongoose document to a plain JavaScript object
  }));

  // Apply category offers to product prices in the updatedProducts array
  for (const updatedProduct of updatedProducts) {
    const category = categoryOffers.find(category => category._id.toString() === updatedProduct.category.toString());

    if (category && category.offer.isOfferAvailable) {
      updatedProduct.sellingprice = updatedProduct.sellingprice - (updatedProduct.sellingprice * category.offer.discountPercentage / 100);
      updatedProduct.offerprice = updatedProduct.offerprice - (updatedProduct.offerprice * category.offer.discountPercentage / 100);
    }
  }

  return updatedProducts;
};

const addproduct = async (req, res) => {
  try {
    const { sellingprice, offerprice, description, title, quantity,size, brand, category, isOfferAvailable, discountPercentage, offerDescription, startDate, endDate } = req.body;

 

    const images = req.files.map((file) => file.filename);
   

    const newProduct = new ProductModel({
      sellingprice,
      offerprice,
      description,
      title,
      size,
      quantity,
      image: images,
      brand,
      category,
      offer: {
        isOfferAvailable,
        discountPercentage,
        offerDescription,
        startDate,
        endDate,
      },
    });

    let existingProduct = await ProductModel.findOne({ title: title });
    console.log(existingProduct);

    if (existingProduct) {
      const Products = await ProductModel.find();
      const categories = await Category.find();
      return res.render("admin/product", { message: "Product already exists", Products, categories, currentPage: req.path });
    }

    await newProduct.save();
    res.redirect('/admin/product');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

const editproduct= async(req,res,next)=>{
 
  const product=await ProductModel.findById(req.params.id)
  const categories= await Category.find()
  res.render("admin/editproduct",{product,categories,currentPage: "/products"})
  
}
const updateproduct = async (req, res) => {
  try {
    const { sellingprice, offerprice, size, description, title, quantity, brand, category } = req.body;
    const productId = req.body.productId;

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      {
        sellingprice,
        offerprice,
        size,
        description,
        title,
        quantity,
        brand,
        category,
      },
      { new: true } 
    );

    if (!updatedProduct) {
     
      return res.status(404).send('Product not found');
    }

    if (req.files && req.files.length > 0) {
      const images = req.files.map((file) => file.filename);
      updatedProduct.image = images;
      await updatedProduct.save();
    }

    console.log('Product updated successfully');
    res.redirect('/admin/product');
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('An error occurred while updating the product.');
  }
};



  const unlistporduct= async (req,res)=>{
    let id=req.params.id
    console.log(id)
    try{
      let product= await ProductModel.findById(id)
      console.log(product)
    
      product.isDeleted=!product.isDeleted;
      await product.save()
      res.redirect("/admin/product")
    }catch(err){
      console.log(err)
    }
  }


  
  const getproduct = async (req, res) => {
    try {
      const products = await ProductModel.find();
      console.log(products);
      const categories = await Category.find();
      const activeCategoryOffers = categories.filter(category => !category.isDeleted && category.offer.isOfferAvailable);
      const updatedProducts = activeCategoryOffers.length > 0 ? applyCategoryOffers(products, activeCategoryOffers) : products;
      res.render('admin/product', { Products: activeCategoryOffers.length > 0 ? updatedProducts : products, categories, currentPage: req.path });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
  };
  
  
  const UserViewproduct=async(req,res)=>{
    const id=req.params.id
    try{
      const product = await ProductModel.findById(id).populate('category').populate('reviews.user');;
      const products = await ProductModel.find({ isDeleted: false });
      const categoryName = product.category.name;
      console.log('CategoryName:', categoryName);
      const userLogin = req.session.userLogin;
      let user=req.session.user
      let name=req.session.username

     if (product.category && product.category.offer && product.category.offer.isOfferAvailable) {
  const discountPercentage = product.category.offer.discountPercentage;
  const discountAmount = product.sellingprice * (discountPercentage / 100);
  product.sellingprice = (product.sellingprice - discountAmount).toFixed(2);

  // Assuming product.offerprice is a separate property from sellingprice
  const offerDiscountAmount = product.offerprice * (discountPercentage / 100);
  product.offerprice = (product.offerprice - offerDiscountAmount).toFixed(2);
}

  
     if(req.session.userLogin){
      let name=req.session.username
      res.render("user/product",{product,user,name,products,userLogin,categoryName})
    }
      res.render("user/product",{product,user,name,products,userLogin,categoryName})
      
    }

    catch(err){
      console.log(err)
    }
}



const  productSearch = async (req, res) => {
  try {
    const productName = req.body.productName || '';
    
    const searchResults = await ProductModel.find({ title: { $regex: productName, $options: 'i' }, isDeleted: false });
    const userLogin = req.session.userLogin;
    const categories = await Category.find({ isDeleted: false });
    const products = await ProductModel.find({ isDeleted: false });
    const totalProducts = products.length;
    const perPage=products.length;
    const totalPages = Math.ceil(totalProducts / perPage);
    const activeCategoryOffers = await Category.find({ isDeleted: false, 'offer.isOfferAvailable': true });
    console.log("active",activeCategoryOffers)
    const updatedProducts = activeCategoryOffers.length > 0 ? applyCategoryOffers(products, activeCategoryOffers) : products;
    const banners=await bannerModel.find()
    res.render('user/home', { banners,products: activeCategoryOffers.length > 0 ? updatedProducts : products,
      page:1,selectedCategoryId:null,totalPages,perPage, searchResults, userLogin, user: req.session.user, name: req.session.username, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
}


const filterProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const categories = await Category.find({ isDeleted: false });
    const products = await ProductModel.find({
      category: categoryId,
      isDeleted: false,
    });
    const totalProducts = products.length;
    const perPage=6
    const totalPages = Math.ceil(totalProducts / perPage);
    const banners=await bannerModel.find()
    res.render('user/home', {
      banners,
      page:1,
      perPage,
      totalPages,
      userLogin: req.session.userLogin,
      user: req.session.user,
      name: req.session.username,
      categories,
      products,
      searchResults:null,
      selectedCategoryId: categoryId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

const returnOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel.findById(orderId).populate('user');

    // Check if the order status is 'Delivered'
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Product can only be returned for orders with status "Delivered"' });
    }

    const currentDate = new Date();
    const orderDate = order.createdAt;

    // Calculate the difference in days between the current date and the order date
    const timeDifference = currentDate - orderDate;
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    // Check if the product can be returned within 15 days of the order date
    if (daysDifference > 15) {
      return res.status(400).json({ message: 'Product can only be returned within 15 days of purchase' });
    }

    // Set the order status to 'Return Requested'
    order.status = 'Return Requested';
    await order.save();

    return res.status(200).json({ message: 'Return request submitted successfully, waiting for admin approval' });
  } catch (error) {
    console.error('Error handling product return:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



const removeProductImage=async(req,res)=>{
  try{
    console.log(req.body)
    const productId=req.body.id;
    const position=req.body.position;
    const product=await ProductModel.findById(productId)
    const image=product.image[position]

    await ProductModel.updateOne(
       { _id:productId},
       {$pull:{image:image}}

    ).then((resoponse)=>{
        console.log("response from database",resoponse)
    })
    res.json({remove:true})
}
catch(error)
{
   
    console.log(error)
    }

}

module.exports={
    addproduct,
    unlistporduct,
    updateproduct,
    getproduct,
    UserViewproduct,
    editproduct,
    productSearch,
    filterProductsByCategory,
    returnOrder,
    removeProductImage
}