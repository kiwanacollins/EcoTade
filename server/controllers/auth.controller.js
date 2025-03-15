const { User } = require('../models'); // Update to use centralized models
const { OAuth2Client } = require('google-auth-library');

// Create a new OAuth2 client with error handling for missing client ID
const getGoogleClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('GOOGLE_CLIENT_ID environment variable is not set');
    return null;
  }
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
};

const client = getGoogleClient();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user with validated data
    const user = await User.create({
      name,
      email,
      password,
      financialData: {
        totalBalance: 0,
        profit: 0,
        activeTrades: 0,
        activeTraders: 0,
        transactions: [],
        investments: []
      }
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
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
    
    // Validate Google client configuration
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('Google Auth Error: Missing GOOGLE_CLIENT_ID environment variable');
      return res.status(500).json({
        success: false,
        message: 'Server authentication configuration error: Missing Google client configuration',
        details: process.env.NODE_ENV === 'development' ? 'GOOGLE_CLIENT_ID environment variable is not set' : undefined
      });
    }
    
    if (!client) {
      console.error('Google Auth Error: Google OAuth client not initialized');
      return res.status(500).json({
        success: false,
        message: 'Server authentication configuration error: OAuth client initialization failed'
      });
    }
    
    console.log('Verifying Google ID token');
    
    try {
      // Verify the token
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
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: Invalid token',
        details: process.env.NODE_ENV === 'development' ? verificationError.message : undefined
      });
    }
  } catch (error) {
    console.error('Google auth unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
  try {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

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
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating authentication token'
    });
  }
};