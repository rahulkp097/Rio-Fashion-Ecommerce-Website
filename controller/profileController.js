const productModel = require("../model/product");
const categoryModel = require("../model/category");
const userList = require("../model/user");
const orderModel=require("../model/order")
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const bcrypt = require('bcrypt');


const updatepassword = async (req, res) => {
  const { currentpassword, newpassword, confirmpassword } = req.body;

  const user = await userList.findById(req.session.userId);

  // Check if the current password matches the one in the database
  const isPasswordMatch = await bcrypt.compare(currentpassword, user.password);
  if (!isPasswordMatch) {
    // Wrong current password
    req.flash("error", "Incorrect current password");
    return res.render("user/profile");
  }

  if (newpassword !== confirmpassword) {
    // New password and confirm password do not match
    req.flash("error", "New password and confirm password do not match");
    return res.redirect("/profile");
  }

  // Hash the new password before saving it to the database
  const hashedPassword = await bcrypt.hash(newpassword, 10);
  user.password = hashedPassword;
  await user.save();

  req.flash("success", "Password updated successfully");
  res.redirect("/profile");
};

  


  const updateadress= async (req,res)=>{
    try {
        addressId=req.params.id
        const { name, houseNumber, state, city, pin, number } = req.body;
        
        const user = await userList.findById(req.session.userId);
    
        
    
        const newAddress = {
          name: name,
          houseNumber: houseNumber,
          city: city,
          state: state,
          pin: pin,
          phone: number,
          isDefault: false,
        };
    
        const address = user.address.find((address)=> address._id.toString()===addressId )
        if(!address)return  res.status(404).json({ error: "Address not found" });
       
        address.name= name,
        address.houseNumber= houseNumber,
        address.city= city,
        address.state= state,
        address.pin= pin,
        address.phone= number,

        await user.save()

       res.redirect("/profile")
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" });
      }
    };
    

  const cancelUserOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    console.log("orderiD",orderId);
    // Find the order in the database
    const order = await orderModel.findById(orderId).populate('user');

    // Check if the order payment method is online
    if (order.paymentMethod === 'cod') {
      order.status =  'Cancelled';
    await order.save()
    return res.status(200).json({ message: 'Order cancelled successfully' })
    }

    const userId = order.user; // Assuming there's a field called 'userId' in the order schema
    const user = await userList.findById(userId);

  
      const productAmount = order.total

      // Add the product amount to the user's wallet
      user.wallet += productAmount;
 

    // Cancel the order by updating its status
    order.status = 'Cancelled';
    await order.save();

    await user.save();

    return res.status(200).json({ message: 'Order cancelled successfully, and the product amounts have been added to the user\'s wallet.' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ message: 'An error occurred while cancelling the order' });
  }
};


const downloadOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel.findById(orderId).populate('items.product').populate("user");
    console.log("order", order);

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the appropriate response headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="order_details.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    const filePath = path.join(__dirname, 'order_details.pdf');
    // Pipe the PDF document directly to the response stream
    doc.pipe(res);
    // Add content to the PDF document
 
    doc.fontSize(14).text('RioFashion-Order Details ', { align: 'center' });
    doc.text('====================', { align: 'center' });
    doc.text(`Order ID: ${order._id}`);
    doc.text(`User: ${order.user.username}`);
    doc.text(`Order Date: ${order.createdAt.toDateString()}`);
    doc.text('-----------------------');
    doc.text('Products:');
    order.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.product.title} - Rs.${item.product.sellingprice} x ${item.quantity}`);
    });
    doc.text('-----------------------');
    doc.text(`Sub Total: Rs.${order.subtotal}`);
    doc.text(`Discount: Rs.${order.discount || 0}`);
    doc.text(`Total Amount: Rs.${order.total}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text('-----------------------');
    doc.text('Shipping Address:');
    doc.text(`Name: ${order.shippingAddress.name}`);
    doc.text(`House Number: ${order.shippingAddress.houseNumber}`);
    doc.text(`City: ${order.shippingAddress.city}`);
    doc.text(`State: ${order.shippingAddress.state}`);
    doc.text(`Pin: ${order.shippingAddress.pin}`);
    doc.text(`Phone: ${order.shippingAddress.phone}`);
    doc.text('-----------------------');
    doc.text('----------- Thankyou for your order, Your order made our day! We hope we make yours. If you have any questions about your order, contact us anytime. We would love to hear from you  ------------',{ align: 'center' });
    // Finalize the PDF document
    doc.end();

    // Handle the 'finish' event of the response stream to delete the temporary file
    res.once('finish', () => {
      console.log('Response stream finished');
      // Delete the temporary file after sending the response
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting temporary file:', err);
        } else {
          console.log('Temporary file deleted successfully');
        }
      });
    });

  } catch (error) {
    console.error('Error during order details download:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
  
  
module.exports={
    updatepassword,
    updateadress,
    cancelUserOrder,
    downloadOrder
}