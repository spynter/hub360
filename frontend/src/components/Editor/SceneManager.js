// SceneManager component (Three.js scene management)
import React from 'react';
import './SceneManager.css';

function getAbsoluteImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`;
  }
  return image;
}

function SceneManager({ scenes, currentIndex, onSelectScene }) {
  return (
    <div className="scene-manager">
      <div className="scene-list">
        {scenes.map((scene, index) => (
          <div 
            key={scene._id || index}
            className={`scene-thumb ${index === currentIndex ? 'active' : ''}`}
            onClick={() => onSelectScene(index)}
          >
            <div className="scene-image">
              {scene.image ? (
                <img src={getAbsoluteImageUrl(scene.image)} alt={scene.name} />
              ) : (
                <div className="image-placeholder">🖼️</div>
              )}
            </div>
            <div className="scene-name">{scene.name}</div>
            <div className="scene-hotspots">
              {scene.hotspots?.length || 0} hotspots
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SceneManager;