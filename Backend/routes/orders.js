const mongoose = require('mongoose');
const express = require('express')
const router = require('express').Router()
const {Order} = require('../models/order');
const { OrderItems } = require('../models/order-item');



router.get('/' , async(req , res)=>{
    
    // router code here
    const orderList = await Order.find().populate('user','name').sort( { 'dateOrdered' : -1} );
    //populating only name of User table in Order table
    if(!orderList){
        res.status(500).json({success:false})
    }
   res.send(orderList)
})

router.get('/:id' , async(req , res)=>{
    
    // router code here
    const order = await Order.findById(req.params.id)
    .populate('user','name')
    // .populate( { path : 'orderItems' , populate : 'product'});
    .populate( { 
        path : 'orderItems' , populate : { 
            path : 'product', populate : 'category'
        }
    });
    //populating nested tables
    if(!order){
        res.status(500).json({success:false})
    }
   res.send(order)
})


// router.post('/' , (req , res)=>{
//     const order = new Order({
//         name:req.body.name,
//         image: req.body.image,
//         countInStock : req.body.countInStock
//     });
//     order.save().then((createdOrder)=>{
//         res.status(201).json(createdOrder)
//     }).catch((err)=>{
//         res.status(500).json({
//             error: err,
//             success: false
//         })
//     })

// })
router.post('/' , async(req , res)=>{
    let body =  await req.body;
    console.log(body);
    
    const orderItemsIds = Promise.all(req.body.orderItems.map(async(orderItem) => {
        let newOrderItem = new OrderItems({
            quantity : orderItem.quantity,
            product : orderItem.product
        })
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))
    const resolvedOrderItemsIds = await orderItemsIds;
    const totalPrices = await Promise.all(resolvedOrderItemsIds.map(async(orderItemId)=>{
        const orderItem = await OrderItems.findById(orderItemId).populate('product','price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }))
    const totalPrice = totalPrices.reduce((a,b) => a+b, 0);

    let order = new Order({
        orderItems : resolvedOrderItemsIds,
        shippingAddress1 : req.body.shippingAddress1,
        shippingAddress2 : req.body.shippingAddress2,
        city : req.body.city,
        zip : req.body.zip,
        country : req.body.country,
        phone : req.body.phone,
        status : req.body.status,
        totalPrice : totalPrice,
        user : req.body.user
    });
    
    order = await order.save();

    if(!order){
        return res.status(404).send('the order cannot be created')
    }
    
    res.send(order);

    //same code with callback
    // category.save().then((createdCategory)=>{
    //     res.status(201).json(createdCategory)
    // }).catch((err)=>{
    //     res.status(500).json({
    //         error: err,
    //         success: false
    //     })
    // })

})
//update order status
router.put('/:id' , async(req , res) =>{
    const order = await Order.findByIdAndUpdate(req.params.id , {
        status: req.body.status
    },
    {
        new: true,
    }
    );

    if(!order){
        return res.status(404).send('the order cannot be updated')
    }
    
    res.send(order);
})

router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order){
            await order.orderItems.map(async orderItem =>{
                await orderItem.findByIdAndRemove(orderItem)
            }) 
            return res.status(200).json({
                success:true,
                message: 'order successfully deleted'
            })
        }
        else{
            return res.status(404).json({
                success:false,
                message: 'order not Found'
            })
        }
    }).catch((err) =>{
        return res.status(400).json({
            success:false,
            error: 'err'
        })
    })
})

router.get('/get/totalsales',async (req, res)=>{
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales : { $sum : '$totalPrice' } } }
    ])
    if(!totalSales){
        return res.status(400).send('The order sales cannot be generated')
    }
    res.send({totalsales: totalSales.pop().totalsales})
})

router.get('/get/count' , async(req , res)=>{

    const orderCount = await Order.countDocuments();

    if(!orderCount){
        res.status(500).json({success:false}) 
    }
   res.send({orderCount : orderCounts})
})

router.get('/get/userorders/:userid' , async(req , res)=>{

    const userOrderList = await Order.find({ user : req.params.id}).populate({
        path: 'orderItems', populate : {
            path : 'product', populate: 'category'
        }
    }).sort({ 'dateOrdered' : -1 });
    
    if(!userOrderList){
        res.status(500).json({success:false}) 
    }
   res.send(userOrderList)
})
module.exports  = router
//exporting the module