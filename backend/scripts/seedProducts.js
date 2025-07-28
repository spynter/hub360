const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://anunnaki:IGcICHTKbEVkNnDv@cluster0.la6e0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const products = [
  {
    name: 'Cámara 360° Insta360 X3',
    description: 'Cámara de acción 360° con estabilización avanzada y video 5.7K.',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    price: 499.99
  },
  {
    name: 'Gafas VR Oculus Quest 2',
    description: 'Gafas de realidad virtual inalámbricas con 128GB de almacenamiento.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
    price: 349.00
  },
  {
    name: 'Trípode Extensible',
    description: 'Trípode ligero y ajustable para cámaras 360° y smartphones.',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    price: 29.99
  },
  {
    name: 'Tarjeta MicroSD 128GB',
    description: 'Tarjeta de memoria rápida y confiable para grabaciones 4K.',
    image: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=400&q=80',
    price: 19.99
  },
  {
    name: 'Estuche de Transporte',
    description: 'Estuche rígido y resistente para cámaras y accesorios.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    price: 24.99
  },
  {
    name: 'Kit de Limpieza Óptica',
    description: 'Kit completo para limpiar lentes y pantallas de dispositivos.',
    image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3fd9?auto=format&fit=crop&w=400&q=80',
    price: 12.50
  },
  {
    name: 'Batería Externa 10000mAh',
    description: 'Batería portátil de alta capacidad para recargar tus dispositivos.',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=400&q=80',
    price: 34.90
  },
  {
    name: 'Soporte de Escritorio para VR',
    description: 'Soporte elegante para organizar tus gafas y mandos VR.',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    price: 15.99
  },
  {
    name: 'Cable USB-C de 2m',
    description: 'Cable de carga y datos de alta velocidad, ideal para dispositivos modernos.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
    price: 8.99
  },
  {
    name: 'Adaptador de Corriente Universal',
    description: 'Adaptador compacto compatible con enchufes de todo el mundo.',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    price: 17.50
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log('Productos de ejemplo insertados correctamente.');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Error al insertar productos:', err);
  mongoose.disconnect();
});
