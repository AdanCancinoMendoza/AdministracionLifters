// src/components/StoryCard.tsx
import React, { useState } from "react";
import '../styles/StoryCard.css';


type Story = {
  image: string;
  title: string;
  description: string;
  category: 'Noticia' | 'Testimonio' | 'Logro';
  date: string;
};

const categoryColors: Record<string, string> = {
  Noticia: '#e3f2fd',
  Testimonio: '#fce4ec',
  Logro: '#f3e5f5',
};

const StoryCard = ({ image, title, description, category, date }: Story) => {
  return (
    <div className="story-card">
      <img src={image} alt={title} className="story-image" />
      <div className="story-content">
        <h3 dangerouslySetInnerHTML={{ __html: title }} />
        <p>{description}</p>
        <div className="story-meta">
          <span className="category-badge" style={{ backgroundColor: categoryColors[category] }}>
            {category}
          </span>
          <span className="date">Publicado: {date}</span>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;