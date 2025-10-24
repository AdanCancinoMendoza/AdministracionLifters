// src/views/users/StoriesSection.tsx
import React, { useState, useEffect } from 'react';
import StoryCard from '../../components/users/StoryCard';
import styles from '../../styles/UsersStoriesSection.module.css';

type Story = {
  image: string;
  title: string;
  description: string;
  category: 'Noticia' | 'Testimonio' | 'Logro';
  date: string;
  type: 'imagen' | 'youtube';
};

const StoriesSection: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState<'Todos' | 'Noticia' | 'Testimonio' | 'Logro'>('Todos');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/publicacion')
      .then(res => res.json())
      .then(data => {
        const mappedStories = data.map((item: any) => ({
          image: item.Tipo === 'youtube' 
            ? item.Contenido 
            : `http://localhost:3001${item.Contenido}`, // <-- URL completa para imágenes
          title: item.Titulo,
          description: item.Descripcion,
          category: item.Categoria as 'Noticia' | 'Testimonio' | 'Logro',
          date: new Date(item.Fecha).toLocaleDateString(),
          type: item.Tipo as 'imagen' | 'youtube'
        }));
        setStories(mappedStories);
      })
      .catch(err => console.error(err));
  }, []);

  const filteredStories = filter === 'Todos'
    ? stories
    : stories.filter(story => story.category === filter);

  return (
    <section className={styles.storiesSection}>
      <h2>Historias, Logros y Noticias</h2>

      {/* Botones de filtro */}
      <div className={styles.filterButtons}>
        {['Todos', 'Noticia', 'Testimonio', 'Logro'].map(cat => (
          <button
            key={cat}
            className={filter === cat ? styles.active : ''}
            onClick={() => setFilter(cat as 'Todos' | 'Noticia' | 'Testimonio' | 'Logro')}
          >
            {cat + (cat !== 'Todos' ? 's' : '')}
          </button>
        ))}
      </div>

      {/* Grid de historias */}
      <div className={styles.storyGrid}>
        {filteredStories.map((story, index) => (
          <div key={index} onClick={() => setSelectedStory(story)} style={{ cursor: 'pointer' }}>
            <StoryCard {...story} />
          </div>
        ))}
      </div>

      {/* Modal de historia seleccionada */}
      {selectedStory && (
        <div className={styles.modalOverlay} onClick={() => setSelectedStory(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            {selectedStory.type === 'youtube' ? (
              <iframe
                src={selectedStory.image}
                title={selectedStory.title}
                width="100%"
                height="400"
                allowFullScreen
              />
            ) : (
              <img src={selectedStory.image} alt={selectedStory.title} />
            )}
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
