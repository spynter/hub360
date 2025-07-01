// Hub main view component
// src/components/Hub/Hub.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TourCard from './TourCard';
import api from '../../services/api';
import DragDrop from '../Editor/DragDrop';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import './Hub.css';

function Hub() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourDescription, setNewTourDescription] = useState('');
  const [newTourImage, setNewTourImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [page, setPage] = useState(1);
  const cardsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await api.getTours();
        setTours(response.data); // <-- Usa response.data (array)
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los tours');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchTours();
  }, []);

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const response = await api.uploadImage(file);
      setNewTourImage(response.data.imageUrl);
    } catch (err) {
      setError('Error al subir la imagen');
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateTour = async () => {
    if (!newTourName.trim()) return;
    if (!newTourImage) {
      setError('Debes subir una imagen 360° para el tour');
      return;
    }
    try {
      setLoading(true);
      const newTour = {
        name: newTourName,
        description: newTourDescription,
        scenes: [{
          name: 'Escena 1',
          image: newTourImage,
          hotspots: []
        }]
      };
      const createdTourResponse = await api.createTour(newTour);
      setTours([...tours, createdTourResponse.data]);
      setShowCreateModal(false);
      setNewTourName('');
      setNewTourDescription('');
      setNewTourImage(null);
      setError(null);
    } catch (err) {
      setError('Error al crear el tour');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTour = async (tourId) => {
    if (!tourId) return;
    try {
      setLoading(true);
      await api.deleteTour(tourId);
      setTours(tours.filter(t => t._id !== tourId));
      setError(null);
    } catch (err) {
      setError('Error al eliminar el tour');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Paginación
  const totalPages = Math.ceil(tours.length / cardsPerPage);
  const paginatedTours = tours.slice((page - 1) * cardsPerPage, page * cardsPerPage);

  const handleChangePage = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && tours.length === 0) {
    return (
      <div className="hub-container">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Cargando tus tours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hub-container">
      <header className="hub-header">
        <div className="header-content">
          <h1>Tours 360° Manager</h1>
          <p className="subtitle">Crea y gestiona experiencias inmersivas en 360 grados</p>
        </div>
        <div className="header-actions">
          <button 
            className="create-tour-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span>+</span> Nuevo Tour
          </button>
        </div>
      </header>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">📤</div>
          <h3>Sube Imágenes</h3>
          <p>Arrastra y suelta imágenes 360° para crear tours inmersivos</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">👁️</div>
          <h3>Vista Previa</h3>
          <p>Visualiza los tours en tiempo real mientras los editas</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">⚙️</div>
          <h3>Gestiona Tours</h3>
          <p>Organiza, edita y elimina los tours de manera sencilla</p>
        </div>
      </div>

      <section className="my-tours-section">
        <div className="section-header">
          <h2>Mis Tours</h2>
          <div className="tours-count">{tours.length} {tours.length === 1 ? 'tour' : 'tours'}</div>
        </div>
        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}
        {tours.length === 0 ? (
          <div className="empty-tours">
            <div className="empty-icon">🔄</div>
            <p>No tienes ningún tour creado aún</p>
            <button 
              className="create-tour-btn primary"
              onClick={() => setShowCreateModal(true)}
            >
              Crear mi primer tour
            </button>
          </div>
        ) : (
          <>
            <div className="tours-grid">
              {paginatedTours.map(tour => (
                <TourCard key={tour._id} tour={tour} onDelete={handleDeleteTour} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 0 0' }}>
                <Stack spacing={2}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handleChangePage}
                    shape="rounded"
                    color="primary"
                  />
                </Stack>
              </div>
            )}
          </>
        )}
      </section>
      
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-modal">
            <div className="modal-header">
              <h3>Crear Nuevo Tour</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTourImage(null);
                  setError(null);
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="tour-name">Nombre del Tour*</label>
                <input
                  type="text"
                  id="tour-name"
                  value={newTourName}
                  onChange={(e) => setNewTourName(e.target.value)}
                  placeholder="Ej: Tour de la Casa Moderna"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="tour-desc">Descripción</label>
                <textarea
                  id="tour-desc"
                  value={newTourDescription}
                  onChange={(e) => setNewTourDescription(e.target.value)}
                  placeholder="Añade una breve descripción..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Imagen 360° inicial*</label>
                <DragDrop onFileUpload={handleImageUpload} />
                {uploadingImage && <div style={{marginTop: 8}}>Subiendo imagen...</div>}
                {newTourImage && (
                  <div style={{marginTop: 8}}>
                    <img src={newTourImage} alt="Preview" style={{maxWidth: '100%', maxHeight: 120, borderRadius: 6}} />
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTourImage(null);
                  setError(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-create"
                onClick={handleCreateTour}
                disabled={!newTourName.trim() || !newTourImage || loading}
              >
                {loading ? 'Creando...' : 'Crear Tour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hub;