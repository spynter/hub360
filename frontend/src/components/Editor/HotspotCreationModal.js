import React, { useState } from 'react';
import './HotspotCreationModal.css';

function getAbsoluteImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`;
  }
  return image;
}

function HotspotCreationModal({ position, tour, currentSceneIndex, onSave, onCancel }) {
  const [hotspotType, setHotspotType] = useState('access');
  const [targetSceneId, setTargetSceneId] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    website: ''
  });

  // Escenas disponibles (excluyendo la actual)
  const availableScenes = Array.isArray(tour?.scenes)
    ? tour.scenes.filter((scene, idx) => idx !== currentSceneIndex)
    : [];

  const handleTypeChange = (e) => {
    setHotspotType(e.target.value);
    setTargetSceneId('');
    setSelectedImage('');
    setTitle('');
    setDescription('');
  };

  const handleSceneSelect = (scene) => {
    setTargetSceneId(scene._id);
    setSelectedImage(scene.image);
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setSocialMedia(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const hotspotData = {
      type: hotspotType,
      pitch: position.pitch,
      yaw: position.yaw
    };

    if (hotspotType === 'access') {
      hotspotData.targetSceneId = targetSceneId;
      hotspotData.imageUrl = selectedImage;
    } else if (hotspotType === 'commerce') {
      hotspotData.title = title;
      hotspotData.description = description;
      hotspotData.socialMedia = socialMedia;
    } else if (hotspotType === 'location') {
      hotspotData.title = title;
      hotspotData.description = description;
    }

    onSave(hotspotData);
  };

  return (
    <div className="modal-overlay">
      <div className="hotspot-creation-modal dark-theme">
        <div className="modal-header">
          <h3>Crear Nuevo Hotspot</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Tipo de Hotspot</label>
            <select 
              value={hotspotType} 
              onChange={handleTypeChange}
              className="type-selector"
            >
              <option value="access">Punto de Acceso</option>
              <option value="commerce">Comercio</option>
              <option value="location">Locación</option>
            </select>
          </div>
          {/* Solo para commerce/location pedir título y descripción */}
          {(hotspotType === 'commerce' || hotspotType === 'location') && (
            <>
              <div className="form-group">
                <label>Título *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Nombre del hotspot"
                  required={hotspotType !== 'access'}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Descripción detallada"
                  rows="2"
                  className="form-textarea"
                />
              </div>
            </>
          )}
          {/* Selector de escena destino para access */}
          {hotspotType === 'access' && (
            <div className="form-group">
              <label>Seleccionar escena destino</label>
              {availableScenes.length === 0 ? (
                <div className="no-scenes">
                  <p>No hay otras escenas disponibles en este tour.</p>
                  <p>Primero crea más escenas para poder enlazarlas.</p>
                </div>
              ) : (
                <ul className="panel-image-list" style={{margin: 0, padding: 0}}>
                  {availableScenes.map((scene, idx) => (
                    <li
                      key={scene._id || idx}
                      className={`panel-image-item${targetSceneId === scene._id ? ' active' : ''}`}
                      style={{cursor: 'pointer'}}
                      onClick={() => handleSceneSelect(scene)}
                    >
                      <img
                        src={getAbsoluteImageUrl(scene.image)}
                        alt={scene.name || `Escena ${idx + 1}`}
                        style={{width: 38, height: 38, objectFit: 'cover', borderRadius: 6, background: '#23272f', border: '1px solid #23272f'}}
                        onError={e => e.target.src = 'default-image.jpg'}
                      />
                      <span>{scene.name || `Escena ${idx + 1}`}</span>
                    </li>
                  ))}
                </ul>
              )}
              {targetSceneId && (
                <div className="selected-scene-preview" style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 10}}>
                  <div>Escena seleccionada:</div>
                  <div className="preview-info">
                    {availableScenes.find(s => s._id === targetSceneId)?.name || 'Escena destino'}
                  </div>
                  {selectedImage && (
                    <img
                      src={getAbsoluteImageUrl(selectedImage)}
                      alt="Preview"
                      className="preview-image"
                      style={{marginLeft: 8, width: 38, height: 38, objectFit: 'cover', borderRadius: 6, background: '#23272f', border: '1px solid #23272f'}}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {/* Campos para comercio */}
          {hotspotType === 'commerce' && (
            <div className="social-media-fields">
              <div className="form-group">
                <label>Facebook</label>
                <input 
                  type="url" 
                  name="facebook" 
                  value={socialMedia.facebook} 
                  onChange={handleSocialMediaChange} 
                  placeholder="https://facebook.com/perfil"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input 
                  type="url" 
                  name="instagram" 
                  value={socialMedia.instagram} 
                  onChange={handleSocialMediaChange} 
                  placeholder="https://instagram.com/perfil"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Twitter</label>
                <input 
                  type="url" 
                  name="twitter" 
                  value={socialMedia.twitter} 
                  onChange={handleSocialMediaChange} 
                  placeholder="https://twitter.com/perfil"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Sitio Web</label>
                <input 
                  type="url" 
                  name="website" 
                  value={socialMedia.website} 
                  onChange={handleSocialMediaChange} 
                  placeholder="https://sitio.com"
                  className="form-input"
                />
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button 
            className="btn-save"
            onClick={handleSubmit}
            disabled={
              (hotspotType === 'access' && !targetSceneId) ||
              ((hotspotType === 'commerce' || hotspotType === 'location') && !title)
            }
          >
            Guardar Hotspot
          </button>
        </div>
      </div>
    </div>
  );
}

export default HotspotCreationModal;
