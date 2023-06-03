const mongoose = require('mongoose');
const express = require('express')
const router = require('express').Router()
const {User} = require('../models/user')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get('/' , async(req , res)=>{

    // router code here

    const userList = await User.find().select('-passwordHash');

    if(!userList){
        res.status(500).json({success:false})
    }
   res.send(userList)

})

router.post('/newUser', async(req,res)=>{
    let body = req.body;
    console.log("hey",body);
    let user = new User({
        name:  req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        // passwordHash: req.body.passwordHash,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);
})

router.get('/:id' , async(req , res)=>{
    // router code here
    const user = await User.findById(req.params.id).select('-passwordHash');
    console.log("useeee",user)
    if(!user){
        return res.status(500).json({
            message: `The user with the given ID was not found or removed`
        })
    }
   res.status(200).send(user)
})

router.put('/:id' , async(req , res) =>{
    const userExist = await User.findById(req.params.id);
    let newPassword
    if(req.body.password){
        newPassword = bcrypt.hashSync(req.body.password, 10)
    }
    else{
        newPassword = userExist.passwordHash;
    }
    const user = await User.findByIdAndUpdate(req.params.id , {
        name:  req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        // passwordHash: req.body.passwordHash,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    },
    {
        new: true,
    }
    );

    if(!user){
        return res.status(404).send('the user cannot be updated')
    }
    
    res.send(user);
})

router.post('/login', async(req, res)=>{
    let user = await User.findOne({email:req.body.email})
    const secret = process.env.secret;
    if(!user){
        return res.status(400).send("User not found")
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){

        const token = jwt.sign(
            {
            userId : user.id,
            isAdmin: user.isAdmin
            },
            secret,
            {
                expiresIn: '1d'
            }
        )
        res.status(200).send({email:user.email, token: token});
    }
    else{
        return res.status(400).send("Incorrect Username or password")
    }
})

router.delete('/:id', (req, res)=>{

    User.findById(req.body.category).then((user)=>{
        if(!user) return res.status(400).send('Invalid user');
    });
    

    User.findByIdAndRemove(req.params.id).then(user =>{
        if(user){
            return res.status(200).json({
                success:true,
                message: 'user successfully deleted'
            })
        }
        else{
            return res.status(404).json({
                success:false,
                message: 'user not Found'
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

    const users = await User.countDocuments();
    //populate means any connected id or field to another table will be displayed as detailed
    if(!users){
        res.status(500).json({success:false}) 
    }
   res.send({ UserCount : users})
})

module.exports  = router