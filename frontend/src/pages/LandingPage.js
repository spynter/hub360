import React, { useRef, useState } from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

const randomImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
];

const featuredTours = [
  {
    title: 'Catedral de Ciudad Guayana',
    desc: 'Descubre la majestuosidad de la catedral en 360°',
    img: randomImages[0],
  },
  {
    title: 'Parque La Llovizna',
    desc: 'Explora la naturaleza y cascadas en un tour virtual',
    img: randomImages[1],
  },
  {
    title: 'Orinokia Mall',
    desc: 'Recorre el centro comercial más grande del sur',
    img: randomImages[2],
  },
  {
    title: 'Plaza Bolívar',
    desc: 'Un paseo histórico en el corazón de la ciudad',
    img: randomImages[3],
  },
];

const plans = [
  {
    name: 'Bronce',
    price: '$100/mes',
    year: '$700/año',
    features: ['3 Fotos 360°', '1 Tour Virtual', '1 Tienda Virtual'],
    color: '#cd7f32',
    btn: 'Comenzar',
  },
  {
    name: 'Plata',
    price: '$180/mes',
    year: '$1,512/año',
    features: ['5 Fotos 360°', '2 Tours Virtuales', '2 Tiendas', 'Redes Sociales', 'Exposición en App'],
    color: '#c0c0c0',
    btn: 'Prueba Gratis',
    featured: true,
  },
  {
    name: 'Oro',
    price: '$250/mes',
    year: '$2,100/año',
    features: ['7 Fotos 360°', '3 Tours Virtuales', '3 Tiendas', 'Redes Sociales', 'Exposición Destacada'],
    color: '#ffd700',
    btn: 'Personalizar',
  },
  {
    name: 'Diamante',
    price: 'Plan Personalizado',
    year: '',
    features: ['20+ Fotos 360°', 'Tours Ilimitados', 'Tiendas Ilimitadas', 'Redes Sociales Premium', 'Exposición VIP'],
    color: '#b9f2ff',
    btn: 'Contactar Ventas',
  },
];

// Más cards de ejemplo para cada sección
const sectionsData = [
  {
    title: 'Lugares para visitar en Ciudad Guayana',
    id: 'lugares',
    cards: [
      {
        img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        name: 'Parque La Llovizna', ciudad: 'Ciudad Guayana', estado: 'Bolívar', pais: 'Venezuela', tour: '/viewer/1',
      },
      {
        img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        name: 'Catedral de Ciudad Guayana', ciudad: 'Ciudad Guayana', estado: 'Bolívar', pais: 'Venezuela', tour: '/viewer/2',
      },
      {
        img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
        name: 'Plaza Bolívar', ciudad: 'Ciudad Guayana', estado: 'Bolívar', pais: 'Venezuela', tour: '/viewer/3',
      },
      {
        img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
        name: 'Parque Cachamay', ciudad: 'Ciudad Guayana', estado: 'Bolívar', pais: 'Venezuela', tour: '/viewer/14',
      },
      {
        img: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80',
        name: 'Museo Jesús Soto', ciudad: 'Ciudad Guayana', estado: 'Bolívar', pais: 'Venezuela', tour: '/viewer/15',
      },
      {
        img: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
        name: 'Castillo San Félix', ciudad: 'Ciudad Guayana', estado: 'Bolívar', pais: 'Venezuela', tour: '/viewer/16',
      },
    ],
  },
  {
    title: 'Establecimientos comerciales',
    id: 'comercios',
    cards: [
      {
        img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
        name: 'Orinokia Mall',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/4',
      },
      {
        img: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80',
        name: 'Centro Comercial Alta Vista',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/5',
      },
    ],
  },
  {
    title: 'Inmobiliarias',
    id: 'inmobiliarias',
    cards: [
      {
        img: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
        name: 'Inmobiliaria Guayana',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/6',
      },
      {
        img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        name: 'Casas y Más',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/7',
      },
    ],
  },
  {
    title: 'Clínicas y Hospitales',
    id: 'clinicas',
    cards: [
      {
        img: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=600&q=80',
        name: 'Clínica La Esperanza',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/8',
      },
      {
        img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd23?auto=format&fit=crop&w=600&q=80',
        name: 'Hospital Uyapar',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/9',
      },
    ],
  },
  {
    title: 'Restaurantes',
    id: 'restaurantes',
    cards: [
      {
        img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
        name: 'Restaurante El Sabor',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/10',
      },
      {
        img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
        name: 'La Parrilla de Guayana',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/11',
      },
    ],
  },
  {
    title: 'Hoteles',
    id: 'hoteles',
    cards: [
      {
        img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        name: 'Hotel Eurobuilding',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/12',
      },
      {
        img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        name: 'Hotel Plaza Merú',
        ciudad: 'Ciudad Guayana',
        estado: 'Bolívar',
        pais: 'Venezuela',
        tour: '/viewer/13',
      },
    ],
  },
];

function CarouselSection({ title, cards }) {
  const scrollRef = useRef();
  const autoScrollRef = useRef();

  // Auto-scroll
  React.useEffect(() => {
    autoScrollRef.current = setInterval(() => {
      if (scrollRef.current) {
        const cardWidth = scrollRef.current.querySelector('.carousel-card')?.offsetWidth || 320;
        scrollRef.current.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(autoScrollRef.current);
  }, []);

  // Pausar auto-scroll al interactuar
  const pauseAutoScroll = () => clearInterval(autoScrollRef.current);
  const resumeAutoScroll = () => {
    clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      if (scrollRef.current) {
        const cardWidth = scrollRef.current.querySelector('.carousel-card')?.offsetWidth || 320;
        scrollRef.current.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
      }
    }, 4000);
  };

  const scrollByCard = (dir) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector('.carousel-card')?.offsetWidth || 320;
      scrollRef.current.scrollBy({ left: dir * (cardWidth + 24), behavior: 'smooth' });
    }
  };

  return (
    <section className="carousel-section" style={{ background: '#000' }}>
      <div className="carousel-header" style={{ justifyContent: 'center' }}>
        <h2 style={{ textAlign: 'center', width: '100%' }}>{title}</h2>
      </div>
      <div className="carousel-outer">
        <button className="carousel-arrow carousel-arrow-left" onClick={() => scrollByCard(-1)} onMouseDown={pauseAutoScroll} onMouseUp={resumeAutoScroll}>&#8592;</button>
        <div
          className="carousel-cards"
          ref={scrollRef}
          style={{ justifyContent: 'center' }}
          onMouseEnter={pauseAutoScroll}
          onMouseLeave={resumeAutoScroll}
        >
          {cards.map((card, i) => (
            <div className="carousel-card animated-card" key={i}>
              <img src={card.img} alt={card.name} />
              <div style={{ padding: '1.1rem' }}>
                <h3>{card.name}</h3>
                <div>{card.ciudad}, {card.estado}, {card.pais}</div>
                <button className="carousel-tour-btn" onClick={() => window.location.href = card.tour}>Ir al tour</button>
              </div>
            </div>
          ))}
        </div>
        <button className="carousel-arrow carousel-arrow-right" onClick={() => scrollByCard(1)} onMouseDown={pauseAutoScroll} onMouseUp={resumeAutoScroll}>&#8594;</button>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="logo">Volteapp</div>
        <nav>
          <a href="#tours">Explorar</a>
          <a href="#planes">Planes</a>
          <a href="#contacto">Contacto</a>
          <a
            href="#"
            style={{ marginLeft: '18px', color: '#38bdf8', fontWeight: 500 }}
            onClick={e => {
              e.preventDefault();
              navigate('/comercios360');
            }}
          >
            Comercios 360°
          </a>
          <a
            href="#"
            style={{ marginLeft: '18px', color: '#38bdf8', fontWeight: 500 }}
            onClick={e => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            Login
          </a>
        </nav>
        <button className="go-map-btn" onClick={() => navigate('/map')}>Ver Mapa</button>
      </header>
      <section className="hero-section">
        <h1>De Guayana para el mundo!</h1>
        <p className="hero-desc">Explora Ciudad Guayana en 360°.<br/>Encuentra lugares, comercios y experiencias únicas desde cualquier parte del mundo.</p>
        <div className="search-bar">
          <input type="text" placeholder="¿Qué quieres descubrir hoy?" disabled style={{opacity:0.7}} />
          <button disabled>Buscar</button>
        </div>
        <button className="cta-btn" onClick={() => navigate('/map')}>Descubre el Mapa Interactivo</button>
      </section>
      {/* Carruseles nuevos */}
      {sectionsData.map((section, idx) => (
        <CarouselSection key={section.id} title={section.title} cards={section.cards} />
      ))}
      <section className="featured-tours" id="tours">
        <h2>Lugares Destacados</h2>
        <div className="tour-cards">
          {featuredTours.map((tour, i) => (
            <div className="tour-card" key={i} style={{ '--i': i }}>
              <img src={tour.img} alt={tour.title} />
              <div className="tour-info">
                <h3>{tour.title}</h3>
                <p>{tour.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="plans-section" id="planes">
        <h2>Planes y Precios</h2>
        <div className="plans-wrapper">
          {plans.map((plan, i) => (
            <div className={`plan-card${plan.featured ? ' featured' : ''}`} key={i} style={{ '--i': i }}>
              {plan.featured && <div className="recommended-badge">Más Elegido</div>}
              <div className="plan-header">
                <h3 className="plan-name" style={{color: plan.color}}>{plan.name}</h3>
                <div className="price-display">
                  <span className="monthly-price">{plan.price}</span>
                  {plan.year && <span className="annual-price">{plan.year}</span>}
                </div>
              </div>
              <ul className="plan-benefits">
                {plan.features.map((f, j) => <li key={j}>✔ {f}</li>)}
              </ul>
              <button className="select-plan">{plan.btn}</button>
            </div>
          ))}
        </div>
      </section>
      <footer className="landing-footer" id="contacto">
        <div>
          <span>© {new Date().getFullYear()} Volteapp. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}