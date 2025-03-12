const User = require('../models/user.model');
const { OAuth2Client } = require('google-auth-library');

// Create a new OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    
    console.log('Google Auth Request received');
    
    if (!idToken) {
      console.error('Google Auth Error: No ID token provided');
      return res.status(400).json({
        success: false,
        message: 'No Google ID token provided'
      });
    }
    
    // Make sure the GOOGLE_CLIENT_ID is set in environment
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('Server misconfiguration: GOOGLE_CLIENT_ID not set in environment');
      return res.status(500).json({
        success: false,
        message: 'Server authentication configuration error'
      });
    }
    
    console.log('Verifying Google ID token');
    
    try {
      // Verify the token
      console.log('Attempting to verify ID token:', idToken); // Log the ID token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      console.log('Google token verified, user:', payload.email);
      
      const { email, name, sub: googleId } = payload;
      
      // Check if user exists with this email
      let user = await User.findOne({ email });
      
      if (!user) {
        // If user doesn't exist, create a new one
        console.log('Creating new user from Google authentication:', email);
        try {
          user = await User.create({
            name,
            email,
            googleId,
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) // Generate random password
          });
        } catch (createError) {
          console.error('Error creating user from Google auth:', createError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create user account'
          });
        }
      } else {
        // If user exists but hasn't linked Google yet, update their Google ID
        if (!user.googleId) {
          console.log('Linking existing user to Google account:', email);
          user.googleId = googleId;
          await user.save();
        }
      }
      
      sendTokenResponse(user, 200, res);
    } catch (verificationError) {
      console.error('Google token verification failed:', verificationError);
      console.error('Verification error details:', verificationError); // Log the error details
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: Invalid token'
      });
    }
  } catch (error) {
    console.error('Google auth unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication failed: ' + (error.message || 'Unknown error')
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get dashboard data
// @route   GET /api/auth/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // You can add more dashboard data here
    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      accountSummary: {
        totalBalance: 0, // This would come from your trading model
        activeTrades: 0,
        profit: 0,
        tradingHistory: []
      }
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Use secure cookies in production and specify the domain
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    options.domain = 'forexprox.com';
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};