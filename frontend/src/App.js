// Main React App component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Hub from './components/Hub/Hub';
import TourEditor from './components/Editor/TourEditor';
import './App.css';

function TourEditorWrapper() {
  const { tourId } = useParams();
  return <TourEditor tourId={tourId} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/editor/:tourId" element={<TourEditorWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;