const user = require("../model/user");
const  orderModel=require("../model/order")
const productModel=require("../model/product")
const PDFDocument = require('pdfkit');
const  bannerModel=require("../model/banner")
const cloudinary = require('cloudinary').v2;

require('dotenv').config()



const getlogin = (req, res) => {
    try {
      res.render('admin/login');
    } catch (err) {
      console.log(err);
    }
  };
  
  const loginpost = (req, res) => {
    
    try {
      if (req.body.username === process.env.adminUserName && req.body.password === process.env.adminPassword) {
        req.session.login = true;
        res.redirect('/admin/home');
      } else {
        res.render('admin/login', { error: 'Invalid username or password' });
      }
    } catch (err) {
      console.log(err);
    }
  };
  
  const gethome = async (req, res) => {
   
    try {
      // Get total sales
      const totalSalesData = await orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
          }
        }
      ]);
  
      const totalsales = totalSalesData[0].totalSales;
  
      // Get total orders
      const totalOrdersData = await orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
          }
        }
      ]);
  
      const totalorder = totalOrdersData[0].totalOrders;
  
      // Get average order value
      const averageOrderValueData = await orderModel.aggregate([
        {
          $group: {
            _id: null,
            averageOrderValue: { $avg: '$total' },
          }
        }
      ]);
  
      const average = averageOrderValueData[0].averageOrderValue;
  
      // Get total COD payments
      const codData = await orderModel.aggregate([
        {
          $group: {
            _id: null,
            cod: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, '$total', 0] } },
          }
        }
      ]);
  
      const cod = codData[0].cod;
  
      // Get total online payments
      const onlinePaymentData = await orderModel.aggregate([
        {
          $group: {
            _id: null,
            onlinePayment: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, '$total', 0] } },
          }
        }
      ]);


      let products = await productModel.find()
      const outOfStockProducts = await productModel.find({
        $expr: { $lte: ['$quantity', 0] }
      }).select('title quantity image');
  
      

      const topSellingProducts = await orderModel.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantitySold: { $sum: '$items.quantity' },
          },
        },
        {
          $sort: { totalQuantitySold: -1 },
        },
        {
          $limit: 3,
        },
        {
          $lookup: {
            from: 'products', // Assuming the collection name is 'Products'
            localField: '_id',
            foreignField: '_id',
            as: 'productData',
          },
        },
        {
          $unwind: '$productData',
        },
        {
          $project: {
            _id: 1,
            totalQuantitySold: 1,
            productName: '$productData.title',
            image:  '$productData.image',
          },
        },
      ]);
      
    
      const lessPerformingProducts = await orderModel.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantitySold: { $sum: '$items.quantity' },
          },
        },
        {
          $sort: { totalQuantitySold: 1 },
        },
        {
          $limit: 3,
        },
        {
          $lookup: {
            from: 'products', // Assuming the collection name is 'Products'
            localField: '_id',
            foreignField: '_id',
            as: 'productData',
          },
        },
        {
          $unwind: '$productData',
        },
        {
          $project: {
            _id: 1,
            totalQuantitySold: 1,
            productName: '$productData.title',
            image:  '$productData.image',
          },
        },
      ]);
      
      
      
      
      const online = onlinePaymentData[0].onlinePayment;
     

      


      res.render('admin/home', {
        
        totalsales,
        totalorder,
        average,
        cod,
        online,
        currentPage: req.path,
        topSellingProducts,
        outOfStockProducts,
        lessPerformingProducts

      });
    } catch (error) {
      console.log(error.message);
    }
  };
  





  const adminLogOut=(req,res)=>{
    try{
      req.session.login=false
      res.redirect("/admin")
    }
    catch(err){
      console.log(err)
    }
  }

  const userlist=async(req,res)=>{

    try{
      let users=await user.find()
      
      console.log(users)
      res.render("admin/users",{users,currentPage: req.path})
    
  }catch(err){
    console.log(err)
  }
  }

  const userunlist=async(req,res)=>{
    let id=req.params.id
    
    try{

      const unlistser= await user.findById(id)
      unlistser.isDeleted=!unlistser.isDeleted;
      await unlistser.save()
      res.redirect("/admin/userlist")
    }catch(err){
      console.log(err)
    }
    }
    const orderList = async (req, res) => {
      try {
        const orders = await orderModel.find().populate("user").populate("items.product");
        res.render("admin/orders", { orders,currentPage: req.path });

      } catch (err) {
        console.log(err);
      }
    };
    
    const updateOrderStatus = async(req,res)=>{
      try{
      const orderId=req.params.id
      const newStatus=req.body.status
      await orderModel.updateOne({_id:orderId},{$set:{status:newStatus}})
      res.status(200).send("order status updation success")
      }
      catch(error){
        console.log(error)
        res.status(500).send("Order status updation failed")
      }
  
    }

    const salesreport=async (req, res) => {
      try {
        // Retrieve total sales, total orders, and average order values from the database
        const sales = await orderModel.aggregate([
          { $group: { _id: null, totalSales: { $sum: '$total' } } }
        ]);
    
        const orders = await orderModel.countDocuments();
    
        const averageOrderValue = await orderModel.aggregate([
          { $group: { _id: null, avgOrderValue: { $avg: '$total' } } }
        ]);
    
        res.json({
          totalSales: sales[0].totalSales,
          totalOrders: orders,
          averageOrderValue: averageOrderValue[0].avgOrderValue
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving the admin dashboard data.' });
      }
    }
    
    const sortSalesData = async (req, res) => {
      try {
        const { interval } = req.body;
    
        let sortCriteria = {};
        if (interval === 'daily') {
          sortCriteria = { createdAt: { $gte: calculateStartDate('daily') } };
        } else if (interval === 'weekly') {
          sortCriteria = { createdAt: { $gte: calculateStartDate('weekly') } };
        } else if (interval === 'monthly') {
          sortCriteria = { createdAt: { $gte: calculateStartDate('monthly') } };
        }
    
        const sales = await orderModel.aggregate([
          { $match: sortCriteria },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$total' },
              totalOrders: { $sum: 1 },
              averageOrderValue: { $avg: '$total' },
              cod: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, '$total', 0] } },
              onlinePayment: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, '$total', 0] } }
            }
          }
        ]);
    
        res.json({
          totalSales: sales[0].totalSales,
          totalOrders: sales[0].totalOrders,
          average: sales[0].averageOrderValue,
          cod: sales[0].cod,
          onlinePayment: sales[0].onlinePayment
        });
      } catch (error) {
        console.error('Error sorting sales data:', error);
        res.status(500).json({ error: 'An error occurred while sorting sales data' });
      }
    };
    
    // Helper function to calculate the start date based on the sorting interval
    const calculateStartDate = (interval) => {
      const currentDate = new Date();
      if (interval === 'daily') {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      } else if (interval === 'weekly') {
        const firstDayOfWeek = currentDate.getDate() - currentDate.getDay();
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDayOfWeek);
      } else if (interval === 'monthly') {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }
    };
    const getOrderDetailsData = async (req, res) => {
      try {
        const currentYear = new Date().getUTCFullYear();
    
        const orderDetailsData = await orderModel.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(currentYear, 0, 1), // January 1st of the current year
                $lt: new Date(currentYear + 1, 0, 1), // January 1st of the next year
              },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              totalSales: { $sum: '$total' },
            },
          },
        ]);
    
        const monthsData = [];
        for (let i = 1; i <= 12; i++) {
          const monthData = orderDetailsData.find((data) => data._id.month === i);
          if (monthData) {
            monthsData.push(monthData);
          } else {
            monthsData.push({
              _id: {
                year: currentYear,
                month: i,
              },
              totalSales: 0,
            });
          }
        }
    
        res.json(monthsData);
      } catch (error) {
        console.error('Error fetching order details data:', error);
        res.status(500).json({ error: 'Failed to fetch order details data' });
      }
    };
    




    const downloadReport = async (req, res) => {
      try {
        // Fetch the required data for reports
        const totalSalesData = await orderModel.aggregate([{ $group: { _id: null, totalSales: { $sum: '$total' } } }]);
        const topSellingProductsData = await orderModel.aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.product', totalQuantitySold: { $sum: '$items.quantity' } } },
          { $sort: { totalQuantitySold: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productData' } },
          { $unwind: '$productData' },
          { $project: { _id: 1, totalQuantitySold: 1, productName: '$productData.title', image: '$productData.image' } }
        ]);
    
        // Create a new PDF document
        const doc = new PDFDocument();
        doc.pipe(res); // Send the PDF as the response, instead of saving it to a file
    
        // Add content to the PDF
        doc.fontSize(18).text('Total Sales Report', { align: 'center' });
        doc.fontSize(12).text('Total Sales: ' + totalSalesData[0].totalSales);
    
        // Add top selling products data
        doc.fontSize(14).text('Top Selling Products:', { underline: true });
        topSellingProductsData.forEach((product, index) => {
          doc.fontSize(12).text(`${index + 1}. ${product.productName} - Quantity Sold: ${product.totalQuantitySold}`);
        });
    
        // Finalize the PDF
        doc.end();
      } catch (error) {
        console.error('Error generating and sending PDF reports:', error);
        res.status(500).json({ error: 'Failed to generate and send PDF reports' });
      }
    };
  
  const getBanner=async(req,res)=>{
    
    const banners= await bannerModel.find()

    res.render("admin/banner",{
      banners,
      currentPage: req.path
    })
  }

const addbanner= async(req,res)=>{
  const { title, startDate, isExpired } = req.body;

try {
  // Check if an image was uploaded

  // Create a new banner document using the bannerModel
  const newBanner = new bannerModel({
    title,
    image:req.file.filename,
    startDate,
    isExpired: Boolean(isExpired), // Ensure the isExpired value is a boolean
  });

  // Save the new banner document to the database
  await newBanner.save();

  // Redirect the user to the desired page (e.g., back to the banners list page)
  res.redirect('/admin/banner'); // Change '/admin/banners' to the appropriate URL
} catch (error) {
  console.error('Error adding banner:', error);
  res.status(500).send('An error occurred while adding the banner.');
}
}

const deleteBanner= async (req,res)=>{
  const   bannerid=req.params.id
 
try {
  await bannerModel.findByIdAndRemove(bannerid)
  res.status(200)
  res.redirect("/admin/banner")
}
catch(err){
  res.status(500)
}
}
const editbanner=async(req,res)=>{
const bannerId=req.params.id
  const { title, startDate, isExpired } = req.body;

try{
    await bannerModel.findByIdAndUpdate(bannerId,{title,
      startDate,
      isExpired,
      image:req.file.filename
    }
    )
    res.status(200)
    res.redirect("/admin/banner")
}catch(err){
  res.status(500)
}

}


const removeBannerImage= async(req,res)=>{
  try{
    console.log(req.body)
    const productId=req.body.id;
    const position=req.body.position;
    const product=await bannerModel.findById(productId)
    const image=product.image[position]

    await bannerModel.updateOne(
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

const confirmReturn = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await orderModel.findById(orderId).populate('user');
    const currentDate = new Date();
    const orderDate = order.createdAt;
    const timeDifference = currentDate - orderDate;
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    if (daysDifference > 15) {
      return res.status(400).json({ message: 'Product can only be returned within 15 days of purchase' });
    }

    const orderAmount = order.total;
    order.user.wallet += orderAmount;

    await orderModel.findByIdAndUpdate(orderId, { status: 'Returned' });
    await order.user.save();

    return res.status(200).json({ message: 'Product returned successfully, amount will be added to your Wallet' });
  } catch (error) {
    console.error("Error confirming return:", error);
    res.status(500).json({ error: "An error occurred while confirming return" });
  }
};


  module.exports = {
    getlogin,
    loginpost,
    gethome,
    adminLogOut,
    userlist,
    userunlist,
    orderList,
    updateOrderStatus,
    salesreport,
    sortSalesData,
    getOrderDetailsData,
    downloadReport,
    getBanner,
    addbanner,
    deleteBanner,
    editbanner,
    removeBannerImage,
    confirmReturn
    
  };
  