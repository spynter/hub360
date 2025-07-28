import React, { useState, useContext, useRef, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import './UserCircle.css';

function UserCircle() {
  const { user, logout } = useContext(UserContext);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const popupRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    }
    if (showPopup) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  if (!user) return null;

  return (
    <div className="user-circle-wrapper">
      <div
        className="user-circle"
        onClick={() => setShowPopup(!showPopup)}
        title={user.nombre}
      >
        {user.foto ? (
          <img src={user.foto} alt="Foto usuario" className="user-photo" />
        ) : (
          <span className="user-initial">{user.nombre?.[0]?.toUpperCase() || '?'}</span>
        )}
      </div>
      {showPopup && (
        <div className="user-popup" ref={popupRef}>
          <div className="user-popup-header">
            {user.foto ? (
              <img src={user.foto} alt="Foto usuario" className="user-popup-photo" />
            ) : (
              <span className="user-popup-initial">{user.nombre?.[0]?.toUpperCase() || '?'}</span>
            )}
            <div>
              <div className="user-popup-name">{user.nombre}</div>
              <div className="user-popup-email">{user.correo}</div>
            </div>
          </div>
          <button className="user-popup-btn" onClick={() => { setShowPopup(false); navigate('/profile'); }}>
            Perfil
          </button>
          <button className="user-popup-btn" onClick={() => { logout(); navigate('/login'); }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default UserCircle;
