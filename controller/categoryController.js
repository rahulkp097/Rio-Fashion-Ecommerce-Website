const Category = require('../model/category');



const createCategory = async (req, res) => {
  try {
    const { name, offerAvailable, discountPercentage, offerDescription, } = req.body;
    const image = req.file.filename;
    
    const newCategory = new Category({ name, image });

    // Add offer data to the newCategory object if offerAvailable is true
    if (offerAvailable === 'true') {
      const offer = {
        isOfferAvailable: true,
        discountPercentage: parseInt(discountPercentage),
        offerDescription,
       
      };
      newCategory.offer = offer;
    } else {
      newCategory.offer = {
        isOfferAvailable: false,
        discountPercentage: 0,
        offerDescription: '',
       
      };
    }

    let existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      const categories = await Category.find();
      return res.render("admin/category", { message: "Category already exists", categories, currentPage: req.path });
    }

    await newCategory.save();
    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};


const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, offerAvailable, discountPercentage, offerDescription, } = req.body;
    const category = await Category.findById(categoryId);

    // Update category name
    category.name = name;

    // Update category image if a new file is uploaded
    if (req.file) {
      category.image = req.file.filename;
    }

    // Update offer data if offerAvailable is true
    if (offerAvailable === 'true') {
      if (!category.offer) {
        category.offer = {
          isOfferAvailable: true,
          discountPercentage: parseInt(discountPercentage),
          offerDescription,
          
        };
      } else {
        category.offer.isOfferAvailable = true;
        category.offer.discountPercentage = parseInt(discountPercentage);
        category.offer.offerDescription = offerDescription;
       
      }
    } else {
      // Disable the offer
      category.offer = {
        isOfferAvailable: false,
        discountPercentage: 0,
        offerDescription: '',
        
      };
    }

    // Save the updated category
    await category.save();

    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};



const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render('admin/category', { categories,currentPage: req.path });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};




const unlistcategory = async (req, res) => {
  const categoryId = req.params.id;
  console.log(categoryId)

  try {
   
    let category=await Category.findById(categoryId);

    category.isDeleted=!category.isDeleted
  await category.save()
    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};








module.exports = {
  getAllCategories,
  createCategory,
  unlistcategory,
  editCategory,
 
};
