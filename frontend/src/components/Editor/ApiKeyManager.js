import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ApiKeyManager.css';

function ApiKeyManager({ tourId, initialApiKey }) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCode, setEmbedCode] = useState('');

  const generateNewKey = async () => {
    if (window.confirm('¿Estás seguro de generar una nueva API Key? Esto invalidará la anterior.')) {
      setLoading(true);
      try {
        const response = await api.generateApiKey(tourId);
        setApiKey(response.apiKey);
        updateEmbedCode(response.apiKey);
      } catch (error) {
        console.error('Error generando API Key:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateEmbedCode = (key) => {
    const code = `<div id="tour-360-container"></div>
<script src="${window.location.origin}/tour-360-embed.js"></script>
<script>
  Tour360.init({
    container: 'tour-360-container',
    apiKey: '${key}'
  });
</script>`;
    setEmbedCode(code);
  };

  useEffect(() => {
    if (apiKey) {
      updateEmbedCode(apiKey);
    }
  }, [apiKey]);

  return (
    <div className="api-key-manager">
      <h3>API Key para Incrustar</h3>
      <p>Utiliza esta clave para incrustar este tour en otros sitios web.</p>
      <div className="key-display">
        <div className="key-value">
          {apiKey || 'No hay API Key generada'}
          <button 
            className="copy-btn"
            onClick={copyToClipboard}
            disabled={!apiKey || copied}
          >
            {copied ? '✓ Copiado' : '📋 Copiar'}
          </button>
        </div>
        <button 
          className="generate-btn"
          onClick={generateNewKey}
          disabled={loading}
        >
          {loading ? 'Generando...' : 'Generar Nueva Key'}
        </button>
      </div>
      {embedCode && (
        <div className="embed-section">
          <h4>Código para Incrustar:</h4>
          <textarea
            value={embedCode}
            readOnly
            rows="5"
            onClick={e => e.target.select()}
          />
          <p className="note">
            Copia y pega este código en tu sitio web para mostrar el tour.
          </p>
        </div>
      )}
    </div>
  );
}

export default ApiKeyManager;
