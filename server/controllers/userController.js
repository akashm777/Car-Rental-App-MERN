import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import Car from "../models/Car.js";

// Generate JWT Token
const generateToken = (userId)=>{
    const payload = { userId };
    return jwt.sign(payload, process.env.JWT_SECRET);
}



// Register User
export const registerUser = async (req, res)=>{
    try{
        const {name, email, password} = req.body;

        const userExists = await User.findOne({email})
        if(userExists){
            return res.json({
                success : false,
                message : 'User already exists'
            })
        }

        const hashedPassword = await bcrypt.hash(password,10);
        const user = await User.create({name, email, password: hashedPassword});
        
        const token = generateToken(user._id.toString());
        return res.json({
            success: true,
            token,
        })
    }
    catch(e){
        console.error(e.message);
        res.json({
            success : false,
            message : e.message
        })
    }
}



// Login User
export const loginUser = async (req, res) =>{
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.json({
                success : false,
                message : "User not found"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.json({
                success : false,
                message : "Invalid Credentials"
            })
        }

        const token = generateToken(user._id.toString());
        return res.json({
            success: true,
            token,
        })
    } 
    catch(e){
        console.error(e.message);
        res.json({
            success : false,
            message : e.message
        })
    }
}


// Get User data using JWT
export const getUserData = async (req, res) =>{
    try{
        const {user} = req;
        return res.json({
            success : true,
            user
        })
    }
    catch(e){
        console.error(e.message);
        return res.json({
            success : false,
            message : e.message
        })
    }
}


// Get all cars for the frontend
export const getCars = async (req, res) =>{
    try{
        const cars = await Car.find({isAvailable: true});
        return res.json({
            success : true,
            cars
        })
    }
    catch(e){
        console.error(e.message);
        res.json({
            success : false,
            message : e.message
        })
    }
}