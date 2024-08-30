import UserModel from '../models/userModel.js';
import bcryptjs from 'bcryptjs';
import sendEmail from '../middlewares/sendEmail.js';
import jwt from 'jsonwebtoken';

// Sign Up Function
export const SignUp = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const normalizedEmail = email ? email.toLowerCase() : null;

    if (normalizedEmail) {
      const userExists = await UserModel.findOne({ Email: normalizedEmail });
      if (userExists) {
        return res.status(401).json({ message: "User with this email already exists" });
      }
    } else {
      return res.status(400).json({ message: "Email is required" });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create and save the new user
    const newUser = new UserModel({
      FullName: fullName,
      Email: normalizedEmail,
      TelphoneNumber: phoneNumber,
      Password: hashedPassword,
    });

    const savedUser = await newUser.save();

    return res.status(200).json({ message: "Account created!", savedUser });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Log In Function

export const LogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('User Password (Hash):', user.password); 
    const isMatch = await user.comparePassword(password);
    console.log('Is Password Match:', isMatch); 

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: "Logged in successfully", user, token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Get Users Function
export const getUsers = async (req, res) => {
  try {
    const allUsers = await UserModel.find({});
    if (!allUsers || allUsers.length === 0) {
      return res.status(404).json({ message: "No users found!" });
    } else {
      res.status(200).json({ allUsers });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// Update User Function
export const updateUser = async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(201).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
