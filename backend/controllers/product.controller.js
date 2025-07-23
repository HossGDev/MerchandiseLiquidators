import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import  product  from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await product.find({}); // Fetch all products
    res.json({ products });
  } catch (error) {
    console.log("error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if(featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
   }

   // if not in redis, fetch from mongodb
   // lean() converts mongoose documents to plain JavaScript objects
   // this is useful for performance and to avoid mongoose overhead
   featuredProducts = await product.find({ isFeatured: true }).lean();

   if(!featuredProducts) {
     return res.status(404).json({ message: "No featured products found" });
   }
   // store in redis for future quick access
   await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.json(featuredProducts);
  } catch (error) {
    console.log("error in getFeaturedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }};

export const createProduct = async (req, res) => {
  try {
    const { name, description, image, catagory  } = req.body;

    let cloudinaryResponse = null;
    if (image) {
      await cloudinary.uploader.upload(image, {
        folder: "products" })
   
    const product = await product.create({
      name,
      description,
      image: cloudinaryResponse.secure_url ? cloudinaryResponse.secure_url : "", // Use the secure URL from Cloudinary
      catagory
    })
    res.status(201).json(product);
  }
  } catch (error) {
    console.log("error in createProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message })
  }
  
  };

export const deleteProduct = async (req, res) => {
  try {
    const product = await product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
     const publicId = product.image.split("/").pop().split(".")[0]; // Extract public ID from the image URL
     try {
      await cloudinary.uploader.destroy(`products/${publicId}`); // Delete image from Cloudinary
     console.log("Image deleted from Cloudinary");
     } catch (error) {
      console.log("Error deleting image from Cloudinary", error);
     }
    }
    await product.findByIdAndDelete(req.params.id); // Delete product from MongoDB
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getRecomendedProducts = async (req, res) => {

  try {
    const products = await product.aggregate([
     { $sample: { size:3 }},    // Randomly select 3 products

     {$project: {
        _id:1,
        name:1,
        description:1,
        image:1,
        price:1
     }}
    ])

    res.json(products);
  } catch (error) {
    console.log("error in getRecomendedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsbyCatagory = async (req, res) => {
  const { catagory } = req.params;
  try {
    
    const products = await product.find({catagory});
    res.json(products);


  } catch (error) {
    console.log("error in getProductsbyCatagory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
 
export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await product.findById(req.params.id);
    if(product) {
      product.isFeatured = !product.isFeatured; // Toggle the isFeatured status
      const updatedProduct = await product.save(); // Save the updated product
      // Clear the featured products cache in Redis
      await updatedFeaturedProductsCache();

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }  
  } catch (error) {
    console.log("error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function updatedFeaturedProductsCache() {
  try {
    //  the Lean method returns plain JavaScript objects instead of Mongoose documents
    // this is useful for performance and to avoid Mongoose overhead
    const featuredProducts = await product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
   
  } catch (error) {
    console.log("Error updating featured products cache", error.message);
  }
}