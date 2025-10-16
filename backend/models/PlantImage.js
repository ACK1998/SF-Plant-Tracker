const mongoose = require('mongoose');

const plantImageSchema = new mongoose.Schema({
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true
  },
  
  month: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate YYYY-MM format
        return /^\d{4}-\d{2}$/.test(v);
      },
      message: 'Month must be in YYYY-MM format'
    }
  },
  
  imageUrl: {
    type: String,
    required: true
  },
  
  imageKey: {
    type: String,
    required: true,
    unique: true
  },
  
  fileName: {
    type: String,
    required: true
  },
  
  fileSize: {
    type: Number,
    required: true
  },
  
  mimeType: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v.startsWith('image/');
      },
      message: 'File must be an image'
    }
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure only one image per plant per month
plantImageSchema.index({ plantId: 1, month: 1 }, { unique: true });

// Virtual for formatted month name
plantImageSchema.virtual('monthName').get(function() {
  const [year, month] = this.month.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// Virtual for file size in MB
plantImageSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(1);
});

// Static method to get missing months for a plant
plantImageSchema.statics.getMissingMonths = function(plantId, startDate, endDate = new Date(), plant = null) {
  return this.find({ plantId })
    .then(images => {
      const existingMonths = images.map(img => img.month);
      
      // If plant has a main image URL, consider it as having an image for the planted month
      if (plant && plant.image && plant.image.startsWith('http')) {
        const plantedMonth = new Date(plant.plantedDate).toISOString().slice(0, 7);
        if (!existingMonths.includes(plantedMonth)) {
          existingMonths.push(plantedMonth);
        }
      }
      
      const missingMonths = [];
      
      let current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        const monthString = current.toISOString().slice(0, 7);
        if (!existingMonths.includes(monthString)) {
          missingMonths.push(monthString);
        }
        current.setMonth(current.getMonth() + 1);
      }
      
      return missingMonths;
    });
};

// Instance method to get image metadata
plantImageSchema.methods.getMetadata = function() {
  return {
    id: this._id,
    plantId: this.plantId,
    month: this.month,
    monthName: this.monthName,
    imageUrl: this.imageUrl,
    fileName: this.fileName,
    fileSize: this.fileSize,
    fileSizeMB: this.fileSizeMB,
    mimeType: this.mimeType,
    description: this.description,
    uploadedBy: this.uploadedBy,
    uploadedAt: this.createdAt,
    isActive: this.isActive
  };
};

// Pre-save middleware to validate file size
plantImageSchema.pre('save', function(next) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (this.fileSize > maxSize) {
    return next(new Error('File size must be less than 5MB'));
  }
  next();
});

// Pre-save middleware to generate unique image key
plantImageSchema.pre('save', function(next) {
  if (!this.imageKey) {
    this.imageKey = `plant-${this.plantId}-${this.month}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('PlantImage', plantImageSchema); 