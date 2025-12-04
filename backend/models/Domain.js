const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  location: {
    type: String,
    trim: true
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
  climate: {
    type: String,
    enum: ['tropical', 'subtropical', 'temperate', 'continental', 'polar', ''],
    required: false
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
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});



module.exports = mongoose.model('Domain', domainSchema);