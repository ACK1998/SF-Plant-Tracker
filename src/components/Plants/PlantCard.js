import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Calendar, MapPin, Heart, User, History, Plus, Star, Leaf, TreePalm, Camera, QrCode, Download } from 'lucide-react';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import PlantImageUpload from './PlantImageUpload';
import { findPlantEmoji } from '../../utils/emojiMapper';

function PlantCard({ plant, onUpdate, onDelete, onAddStatus, onEdit, onStatus, onPhotos, onHistory, plotName, domainName, plantedByUser, user, canEdit, canDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [editData, setEditData] = useState(plant);
  const [statusUpdate, setStatusUpdate] = useState({
    status: 'growing',
    health: plant.health,
    growthStage: plant.growthStage,
    image: plant.image,
    notes: '',
  });

  // Update editData when plant prop changes
  useEffect(() => {
    setEditData(plant);
  }, [plant]);

  // Generate QR code when modal opens
  useEffect(() => {
    if (showQRCode) {
      const plantUrl = `${window.location.origin}/plant/${plant._id}`;
      QRCode.toDataURL(plantUrl, { width: 300, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR Code generation failed:', err));
    }
  }, [showQRCode, plant._id]);

  // Download QR code function
  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      const qrSize = 300;
      const padding = 40;
      const textHeight = 60;
      const emojiSize = 40;
      const spacing = 20;
      
      canvas.width = qrSize + (padding * 2);
      canvas.height = qrSize + (padding * 2) + textHeight + emojiSize + spacing;
      
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load QR code image
      const qrImage = new Image();
      qrImage.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);
        
        // Get plant emoji
        const plantEmoji = findPlantEmoji(plant.name, plant.category);
        
        // Draw emoji
        ctx.font = `${emojiSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const emojiY = padding + qrSize + spacing + (emojiSize / 2);
        ctx.fillText(plantEmoji, canvas.width / 2, emojiY);
        
        // Draw plant name
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const textY = emojiY + (emojiSize / 2) + 10;
        
        // Wrap text if too long
        const maxWidth = canvas.width - (padding * 2);
        const words = plant.name.split(' ');
        let line = '';
        let y = textY;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += 30;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
        
        // Convert canvas to image and download
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${plant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
      };
      
      qrImage.src = qrCodeUrl;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'good':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'fair':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'poor':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'deceased':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getGrowthStageColor = (stage) => {
    switch (stage) {
      case 'seedling':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'vegetative':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'flowering':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'fruiting':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'mature':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const handleSave = () => {
    console.log('Saving plant data:', editData);
    console.log('Original plant data:', plant);
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(plant);
    setIsEditing(false);
  };

  // eslint-disable-next-line no-unused-vars -- reserved for inline edit
  const _handleEdit = () => {
    console.log('Starting edit for plant:', plant);
    console.log('Setting editData to:', plant);
    setEditData(plant);
    setIsEditing(true);
  };

  const handleStatusUpdate = () => {
    onAddStatus(plant._id, statusUpdate);
    setShowStatusUpdate(false);
    setStatusUpdate({
      status: 'growing',
      health: plant.health,
      growthStage: plant.growthStage,
      image: plant.image,
      notes: '',
    });
  };

  // Safe date parsing with fallback
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const plantedDate = parseDate(plant.plantedDate);
  const _lastWateredDate = parseDate(plant.lastWatered); // eslint-disable-line no-unused-vars -- reserved for display
  




  // Use passed permission props, fallback to old logic if not provided
  const hasEditPermission = canEdit !== undefined ? canEdit : (user.role === 'super_admin' || 
                  (user.role === 'org_admin' && plant.organizationId === user.organizationId) ||
                  (user.role === 'domain_admin' && plant.organizationId === user.organizationId) ||
                  (user.role === 'application_user' && plant.organizationId === user.organizationId));
  
  const hasDeletePermission = canDelete !== undefined ? canDelete : hasEditPermission;

  return (
    <div className="card hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-4xl">{findPlantEmoji(plant.name, plant.category)}</div>
          {plant.isRare && (
            <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Rare</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onHistory(plant)}
            className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="View History"
          >
            <History size={16} />
          </button>
          <button
            onClick={() => onPhotos(plant)}
            className="text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            title="Upload Photos"
          >
            <Camera size={16} />
          </button>
          
          {/* QR Code Button - Always visible */}
          <button
            onClick={() => setShowQRCode(true)}
            className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Generate QR Code"
          >
            <QrCode size={16} />
          </button>
          
          {hasEditPermission && (
            <>
              <button
                onClick={() => onStatus(plant)}
                className="text-gray-400 dark:text-gray-500 hover:text-plant-green-600 dark:hover:text-plant-green-400 transition-colors"
                title="Add Status Update"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => onEdit(plant)}
                className="text-gray-400 dark:text-gray-500 hover:text-plant-green-600 dark:hover:text-plant-green-400 transition-colors"
                title="Edit Plant"
              >
                <Edit size={16} />
              </button>
              {hasDeletePermission && (
                <button
                  onClick={() => onDelete(plant)}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete Plant"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{plant.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{plant.variety}</p>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin size={14} />
          <span><strong>{plotName}</strong> • {domainName}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <User size={14} />
          <span>Planted by: {plantedByUser || 'Unknown'}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={14} />
          <span>Planted: {format(plantedDate, 'MMM dd, yyyy')}</span>
        </div>



        <div className="flex space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(plant.health)}`}>
            <Heart size={12} className="mr-1" />
            {plant.health}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthStageColor(plant.growthStage)}`}>
            {plant.growthStage}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            plant.category === 'tree' 
              ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
              : plant.category === 'fruit'
              ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
              : plant.category === 'vegetable'
              ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
              : plant.category === 'herb'
              ? 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20'
              : plant.category === 'grain'
              ? 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20'
              : plant.category === 'legume'
              ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
              : 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700'
          }`}>
            {plant.category === 'tree' ? <TreePalm size={12} className="mr-1" /> : <Leaf size={12} className="mr-1" />}
            {plant.category === 'tree' ? 'Tree' : 
             plant.category === 'fruit' ? 'Fruit' :
             plant.category === 'vegetable' ? 'Vegetable' :
             plant.category === 'herb' ? 'Herb' :
             plant.category === 'grain' ? 'Grain' :
             plant.category === 'legume' ? 'Legume' : 'Plant'}
          </span>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {(plant.statusHistory || []).length} status updates
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit {plant.category === 'tree' ? 'Tree' : 
                plant.category === 'fruit' ? 'Fruit' :
                plant.category === 'vegetable' ? 'Vegetable' :
                plant.category === 'herb' ? 'Herb' :
                plant.category === 'grain' ? 'Grain' :
                plant.category === 'legume' ? 'Legume' : 'Plant'}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Variety
                  </label>
                  <input
                    type="text"
                    value={editData.variety}
                    disabled
                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editData.category}
                    disabled
                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  >
                    <option key="plant" value="plant">Plant</option>
                    <option key="tree" value="tree">Tree</option>
                    <option key="vegetable" value="vegetable">Vegetable</option>
                    <option key="herb" value="herb">Herb</option>
                    <option key="fruit" value="fruit">Fruit</option>
                    <option key="grain" value="grain">Grain</option>
                    <option key="legume" value="legume">Legume</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Health
                  </label>
                  <select
                    value={editData.health}
                    onChange={(e) => setEditData({...editData, health: e.target.value})}
                    className="input-field"
                  >
                    <option key="excellent" value="excellent">Excellent</option>
                    <option key="good" value="good">Good</option>
                    <option key="fair" value="fair">Fair</option>
                    <option key="poor" value="poor">Poor</option>
                    <option key="deceased" value="deceased">Deceased</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Growth Stage
                  </label>
                  <select
                    value={editData.growthStage}
                    onChange={(e) => setEditData({...editData, growthStage: e.target.value})}
                    className="input-field"
                  >
                    <option key="seedling" value="seedling">Seedling</option>
                    <option key="vegetative" value="vegetative">Vegetative</option>
                    <option key="flowering" value="flowering">Flowering</option>
                    <option key="fruiting" value="fruiting">Fruiting</option>
                    <option key="mature" value="mature">Mature</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="modal-overlay" onClick={() => setShowStatusUpdate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Status Update</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                    className="input-field"
                  >
                    <option key="planted" value="planted">Planted</option>
                    <option key="growing" value="growing">Growing</option>
                    <option key="mature" value="mature">Mature</option>
                    <option key="harvested" value="harvested">Harvested</option>
                    <option key="dormant" value="dormant">Dormant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Health
                  </label>
                  <select
                    value={statusUpdate.health}
                    onChange={(e) => setStatusUpdate({...statusUpdate, health: e.target.value})}
                    className="input-field"
                  >
                    <option key="excellent" value="excellent">Excellent</option>
                    <option key="good" value="good">Good</option>
                    <option key="fair" value="fair">Fair</option>
                    <option key="poor" value="poor">Poor</option>
                    <option key="deceased" value="deceased">Deceased</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Growth Stage
                  </label>
                  <select
                    value={statusUpdate.growthStage}
                    onChange={(e) => setStatusUpdate({...statusUpdate, growthStage: e.target.value})}
                    className="input-field"
                  >
                    <option key="seedling" value="seedling">Seedling</option>
                    <option key="vegetative" value="vegetative">Vegetative</option>
                    <option key="flowering" value="flowering">Flowering</option>
                    <option key="fruiting" value="fruiting">Fruiting</option>
                    <option key="mature" value="mature">Mature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image (Emoji or URL)
                  </label>
                  <input
                    type="text"
                    value={statusUpdate.image}
                    onChange={(e) => setStatusUpdate({...statusUpdate, image: e.target.value})}
                    className="input-field"
                    placeholder="🌱 or https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter an emoji (🌱) or paste an image URL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                    className="input-field"
                    rows={3}
                    placeholder="Add notes about the plant's current status..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowStatusUpdate(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleStatusUpdate} className="btn-primary">
                  Add Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Plant History</h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {(plant.statusHistory || []).map((update, index) => (
                  <div key={update.id} className="border-l-4 border-plant-green-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {update.image && update.image.startsWith('http') ? (
                          <img 
                            src={update.image} 
                            alt="Plant status update" 
                            className="w-8 h-8 rounded-full object-cover border-2 border-plant-green-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span className="text-2xl" style={{ display: update.image && update.image.startsWith('http') ? 'none' : 'inline' }}>
                          {update.image && !update.image.startsWith('http') ? update.image : '🌱'}
                        </span>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            {format(parseDate(update.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(update.health)}`}>
                          {update.health}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthStageColor(update.growthStage)}`}>
                          {update.growthStage}
                        </span>
                      </div>
                    </div>
                    {update.notes && !update.notes.startsWith('http') && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{update.notes}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={() => setShowHistory(false)} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="modal-overlay" onClick={() => setShowImageUpload(false)}>
          <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <PlantImageUpload
                plant={plant}
                onImageUpload={(image) => {
                  console.log('Image uploaded:', image);
                  setShowImageUpload(false);
                }}
                onImageDelete={(imageId) => {
                  console.log('Image deleted:', imageId);
                }}
                onClose={() => setShowImageUpload(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                QR Code for {plant.name}
              </h3>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <div className="text-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-2" />
                  ) : (
                    <div className="text-6xl mb-2">📱</div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    QR Code for public plant view
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 mb-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                      {window.location.origin}/plant/{plant._id}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Anyone can scan this QR code to view plant information without logging in
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={downloadQRCode}
                  disabled={!qrCodeUrl}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/plant/${plant._id}`);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlantCard; 