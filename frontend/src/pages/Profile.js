import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';

function Profile() {
  const { user } = useContext(UserContext);

  if (!user) return <div style={{padding:40}}>No hay usuario conectado.</div>;

  return (
    <div style={{maxWidth:400,margin:'60px auto',background:'#23272f',borderRadius:12,padding:32,color:'#e2e8f0',boxShadow:'0 4px 24px rgba(56,189,248,0.13)'}}>
      <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:18}}>
        {user.foto ? (
          <img src={user.foto} alt="Foto usuario" style={{width:64,height:64,borderRadius:'50%'}} />
        ) : (
          <div style={{width:64,height:64,borderRadius:'50%',background:'#181c23',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',color:'#38bdf8'}}>
            {user.nombre?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <div style={{fontWeight:600,fontSize:'1.2rem',color:'#38bdf8'}}>{user.nombre}</div>
          <div style={{fontSize:'1rem',color:'#a3a3a3'}}>{user.correo}</div>
          <div style={{fontSize:'0.98rem',color:'#e2e8f0'}}>{user.usuario}</div>
          <div style={{fontSize:'0.98rem',color:'#e2e8f0'}}>Tipo: {user.tipo}</div>
        </div>
      </div>
      <div style={{marginTop:18,fontSize:'1rem',color:'#a3a3a3'}}>Aquí puedes mostrar más información y opciones de edición de perfil.</div>
    </div>
  );
}

export default Profile;
