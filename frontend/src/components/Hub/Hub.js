// Hub main view component
// src/components/Hub/Hub.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TourCard from './TourCard';
import api from '../../services/api';
import DragDrop from '../Editor/DragDrop';
import './Hub.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function LocationSelector({ value, onChange }) {
  // Componente para seleccionar localización en un mapa pequeño
  const defaultPosition = value || [20, -75];
  function LocationMarker() {
    useMapEvents({
      click(e) {
        onChange([e.latlng.lat, e.latlng.lng]);
      }
    });
    return value ? <Marker position={value} /> : null;
  }
  return (
    <MapContainer center={defaultPosition} zoom={6} style={{ height: 180, width: '100%', marginBottom: 12 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
    </MapContainer>
  );
}

function Hub() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourDescription, setNewTourDescription] = useState('');
  const [newTourImage, setNewTourImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newTourLocation, setNewTourLocation] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    tourId: ''
  });
  const [productUploading, setProductUploading] = useState(false);
  const [productError, setProductError] = useState(null);
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
    if (!newTourLocation) {
      setError('Debes seleccionar la localización en el mapa');
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
        }],
        localizacion: { lat: newTourLocation[0], lng: newTourLocation[1] }
      };
      const createdTourResponse = await api.createTour(newTour);
      setTours([...tours, createdTourResponse.data]);
      setShowCreateModal(false);
      setNewTourName('');
      setNewTourDescription('');
      setNewTourImage(null);
      setNewTourLocation(null);
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
      await api.deleteTour(tourId);
      setTours(tours.filter(t => t._id !== tourId));
    } catch (err) {
      setError('Error al eliminar el tour');
      console.error(err);
    }
  };

  // Subida de imagen para producto
  const handleProductImageUpload = async (file) => {
    setProductUploading(true);
    try {
      const response = await api.uploadImage(file);
      setProductForm(prev => ({ ...prev, image: response.data.imageUrl }));
    } catch (err) {
      setProductError('Error al subir la imagen');
    } finally {
      setProductUploading(false);
    }
  };

  // Guardar producto
  const handleCreateProduct = async () => {
    setProductError(null);
    if (!productForm.name.trim() || !productForm.price || !productForm.image || !productForm.tourId) {
      setProductError('Todos los campos son obligatorios');
      return;
    }
    try {
      setProductUploading(true);
      await api.createProduct({
        ...productForm,
        price: Number(productForm.price)
      });
      setShowProductModal(false);
      setProductForm({ name: '', description: '', price: '', image: '', tourId: '' });
    } catch (err) {
      setProductError('Error al crear el producto');
    } finally {
      setProductUploading(false);
    }
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
            className="go-landing-btn"
            style={{ marginRight: '14px', background: '#23272f', color: '#38bdf8', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
            onClick={() => navigate('/')}
          >
            🏠 Ir a la Landing
          </button>
          <button 
            className="create-tour-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span>+</span> Nuevo Tour
          </button>
          <button
            className="create-tour-btn"
            style={{ marginLeft: '14px' }}
            onClick={() => setShowProductModal(true)}
          >
            <span>+</span> Añadir Producto
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
          <div className="tours-grid">
            {tours.map(tour => (
              <TourCard key={tour._id} tour={tour} onDelete={handleDeleteTour} />
            ))}
          </div>
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
                  setNewTourLocation(null);
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

              {/* Selección de localización */}
              <div className="form-group">
                <label>Selecciona la localización en el mapa*</label>
                <LocationSelector value={newTourLocation} onChange={setNewTourLocation} />
                {newTourLocation && (
                  <div style={{ fontSize: 13, color: '#38bdf8' }}>
                    Lat: {newTourLocation[0].toFixed(5)}, Lng: {newTourLocation[1].toFixed(5)}
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
                  setNewTourLocation(null);
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

      {/* Modal para crear producto */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="create-modal">
            <div className="modal-header">
              <h3>Añadir Producto a Tienda</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowProductModal(false);
                  setProductForm({ name: '', description: '', price: '', image: '', tourId: '' });
                  setProductError(null);
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Imagen del Producto*</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) handleProductImageUpload(e.target.files[0]);
                  }}
                />
                {productUploading && <div style={{marginTop: 8}}>Subiendo imagen...</div>}
                {productForm.image && (
                  <div style={{marginTop: 8}}>
                    <img src={productForm.image} alt="Preview" style={{maxWidth: '100%', maxHeight: 120, borderRadius: 6}} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Nombre del Producto*</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Camiseta 360°"
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={productForm.description}
                  onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del producto"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Precio*</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Selecciona la Tienda/Tour*</label>
                <select
                  value={productForm.tourId}
                  onChange={e => setProductForm(prev => ({ ...prev, tourId: e.target.value }))}
                  required
                >
                  <option value="">Selecciona un tour</option>
                  {tours.map(tour => (
                    <option key={tour._id} value={tour._id}>{tour.name}</option>
                  ))}
                </select>
              </div>
              {productError && (
                <div style={{ color: '#f87171', marginBottom: 10 }}>{productError}</div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowProductModal(false);
                  setProductForm({ name: '', description: '', price: '', image: '', tourId: '' });
                  setProductError(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-create"
                onClick={handleCreateProduct}
                disabled={
                  !productForm.name.trim() ||
                  !productForm.price ||
                  !productForm.image ||
                  !productForm.tourId ||
                  productUploading
                }
              >
                {productUploading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hub;