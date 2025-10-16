const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'org_admin', 'domain_admin', 'application_user'],
    default: 'application_user'
  },
  phone: {
    type: String,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      // Only require organizationId for non-super-admin users
      return this.role !== 'super_admin';
    },
    default: undefined // This ensures the required validation works properly
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: function() {
      // Require domainId for domain_admin and application_user
      return this.role === 'domain_admin' || this.role === 'application_user';
    },
    default: undefined
  },
  plotIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Plot',
    required: function() {
      // Require plotIds for application_user only
      return this.role === 'application_user';
    },
    default: function() {
      return this.role === 'application_user' ? [] : undefined;
    },
    validate: {
      validator: function(plotIds) {
        // Only validate if role is set and is application_user
        if (this.role && this.role === 'application_user') {
          return plotIds && plotIds.length > 0;
        }
        // For other roles or when role is not set, plotIds can be empty or undefined
        return true;
      },
      message: 'At least one plot must be assigned for application users'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 