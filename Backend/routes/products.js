const mongoose = require('mongoose');
const express = require('express')
const router = require('express').Router()
const {Product} = require('../models/product');
const { Category } = require('../models/category');
// it is returning object so we also can use object destructure while importing

//http://localhost:3300/api/v1/products

const multer  = require('multer')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let uploadError = new Error('invalid image type');
        if(isValid){
            uploadError = null
        }
      cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const fileName = file.originalname.split(' ').join('-');
    const extension  = FILE_TYPE_MAP[file.mimetype]
      cb(null, `${fileName}-${Date.now()}.${extension}` )
    // cb(null, fileName )
    }
  })
  
  const uploadOptions = multer({ storage: storage }) 

router.get('/' , async(req , res)=>{
    // router code here
    let filter = {};
    if(req.query.categories){
        filter = { category : req.query.categories.split(',') };
    }
    const productList = await Product.find( filter ).populate('category');
    // const productList = await Product.find().select('name image -_id'); //select method provide only specific values of items

    if(!productList){
        res.status(500).json({success:false})
    }
   res.send(productList)
})

router.get('/:id' , async(req , res)=>{
    // router code here
    // const product = await Product.findById(req.params.id);
    const product = await Product.findById(req.params.id).populate('category');
    //populate means any connected id or field to another table will be displayed as detailed
    if(!product){
        res.status(500).json({success:false}) 
    }
   res.send(product)
})


router.post('/' , uploadOptions.single('image'), async(req , res)=>{

    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category')

    const file = req.file;
    if(!file) return res.status(400).send('No image in the request')

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    let product = new Product({
        name:req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        // image: req.body.image,
        image : `${basePath}${fileName}`,
        // images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        dateCreated: req.body.dateCreated 
    });
    product = await product.save();

    if(!product){
        return res.status(500).send('The product cannot be created')
    }

    return res.status(200).send(product)
    // product.save().then((createdProduct)=>{
    //     res.status(201).json(createdProduct)
    // }).catch((err)=>{
    //     res.status(500).json({
    //         error: err,
    //         success: false
    //     })
    // })

})

router.put('/:id' , uploadOptions.single('image'), async(req , res) =>{
    //save from getting hang when bad product ID pass.
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid Product ID')
    }
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category')

    let product = await Category.findById(req,body.category);
    if(!product){
        return res.status(400).send('Invalid Product');
    } 

    const file = req.file;
    let imagepath;

    if(file){
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`
    }
    else{
        imagepath = product.image;
    }
    product = await Product.findByIdAndUpdate(req.params.id , {
        name:req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        // image: req.body.image,
        image : imagepath,
        // images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        dateCreated: req.body.dateCreated 
    },
    {
        new: true,
    }
    );

    if(!product){
        return res.status(500).send('the product cannot be updated')
    }
    
    res.send(product);
})

router.delete('/:id', (req, res)=>{

    Category.findById(req.body.category).then((category)=>{
        if(!category) return res.status(400).send('Invalid Category');
    });
    

    Product.findByIdAndRemove(req.params.id).then(product =>{
        if(product){
            return res.status(200).json({
                success:true,
                message: 'product successfully deleted'
            })
        }
        else{
            return res.status(404).json({
                success:false,
                message: 'product not Found'
            })
        }
    }).catch((err) =>{
        return res.status(400).json({
            success:false,
            error: 'err'
        })
    })
})

router.get('/get/count' , async(req , res)=>{

    const productCount = await Product.countDocuments();
    //populate means any connected id or field to another table will be displayed as detailed
    if(!productCount){
        res.status(500).json({success:false}) 
    }
   res.send({productCount : productCount})
})

router.get('/get/featured/:count' , async(req , res)=>{ 

    const count = req.params.count || 0;
    const products = await Product.find( { isFeatured : true} ).limit(+count);
    //populate means any connected id or field to another table will be displayed as detailed
    if(!products){
        res.status(500).json({success:false}) 
    }
   res.send( products)
})

router.put('/gallery-images/:id' ,uploadOptions.array('images',10),
 async(req , res) =>{
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid Product Id')
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`; 
    console.log("req",req)
    console.log("files",files)
    if(files){
        files.map(file =>{
            console.log("file",file)
            imagesPaths.push(`${basePath}${file.filename}`);
        })
    }
    console.log(imagesPaths)
    
    const product = await Product.findByIdAndUpdate(req.params.id, 
        {
        images : imagesPaths
        },
        { new : true}
    )
    if(!product){
        return res.status(500).send('The product cannot be updated')
    }
    res.send(product)
})
module.exports  = router
//exporting the module