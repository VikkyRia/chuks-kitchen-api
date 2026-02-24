const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const UserModel = {
  // Find a user by their email
  findByEmail(email) {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  },

  // Find a user by their phone number
  findByPhone(phone) {
    return db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
  },

  // Find a user by their ID
  findById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  },

  // Find a user by referral code
  // A user's ID is their referral code
  findByReferralCode(code) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(code);
  },

  // Create a brand new user
  create({ name, email, phone, referral_code, otp, otp_expires_at }) {
    const id = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, phone, referral_code, otp, otp_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      email || null,
      phone || null,
      referral_code || null,
      otp,
      otp_expires_at
    );

    return id;
  },

  // Mark a user as verified and clear their OTP
  verifyUser(id) {
    db.prepare("UPDATE users SET is_verified = 1, otp = NULL WHERE id = ?")
      .run(id);
  },

  // Get a user's public profile 
  getProfile(id) {
    return db
      .prepare(
        "SELECT id, name, email, phone, role, is_verified, created_at FROM users WHERE id = ?"
      )
      .get(id);
  },
};

module.exports = UserModel;