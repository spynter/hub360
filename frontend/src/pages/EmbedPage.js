import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import EmbedViewer from '../components/Embed/EmbedViewer';
import './EmbedPage.css';

function EmbedPage() {
  const { apiKey } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const tourData = await api.getTourByApiKey(apiKey);
        setTour(tourData);
        setLoading(false);
      } catch (err) {
        setError('No se pudo cargar el tour');
        setLoading(false);
      }
    };
    fetchTour();
  }, [apiKey]);

  if (loading) {
    return (
      <div className="embed-loading">
        <div className="spinner"></div>
        <p>Cargando tour...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="embed-error">
        <h3>Error</h3>
        <p>{error}</p>
        <p>API Key: {apiKey}</p>
      </div>
    );
  }

  return (
    <div className="embed-container">
      <EmbedViewer tour={tour} />
    </div>
  );
}

export default EmbedPage;
