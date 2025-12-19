const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  size: {
    type: Number, // in square feet
    default: 0
  },
  soilType: {
    type: String,
    enum: ['clay', 'silt', 'loam', 'sandy', 'chalky', 'peaty', ''],
    required: false
  },
  irrigationType: {
    type: String,
    enum: ['drip', 'sprinkler', 'flood', 'manual', 'none', ''],
    required: false
  },
  sunExposure: {
    type: String,
    enum: ['full', 'partial', 'shade', ''],
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  latitude: {
    type: Number,
    required: false,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: false,
    min: -180,
    max: 180
  },
  ownerName: {
    type: String,
    trim: true,
    required: false
  },
  ownerMobile: {
    type: String,
    trim: true,
    required: false
  },
  registrationDate: {
    type: Date,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});



module.exports = mongoose.model('Plot', plotSchema);