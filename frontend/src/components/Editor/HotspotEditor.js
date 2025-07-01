import React, { useState, useEffect } from 'react';
import './HotspotEditor.css';

function HotspotEditor({ hotspot, scenes, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'info',
    pitch: 0,
    yaw: 0,
    text: '',
    url: '',
    targetSceneId: ''
  });

  // Inicializar con datos del hotspot si existe
  useEffect(() => {
    if (hotspot && Object.keys(hotspot).length > 0) {
      setFormData({
        type: hotspot.type || 'info',
        pitch: hotspot.pitch || 0,
        yaw: hotspot.yaw || 0,
        text: hotspot.text || '',
        url: hotspot.url || '',
        targetSceneId: hotspot.targetSceneId || ''
      });
    }
  }, [hotspot]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...hotspot,
      ...formData
    });
  };

  return (
    <div className="hotspot-editor-modal">
      <div className="modal-content">
        <h3>{hotspot._id ? 'Editar Hotspot' : 'Crear Nuevo Hotspot'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de Hotspot</label>
            <select 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
              required
            >
              <option value="info">Información</option>
              <option value="link">Enlace</option>
              <option value="scene">Cambiar Escena</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Pitch</label>
              <input 
                type="number" 
                name="pitch" 
                value={formData.pitch} 
                onChange={handleChange}
                min="-180"
                max="180"
                step="0.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Yaw</label>
              <input 
                type="number" 
                name="yaw" 
                value={formData.yaw} 
                onChange={handleChange}
                min="-180"
                max="180"
                step="0.1"
                required
              />
            </div>
          </div>
          
          {formData.type === 'info' && (
            <div className="form-group">
              <label>Texto Informativo</label>
              <textarea 
                name="text" 
                value={formData.text} 
                onChange={handleChange}
                rows="3"
                required
              />
            </div>
          )}
          
          {formData.type === 'link' && (
            <div className="form-group">
              <label>URL Destino</label>
              <input 
                type="url" 
                name="url" 
                value={formData.url} 
                onChange={handleChange}
                placeholder="https://ejemplo.com"
                required
              />
            </div>
          )}
          
          {formData.type === 'scene' && scenes.length > 1 && (
            <div className="form-group">
              <label>Escena Destino</label>
              <select 
                name="targetSceneId" 
                value={formData.targetSceneId} 
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una escena</option>
                {scenes.map((scene, index) => (
                  <option key={scene._id || index} value={scene._id || index}>
                    {scene.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-save"
            >
              Guardar Hotspot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HotspotEditor;