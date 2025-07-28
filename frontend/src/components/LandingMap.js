import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import './LandingMap.css';

// Fix default icon issue with Leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ciudadGuayana = [8.3667, -62.6500];

function LandingMap() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef();
  const [logoSpin, setLogoSpin] = useState(false);

  // Polling para refrescar los tours cada 2 segundos
  useEffect(() => {
    let isMounted = true;
    const fetchTours = async () => {
      try {
        const response = await api.getTours();
        if (isMounted) {
          setTours(response.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Error al cargar los tours');
          setLoading(false);
        }
      }
    };
    fetchTours();
    intervalRef.current = setInterval(fetchTours, 2000);
    return () => {
      isMounted = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  const handleMarkerClick = (tour) => {
    setSelectedTour(tour);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedTour(null);
  };

  const handleViewTour = () => {
    if (selectedTour) {
      navigate(`/viewer/${selectedTour._id}`);
    }
  };

  const handleEditTour = () => {
    if (selectedTour) {
      navigate(`/editor/${selectedTour._id}`);
    }
  };

  if (loading) {
    return <div style={{ color: '#38bdf8', textAlign: 'center', marginTop: 40 }}>Cargando mapa...</div>;
  }
  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;
  }

  // Solo mostrar tours con localización válida
  const validTours = tours.filter(t => t.localizacion && typeof t.localizacion.lat === 'number' && typeof t.localizacion.lng === 'number');

  // El mapa siempre centrado en Ciudad Guayana
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 1000, display: 'flex', gap: '12px' }}>
        <button
          style={{
            background: '#23272f',
            color: '#38bdf8',
            border: 'none',
            borderRadius: 6,
            padding: '10px 20px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s'
          }}
          onClick={() => navigate('/hub')}
        >
          ← Volver al Hub
        </button>
        <button
          style={{
            background: '#23272f',
            color: '#38bdf8',
            border: 'none',
            borderRadius: 6,
            padding: '10px 20px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s'
          }}
          onClick={() => navigate('/')}
        >
          🏠 Volver a la Landing
        </button>
      </div>
      
      <MapContainer center={ciudadGuayana} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Polígono del CC Ciudad Alta Vista II */}
        <Polygon
          positions={[
            [8.3667, -62.6500], // Esquina noroeste
            [8.3672, -62.6495], // Esquina noreste
            [8.3677, -62.6498], // Esquina sureste
            [8.3672, -62.6505], // Esquina suroeste
            [8.3667, -62.6500]  // Cerrar el polígono
          ]}
          pathOptions={{
            fillColor: '#ff0000',
            fillOpacity: 0.3,
            color: '#ff0000',
            weight: 2,
            opacity: 0.8
          }}
          eventHandlers={{
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                fillOpacity: 0.5,
                weight: 3,
                opacity: 1
              });
            },
            mouseout: (e) => {
              const layer = e.target;
              layer.setStyle({
                fillOpacity: 0.3,
                weight: 2,
                opacity: 0.8
              });
            }
          }}
        >
          <Tooltip permanent={false} direction="top" offset={[0, -10]}>
            <strong>CC Ciudad Alta Vista II</strong><br/>
            Centro Comercial
          </Tooltip>
        </Polygon>
        
        {validTours.map(tour => {
          let imgUrl = tour.scenes && tour.scenes[0] && tour.scenes[0].image
            ? (tour.scenes[0].image.startsWith('/uploads/')
                ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${tour.scenes[0].image}`
                : tour.scenes[0].image)
            : null;
          const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div class='circle-img-marker'>${imgUrl ? `<img src='${imgUrl}' alt='Tour' />` : "<span style='font-size:1.5rem;'>📷</span>"}</div>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            popupAnchor: [0, -24],
          });
          return (
            <Marker
              key={tour._id}
              position={[tour.localizacion.lat, tour.localizacion.lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => handleMarkerClick(tour)
              }}
            />
          );
        })}
      </MapContainer>

      {/* Card flotante personalizada al seleccionar un tour/tienda */}
      {selectedTour && (
        <div
          className="floating-card-overlay"
          onMouseDown={e => { window._cardMouseDown = Date.now(); }}
          onMouseUp={e => {
            // Solo cerrar si el click fue corto y no sobre la card
            if (
              e.target.classList.contains('floating-card-overlay') &&
              window._cardMouseDown && Date.now() - window._cardMouseDown < 250
            ) {
              handleClosePanel();
            }
          }}
        >
          <div className="floating-card">
            <div className="floating-card-header">
              <div style={{flex:1}}></div>
              <button className="floating-card-btn" onClick={handleClosePanel} title="Cerrar">✖</button>
              <button className="floating-card-btn" onClick={() => navigate(`/tienda/${selectedTour._id}`)} title="Ir a tienda">
                <span role="img" aria-label="Tienda">🛒</span>
              </button>
            </div>
            <div className="floating-card-body">
              <div className="floating-card-main-row">
                <div
                  className={`floating-card-logo${logoSpin ? ' spinning-logo' : ''}`}
                  onClick={() => {
                    setLogoSpin(true);
                  }}
                  onAnimationEnd={() => setLogoSpin(false)}
                  style={{ cursor: 'pointer' }}
                  title="Haz click para girar el logo"
                >
                  {selectedTour.logo ? (
                    <img src={selectedTour.logo} alt="Logo tienda" />
                  ) : (
                    <span role="img" aria-label="Logo">🏪</span>
                  )}
                </div>
                <div className="floating-card-info">
                  <h2>{selectedTour.name}</h2>
                  <p>{selectedTour.description || 'Sin descripción'}</p>
                </div>
              </div>
              <div className="floating-card-products">
                {[
                  {
                    key: 'web',
                    icon: (
                      <img src="/web.png" alt="Web" style={{ width: 32, height: 32 }} />
                    ),
                    color: 'web',
                    url: 'https://anunnaki.tech',
                    tooltip: 'Visita el sitio web oficial de la tienda'
                  },
                  {
                    key: 'instagram',
                    icon: (
                      <img src="/instagram.png" alt="Instagram" style={{ width: 32, height: 32 }} />
                    ),
                    color: 'instagram',
                    url: 'https://instagram.com/alvarezjota',
                    tooltip: 'Síguenos en Instagram para más novedades'
                  },
                  {
                    key: 'whatsapp',
                    icon: (
                      <img src="/whatsapp.png" alt="WhatsApp" style={{ width: 32, height: 32 }} />
                    ),
                    color: 'whatsapp',
                    url: 'https://ejemplo.com',
                    tooltip: 'Contáctanos por WhatsApp para atención inmediata'
                  }
                ].map((btn, idx) => (
                  <button
                    className={`floating-card-social-btn social-${btn.color}`}
                    key={btn.key}
                    title={btn.tooltip}
                    data-tooltip={btn.tooltip}
                    onClick={() => btn.url && window.open(btn.url, '_blank')}
                    disabled={!btn.url}
                    style={{ zIndex: 10 + idx }}
                  >
                    <span className="social-icon">{btn.icon}</span>
                  </button>
                ))}
              </div>
              <div className="floating-card-tour-section">
                <button
                  className="floating-card-tour-btn"
                  onClick={() => navigate(`/viewer/${selectedTour._id}`)}
                  title="Explora el tour 360° de este establecimiento"
                >
                  <span className="tour-btn-icon">🔄</span>
                  <span className="tour-btn-text">Ver Tour 360°</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!panelOpen && (
        <button
          className="panel-toggle-collapsed"
          onClick={() => setPanelOpen(true)}
          aria-label="Abrir panel de detalles"
        >
          &#10095;
        </button>
      )}
    </div>
  );
}

export default LandingMap; 