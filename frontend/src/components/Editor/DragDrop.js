import React, { useCallback, useRef } from 'react';

function DragDrop({ onFileUpload }) {
  const fileInputRef = useRef();

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      className="drag-drop-area"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="drag-drop-content">
        <i className="upload-icon">📁</i>
        <p>Arrastra y suelta imágenes 360° aquí</p>
        <p>o <button type="button" onClick={handleButtonClick}>selecciona un archivo</button></p>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default DragDrop;