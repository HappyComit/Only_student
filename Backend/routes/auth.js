const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');
const { sanitize, sanitizeFields } = require('../middleware/sanitize');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is not set');

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new student user with profile enhancements
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      isSeller,
      upiId,
      bio,
      avatarUrl,
      name,
      university,
      department,
      year,
      skills,
      responseTime
    } = req.body;

    // 1. Basic validation: Make sure essential fields are filled
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password are required." });
    }

    // 1.5 Validate university email domain restriction
    if (!email.trim().toLowerCase().endsWith('@cuchd.in')) {
      return res.status(400).json({ error: "Registration is restricted to university email accounts ending in @cuchd.in." });
    }

    // 2. Check if the email is already registered in the DB
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // 3. Check if the username is already taken
    const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUserByUsername) {
      return res.status(400).json({ error: "This username is already taken." });
    }

    // 4. Hash the password using bcrypt for security
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Create and save the new user to the SQLite database
    const safe = sanitizeFields(req.body, {
      name: 100, bio: 500, university: 150, department: 150,
      year: 20, skills: 500, responseTime: 30, upiId: 50
    });

    const newUser = await prisma.user.create({
      data: {
        email,
        username: sanitize(username, 30),
        passwordHash,
        isSeller: isSeller || false,
        upiId: safe.upiId || null,
        bio: safe.bio || "",
        avatarUrl: avatarUrl || "",
        // New Profile Fields:
        name: safe.name || null,
        university: safe.university || null,
        department: safe.department || null,
        year: safe.year || null,
        skills: safe.skills || null,
        responseTime: safe.responseTime || null,
        isVerified: false // Default to false upon registration
      }
    });

    // 6. Return the registered user's details (excluding password hash)
    return res.status(201).json({
      message: "Registration successful!",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        isSeller: newUser.isSeller,
        isAdmin: newUser.isAdmin,
        upiId: newUser.upiId,
        bio: newUser.bio,
        avatarUrl: newUser.avatarUrl,
        name: newUser.name,
        university: newUser.university,
        department: newUser.department,
        year: newUser.year,
        skills: newUser.skills,
        responseTime: newUser.responseTime,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Something went wrong during registration." });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Logs in user & returns session token and full profile info
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter both email and password." });
    }

    // 2. Check if user exists by searching for email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 3. Compare the entered password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 4. Generate a JWT token containing user details
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        isSeller: user.isSeller
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token remains active for 7 days
    );

    // 5. Store the token in a secure HTTP-Only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 6. Return the user info and token to the frontend
    return res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isSeller: user.isSeller,
        isAdmin: user.isAdmin,
        upiId: user.upiId,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        name: user.name,
        university: user.university,
        department: user.department,
        year: user.year,
        skills: user.skills,
        responseTime: user.responseTime,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Something went wrong during login." });
  }
});
const nodemailer = require('nodemailer');

// Setup Nodemailer transporter dynamically from environment variables
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generates 6-digit OTP and sends email for password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ error: "No user found with this email address." });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expiresAt
      }
    });

    console.log(`====================================================`);
    console.log(` 📧 [AUTH] Password Reset OTP for ${user.email}: ${otp}`);
    console.log(`====================================================`);

    // Try sending email via Nodemailer
    try {
      await transporter.sendMail({
        from: `"CampusHive Security" <${process.env.SMTP_USER || 'no-reply@campushive.com'}>`,
        to: user.email,
        subject: 'CampusHive Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
            <h2>CampusHive Password Reset</h2>
            <p>Your 6-digit password reset verification code is:</p>
            <h1 style="color: #2563EB; letter-spacing: 4px;">${otp}</h1>
            <p>This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn("Nodemailer transport notice (normal in dev without live SMTP credentials):", mailErr.message);
    }

    return res.json({
      message: "Reset code generated and sent to email!"
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ error: "Failed to process forgot password request." });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verifies OTP and resets user password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP code, and new password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ error: "Invalid or expired password reset request." });
    }

    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ error: "Incorrect 6-digit OTP code." });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({ error: "OTP code has expired. Please request a new code." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password & clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpires: null
      }
    });

    return res.json({ message: "Password reset successful! You can now log in with your new password." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Failed to reset password." });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Clears active user session
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: "Logged out successfully." });
});

/**
 * @route   GET /api/auth/profile
 * @desc    Retrieves profile data of currently logged-in user (Secure route)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isSeller: user.isSeller,
        isAdmin: user.isAdmin,
        upiId: user.upiId,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        name: user.name,
        university: user.university,
        department: user.department,
        year: user.year,
        skills: user.skills,
        responseTime: user.responseTime,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return res.status(500).json({ error: "Failed to load profile details." });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Updates the profile of currently logged-in user (Secure route)
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      isSeller,
      upiId,
      bio,
      avatarUrl,
      name,
      university,
      department,
      year,
      skills,
      responseTime,
      isVerified
    } = req.body;

    // Sanitize user-submitted text fields
    const safe = sanitizeFields(req.body, {
      name: 100, bio: 500, university: 150, department: 150,
      year: 20, skills: 500, responseTime: 30, upiId: 50
    });

    // Update user record in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {

        isSeller: isSeller !== undefined ? isSeller : undefined,
        upiId: safe.upiId !== undefined ? safe.upiId : undefined,
        bio: safe.bio !== undefined ? safe.bio : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        // Support updating new fields
        name: safe.name !== undefined ? safe.name : undefined,
        university: safe.university !== undefined ? safe.university : undefined,
        department: safe.department !== undefined ? safe.department : undefined,
        year: safe.year !== undefined ? safe.year : undefined,
        skills: safe.skills !== undefined ? safe.skills : undefined,
        responseTime: safe.responseTime !== undefined ? safe.responseTime : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined
      }
    });

    return res.json({
      message: "Profile updated successfully!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        isSeller: updatedUser.isSeller,
        isAdmin: updatedUser.isAdmin,
        upiId: updatedUser.upiId,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
        name: updatedUser.name,
        university: updatedUser.university,
        department: updatedUser.department,
        year: updatedUser.year,
        skills: updatedUser.skills,
        responseTime: updatedUser.responseTime,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

/**
 * @route   GET /api/auth/admin/stats
 * @desc    Retrieves platform counts and pending/verified user lists for admin console (Secure route)
 */
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !requester.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    const totalUsers = await prisma.user.count();
    const freelancers = await prisma.user.findMany({
      where: { isSeller: true }
    });

    const totalFreelancers = freelancers.length;
    const verifiedFreelancers = freelancers.filter(f => f.isVerified);
    const pendingVerifications = freelancers.filter(f => !f.isVerified);

    const totalGigs = await prisma.gig.count();
    const totalOrders = await prisma.order.count();

    const completedOrders = await prisma.order.findMany({
      where: { status: 'COMPLETED' },
      select: { price: true }
    });
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.price, 0);

    return res.json({
      stats: {
        totalUsers,
        totalFreelancers,
        verifiedCount: verifiedFreelancers.length,
        pendingCount: pendingVerifications.length,
        totalGigs,
        totalOrders,
        totalRevenue
      },
      pendingList: pendingVerifications.map(u => ({
        id: u.id,
        name: u.name || u.username,
        role: u.bio || "Freelancer Creator",
        university: u.university || "Chandigarh University",
        year: u.year || "1st Year",
        avatar: u.avatarUrl || `https://i.pravatar.cc/150?img=${Math.abs(u.username.charCodeAt(0) % 70) || 12}`,
        isVerified: false,
        responseTime: u.responseTime || "~2 hrs"
      })),
      verifiedList: verifiedFreelancers.map(u => ({
        id: u.id,
        name: u.name || u.username,
        role: u.bio || "Verified Expert",
        university: u.university || "Chandigarh University",
        year: u.year || "3rd Year",
        avatar: u.avatarUrl || `https://i.pravatar.cc/150?img=${Math.abs(u.username.charCodeAt(0) % 70) || 12}`,
        isVerified: true,
        rating: 4.9,
        completedOrders: 14,
        responseTime: u.responseTime || "~2 hrs"
      }))
    });
  } catch (error) {
    console.error("Admin Stats Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

/**
 * @route   POST /api/auth/admin/verify/:userId
 * @desc    Approves or rejects freelancer verification (Secure route)
 */
router.post('/admin/verify/:userId', authenticateToken, async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !requester.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    const { isVerified } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isVerified: !!isVerified }
    });
    return res.json({ message: "Verification status updated successfully!", user: updatedUser });
  } catch (error) {
    console.error("Freelancer Verification Error:", error);
    return res.status(500).json({ error: "Failed to verify freelancer." });
  }
});

module.exports = router;
