import React, { useState } from 'react';
import StoryCard from './StoryCard';
import '../styles/StoriesSection.css'; // Asegúrate que este CSS exista
import '../styles/StoryCard.css'; // Para que StoryCard funcione sin error

type Story = {
  image: string;
  title: string;
  description: string;
  category: 'Noticia' | 'Testimonio' | 'Logro';
  date: string;
};

const allStories: Story[] = [
  {
    image: '/fuerza1.png',
    title: '¡Confirmado el Campeonato Nacional 2025!',
    description: 'La federación oficial de Lifters ha confirmado una competencia en Teca...',
    category: 'Noticia',
    date: '24/05/2025',
  },
  {
    image: '/fuerza2.png',
    title: '“Competir cambió mi vida” - Raul Malo',
    description: 'Mi primera competencia cambió todo para mí. Me dio enfoque, motivación...',
    category: 'Testimonio',
    date: '25/05/2025',
  },
  {
    image: '/fuerza3.png',
    title: '¡Caleb Salvador rompe barreras con 250kg!',
    description: 'Con una determinación inquebrantable y meses de preparación intensos...',
    category: 'Logro',
    date: '26/05/2025',
  },
  {
    image: '/fuerza4.png',
    title: '¡Nuevo récord nacional en levantamiento!',
    description: 'Un logro histórico para el equipo local de Tecamachalco...',
    category: 'Logro',
    date: '27/05/2025',
  },
];

const StoriesSection: React.FC = () => {
  const [filter, setFilter] = useState<'Todos' | 'Noticia' | 'Testimonio' | 'Logro'>('Todos');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const filteredStories = filter === 'Todos'
    ? allStories
    : allStories.filter(story => story.category === filter);

  return (
    <section className="stories-section">
      <h2>Historias, Logros y Noticias</h2>

      {/* Botones de filtro */}
      <div className="filter-buttons">
        {['Todos', 'Noticia', 'Testimonio', 'Logro'].map((cat) => (
          <button
            key={cat}
            className={filter === cat ? 'active' : ''}
            onClick={() => setFilter(cat as 'Todos' | 'Noticia' | 'Testimonio' | 'Logro')}
          >
            {cat + (cat !== 'Todos' ? 's' : '')}
          </button>
        ))}
      </div>

      {/* Grid de historias */}
      <div className="story-grid">
        {filteredStories.map((story, index) => (
          <div key={index} onClick={() => setSelectedStory(story)} style={{ cursor: 'pointer' }}>
            <StoryCard {...story} />
          </div>
        ))}
      </div>

      {/* Modal de historia seleccionada */}
      {selectedStory && (
        <div className="modal-overlay" onClick={() => setSelectedStory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedStory.image} alt={selectedStory.title} />
            <h3>{selectedStory.title}</h3>
            <p className="category">{selectedStory.category}</p>
            <p>{selectedStory.description}</p>
            <small>{selectedStory.date}</small>
            <button onClick={() => setSelectedStory(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default StoriesSection;
