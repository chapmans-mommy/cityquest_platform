import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="hero">
      <div className="hero-map-bg"></div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">
          City<span className="hero-title-accent">Quest</span>
        </h1>
        <p className="hero-subtitle">
          Создавай городские квесты. Исследуй маршруты. Играй.
        </p>
      </div>
    </div>
  );
};

export default Hero;