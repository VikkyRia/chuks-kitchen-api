const UserModel = require("../models/user.model");

const UserController = {
  // POST /api/users/signup
  signup(req, res) {
    const { name, email, phone, referral_code } = req.body;

    // Validate name
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // Validate email or phone
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Either email or phone number is required",
      });
    }

    // Check for duplicate email
    if (email && UserModel.findByEmail(email)) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Check for duplicate phone
    if (phone && UserModel.findByPhone(phone)) {
      return res.status(409).json({
        success: false,
        message: "An account with this phone number already exists",
      });
    }

    // Validate referral code if provided
    if (referral_code && !UserModel.findByReferralCode(referral_code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Create user
    const user_id = UserModel.create({
      name,
      email,
      phone,
      referral_code,
      otp,
      otp_expires_at,
    });

    res.status(201).json({
      success: true,
      message: "Account created! Please verify with the OTP.",
      user_id,
      otp,
    });
  },

  // POST /api/users/verify
  verify(req, res) {
    const { user_id, otp } = req.body;

    if (!user_id || !otp) {
      return res.status(400).json({
        success: false,
        message: "user_id and otp are required",
      });
    }

    const user = UserModel.findById(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.is_verified === 1) {
      return res.status(400).json({
        success: false,
        message: "This account is already verified",
      });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please sign up again.",
      });
    }

    // Check OTP match
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    UserModel.verifyUser(user_id);

    res.json({
      success: true,
      message: "Account verified successfully! 🎉",
    });
  },

  // GET /api/users/:id
  getProfile(req, res) {
    const user = UserModel.getProfile(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  },
};

module.exports = UserController;