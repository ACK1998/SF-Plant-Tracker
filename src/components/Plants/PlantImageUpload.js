import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Calendar, 
  Image as ImageIcon, 
  Download,
  Trash2,
  Eye,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const PlantImageUpload = ({ plant, onImageUpload, onImageDelete, onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadMonth, setUploadMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const [plantImages, setPlantImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [missingMonths, setMissingMonths] = useState([]);
  
  // Dual upload state
  const [imageInputType, setImageInputType] = useState('file'); // 'file' or 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState(null);

  // Load plant images from API
  const loadPlantImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getPlantImages(plant._id);
      if (response.success) {
        let images = response.data;
        
        // If plant has a main image URL, add it as the first image
        if (plant.image && plant.image.startsWith('http')) {
          // Use the planted date to determine the month for the main image
          const plantedMonth = new Date(plant.plantedDate).toISOString().slice(0, 7);
          const mainImage = {
            id: 'main-image',
            plantId: plant._id,
            month: plantedMonth, // Use the actual planted month instead of 'main'
            imageUrl: plant.image,
            imageKey: 'main-image',
            fileName: 'Main Plant Image',
            fileSize: 0,
            mimeType: 'image/jpeg',
            description: 'Main plant image from creation',
            uploadedBy: plant.plantedBy,
            isActive: true,
            createdAt: plant.createdAt,
            uploadedAt: plant.createdAt,
            url: plant.image // Add url field for consistency
          };
          images = [mainImage, ...images];
        }
        
        setPlantImages(images);
      }
    } catch (error) {
      console.error('Failed to load plant images:', error);
      if (error.message.includes('401') || error.message.includes('authentication')) {
        setMessage({ type: 'error', text: 'Please log in again to view images' });
      }
    } finally {
      setLoading(false);
    }
  }, [plant._id, plant.image, plant.plantedBy, plant.createdAt, plant.plantedDate]);

  // Load missing months from API
  const loadMissingMonths = useCallback(async () => {
    try {
      const response = await api.getMissingMonths(plant._id);
      if (response.success) {
        setMissingMonths(response.data);
      }
    } catch (error) {
      console.error('Failed to load missing months:', error);
    }
  }, [plant._id]);

  // Load plant images and missing months from API
  useEffect(() => {
    console.log('PlantImageUpload - Plant object:', plant);
    loadPlantImages();
    loadMissingMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant._id, plant.image, plant.plantedBy, plant.createdAt, plant.plantedDate, loadPlantImages, loadMissingMonths]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setSelectedFile(file);
      setMessage({ type: '', text: '' }); // Clear any previous messages
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // URL handling functions
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setMessage({ type: '', text: '' });

    // Validate URL format
    if (url && !isValidImageUrl(url)) {
      setMessage({ type: 'error', text: 'Please enter a valid image URL' });
      setUrlPreview(null);
      return;
    }

    // Set preview if URL is valid
    if (url && isValidImageUrl(url)) {
      setUrlPreview(url);
    } else if (!url) {
      setUrlPreview(null);
    }
  };

  const isValidImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      
      if (!validProtocols.includes(urlObj.protocol)) {
        return false;
      }

      // Check if URL ends with image extension or contains image-related paths
      const pathname = urlObj.pathname.toLowerCase();
      const hasImageExtension = validExtensions.some(ext => pathname.endsWith(ext));
      const hasImagePath = pathname.includes('/image') || pathname.includes('/img') || pathname.includes('/photo');
      
      // Check for common image hosting and sharing services
      const hostname = urlObj.hostname.toLowerCase();
      const isImageHostingService = [
        'unsplash.com',
        'imgur.com', 
        'cloudinary.com',
        'photos.app.goo.gl', // Google Photos sharing links
        'share.google.com', // Google Share links
        'drive.google.com', // Google Drive images
        'dropbox.com',
        'flickr.com',
        'instagram.com',
        'facebook.com',
        'twitter.com',
        'pinterest.com',
        'i.redd.it', // Reddit images
        'i.imgur.com' // Direct Imgur images
      ].some(service => hostname.includes(service));
      
      return hasImageExtension || hasImagePath || isImageHostingService;
    } catch {
      return false;
    }
  };

  const handleImageInputTypeChange = (type) => {
    setImageInputType(type);
    // Clear any existing data when switching types
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUrl('');
    setUrlPreview(null);
    setMessage({ type: '', text: '' });
  };

  const handleUpload = async () => {
    if (imageInputType === 'file') {
      if (!selectedFile || !uploadMonth) {
        setMessage({ type: 'error', text: 'Please select a file and month' });
        return;
      }
    } else {
      if (!imageUrl || !uploadMonth) {
        setMessage({ type: 'error', text: 'Please enter an image URL and select month' });
        return;
      }
    }

    if (!plant._id) {
      setMessage({ type: 'error', text: 'Plant ID is missing. Please refresh the page.' });
      return;
    }

    setIsUploading(true);
    setMessage({ type: '', text: '' }); // Clear previous messages

    try {
      // Check if image already exists for this month
      const existingImage = plantImages.find(img => img.month === uploadMonth);
      if (existingImage) {
        const confirmReplace = window.confirm(
          `An image already exists for ${uploadMonth}. Do you want to replace it?`
        );
        if (!confirmReplace) {
          setIsUploading(false);
          return;
        }
      }

      let response;

      if (imageInputType === 'file') {
        // File upload
        response = await api.uploadPlantImage(
          plant._id,
          uploadMonth,
          selectedFile,
          `Plant photo for ${uploadMonth}`
        );
      } else {
        // URL upload - we'll need to create a new API endpoint for this
        response = await api.uploadPlantImageUrl(
          plant._id,
          uploadMonth,
          imageUrl,
          `Plant photo for ${uploadMonth}`
        );
      }

      if (response.success) {
        // Reload images from API
        await loadPlantImages();

        // Call parent callback
        if (onImageUpload) {
          onImageUpload(response.data);
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageUrl('');
      setUrlPreview(null);
      setShowUploadModal(false);
      
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ 
        type: 'error', 
        text: error.message === 'HTTP error! status: 401' 
          ? 'Please log in again to upload images' 
          : 'Failed to upload image. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this image?');
    if (!confirmDelete) return;

    try {
      // Delete from API
      const response = await api.deletePlantImage(imageId);
      
      if (response.success) {
        // Reload images from API
        await loadPlantImages();
        
        if (onImageDelete) {
          onImageDelete(imageId);
        }

        setMessage({ type: 'success', text: 'Image deleted successfully!' });
        
        // Clear success message after 5 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to delete image. Please try again.' 
      });
    }
  };

  const handleDownloadImage = (image) => {
    const link = document.createElement('a');
    link.href = getImageUrl(image.url);
    link.download = `${plant.name}_${image.month}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMonthName = (monthString, isMainImage = false) => {
    if (!monthString) {
      return 'Unknown';
    }
    
    // If this is the main image, show it as "Main Image" regardless of the month
    if (isMainImage) {
      return 'Main Image';
    }
    
    try {
      const [year, month] = monthString.split('-');
      if (!year || !month) {
        return monthString; // Return original if parsing fails
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1);
      if (isNaN(date.getTime())) {
        return monthString; // Return original if date is invalid
      }
      
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (error) {
      console.error('Error parsing month string:', monthString, error);
      return monthString; // Return original if any error occurs
    }
  };

  const getMissingMonths = () => {
    return missingMonths;
  };

  // Helper function to construct proper image URL
  const getImageUrl = (imageUrl) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    // Remove /api from the base URL since static files are served at root level
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}${imageUrl}`;
  };

  return (
    <div className="space-y-6">
      {/* Message Display - Top Right Corner */}
      {message.text && (
        <div className={`fixed top-4 right-4 z-[var(--z-notification)] p-4 rounded-lg border shadow-lg max-w-sm ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span className="text-sm font-medium">{message.text}</span>
            <button 
              onClick={() => setMessage({ type: '', text: '' })}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Plant Photo Gallery
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your plant's growth with monthly photos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Camera size={16} />
            Upload Photo
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Close Gallery"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Missing Months Alert */}
      {getMissingMonths().length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Missing Monthly Photos
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Photos missing for: {getMissingMonths().map(month => getMonthName(month)).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading images...</p>
        </div>
      ) : plantImages.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No photos uploaded yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start tracking your plant's growth by uploading monthly photos
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <Plus size={16} />
            Upload First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 4 gap-6">
          {plantImages
            .sort((a, b) => {
              // Handle main image first, then sort by date
              if (a.id === 'main-image') return -1;
              if (b.id === 'main-image') return 1;
              return new Date(b.uploadedAt) - new Date(a.uploadedAt);
            })
            .map((image) => {
              // Check if it's a GCS URL (should be rendered as image) or external URL (show placeholder)
              const isGCSUrl = image.url && image.url.includes('storage.googleapis.com');
              const isExternalUrl = image.url && image.url.startsWith('http') && !isGCSUrl;
              const imageSrc = isGCSUrl || !image.url?.startsWith('http') 
                ? (image.url?.startsWith('http') ? image.url : `${getImageUrl(image.url)}?t=${Date.now()}`)
                : image.url;
              
              return (
                <div key={image.id} className="card group">
                  <div className="relative">
                    {isExternalUrl ? (
                      // External URL Image (like Google Photos) - render as clickable link
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800 dark:hover:to-blue-700 transition-all duration-200"
                      >
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {image.id === 'main-image' ? 'Main Plant Image' : getMonthName(image.month)}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Click to view
                          </p>
                        </div>
                      </a>
                    ) : (
                      // GCS URL or local file - render as image
                      <img
                        src={imageSrc}
                        alt={`${plant.name} - ${getMonthName(image.month, image.id === 'main-image')}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                        onError={(e) => {
                          console.error('Image failed to load:', e.target.src);
                          // Show fallback placeholder on error
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', image.url);
                        }}
                      />
                    )}
                    
                    {/* Fallback placeholder (hidden by default, shown on error) */}
                    {!isExternalUrl && (
                      <div className="fallback-icon absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {image.id === 'main-image' ? 'Main Plant Image' : getMonthName(image.month)}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Image unavailable
                          </p>
                        </div>
                      </div>
                    )}
                  
                    {/* Overlay Actions - only show for actual images (not external URLs) */}
                    {!isExternalUrl && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                          <button
                            onClick={() => setSelectedImage(image)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="View Full Size"
                          >
                            <Eye size={16} className="text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDownloadImage(image)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="Download"
                          >
                            <Download size={16} className="text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {getMonthName(image.month, image.id === 'main-image')}
                    </h4>
                      {isExternalUrl && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Link
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {image.id === 'main-image' 
                        ? getMonthName(image.month, false) // Show month and year for main image
                        : (image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString() : 'Created')
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isExternalUrl ? 'External Link' : image.size}
                    </p>
                    {isExternalUrl && (
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1 block truncate"
                      >
                        {image.url}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Upload Plant Photo
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month *
                </label>
                <select
                  value={uploadMonth}
                  onChange={(e) => setUploadMonth(e.target.value)}
                  className="input-field w-full"
                >
                  {getMissingMonths().map(month => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                  <option value={new Date().toISOString().slice(0, 7)}>
                    {getMonthName(new Date().toISOString().slice(0, 7))}
                  </option>
                </select>
              </div>

              {/* Input Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Photo Source *
                </label>
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => handleImageInputTypeChange('file')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      imageInputType === 'file'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Upload className="h-4 w-4 inline mr-2" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageInputTypeChange('url')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      imageInputType === 'url'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 inline mr-2" />
                    Image URL
                  </button>
                </div>
              </div>

              {/* File Upload */}
              {imageInputType === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Photo *
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 dark:hover:border-green-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg mx-auto"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedFile?.name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to select or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                /* URL Input */
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      className="input-field pl-10"
                      placeholder="https://share.google.com/... or https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Supports: Direct image URLs, Google Share, Google Photos, Google Drive, Imgur, Unsplash, and other image hosting services
                  </div>
                  
                  {urlPreview && (
                    <div className="mt-3">
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <img
                              src={urlPreview}
                              alt="URL preview"
                              className="h-16 w-16 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                setMessage({ type: 'error', text: 'Failed to load image from URL' });
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {imageUrl.includes('photos.app.goo.gl') || imageUrl.includes('share.google.com') ? 'Google Photos Link' : 'Image URL'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {imageUrl}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary flex-1"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={(imageInputType === 'file' ? !selectedFile : !imageUrl) || isUploading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="modal-overlay">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="modal-content">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {plant.name} - {getMonthName(selectedImage.month, selectedImage.id === 'main-image')}
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4">
                {(() => {
                  const isGCSUrl = selectedImage.url && selectedImage.url.includes('storage.googleapis.com');
                  const isExternalUrl = selectedImage.url && selectedImage.url.startsWith('http') && !isGCSUrl;
                  const imageSrc = isGCSUrl 
                    ? selectedImage.url 
                    : (selectedImage.url?.startsWith('http') ? selectedImage.url : `${getImageUrl(selectedImage.url)}?t=${Date.now()}`);
                  
                  if (isExternalUrl) {
                    // External URL Image (like Google Photos) - show link information
                    return (
                      <div className="text-center py-12">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg p-8 mb-6">
                          <ImageIcon className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                            External Image Link
                          </h4>
                          <p className="text-blue-600 dark:text-blue-400 mb-4">
                            This image is hosted externally
                          </p>
                          <a
                            href={selectedImage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Open Image Link
                          </a>
                        </div>
                        <div className="text-left space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>URL:</strong> 
                            <a
                              href={selectedImage.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-2 break-all"
                            >
                              {selectedImage.url}
                            </a>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Type:</strong> External Link
                          </p>
                          {selectedImage.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Description:</strong> {selectedImage.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // GCS URL or local file - show image
                    return (
                      <>
                        <img
                          src={imageSrc}
                          alt={`${plant.name} - ${getMonthName(selectedImage.month, selectedImage.id === 'main-image')}`}
                          className="w-full h-auto rounded-lg"
                          onError={(e) => {
                            console.error('Full-screen image failed to load:', e.target.src);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Full-screen image loaded successfully:', selectedImage.url);
                          }}
                        />
                    
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Uploaded:</strong> {selectedImage.uploadedAt ? new Date(selectedImage.uploadedAt).toLocaleString() : 'Created'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>File Size:</strong> {selectedImage.size || 'Unknown'}
                      </p>
                      {isGCSUrl && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>URL:</strong> 
                          <a
                            href={selectedImage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-2 break-all"
                          >
                            {selectedImage.url}
                          </a>
                        </p>
                      )}
                      {selectedImage.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Description:</strong> {selectedImage.description}
                        </p>
                      )}
                    </div>
                  </>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantImageUpload; 