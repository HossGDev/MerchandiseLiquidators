import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";


const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m", 
	});

	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "7d", 
	});
	return { accessToken, refreshToken }
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(
        `refresh_token:${userId}`,
        refreshToken,
        { ex: 7 * 24 * 60 * 60 } // 7 days in seconds
    );
};

const setCookies =  (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevents xss attacks, cross site scripting attacks
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross site forgery
		maxAge: 7 * 24 * 60 *60 * 1000, // 7 days
	});
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true, // prevents xss attacks, cross site scripting attacks
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict", // prevents CSRF attack, cross site forgery
			maxAge: 15 * 60 * 1000, // 15 minutes
	});

};

export const signup = async (req, res) => {
    const {email,password,name} = req.body;
    try {
        const userExists = await User.findOne({email});

    		if(userExists) {
        	return res.status(400).json({message: "User already exists"});
    	}   
    	const user = await User.create ({ name, email, password })

			// Authenticate user
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);

			setCookies(res, accessToken, refreshToken);

    	res.status(201).json({
				user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role
				},
				message: "User created successfully",
			});
    } catch (error) {
				console.log("Error in signup controller", error.message);
				res.status(500).json({message: error.message});
    }
};

export const login = async (req, res) => {
    res.send("Login route called")
}

export const logout = async (req, res) => {
    res.send("Logout route called")
}