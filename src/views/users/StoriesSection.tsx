import React, { useState } from 'react';
import StoryCard from '../../components/users/StoryCard';
import styles from '../../styles/UsersStoriesSection.module.css';

type Story = {
  image: string;
  title: string;
  description: string;
  category: 'Noticia' | 'Testimonio' | 'Logro';
  date: string;
};

const allStories: Story[] = [
  {
    image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=800&q=80',
    title: '¡Confirmado el Campeonato Nacional 2025!',
    description: 'La federación oficial de Lifters ha confirmado una competencia en Tecamachalco, reuniendo a los mejores atletas del país.',
    category: 'Noticia',
    date: '24/05/2025',
  },
  {
    image: 'https://images.unsplash.com/photo-1599058917115-c504b2a6259f?auto=format&fit=crop&w=800&q=80',
    title: '“Competir cambió mi vida” - Raul Malo',
    description: 'Mi primera competencia cambió todo para mí. Me dio enfoque, motivación y disciplina para seguir creciendo en powerlifting.',
    category: 'Testimonio',
    date: '25/05/2025',
  },
  {
    image: 'https://images.unsplash.com/photo-1599058917217-963e37f41c05?auto=format&fit=crop&w=800&q=80',
    title: '¡Caleb Salvador rompe barreras con 250kg!',
    description: 'Con una determinación inquebrantable y meses de preparación intensos, Caleb logró levantar 250kg en press de banca.',
    category: 'Logro',
    date: '26/05/2025',
  },
  {
    image: 'https://images.unsplash.com/photo-1562774050-9c120d0ab274?auto=format&fit=crop&w=800&q=80',
    title: '¡Nuevo récord nacional en levantamiento!',
    description: 'Un logro histórico para el equipo local de Tecamachalco, demostrando la fuerza y dedicación de nuestros atletas.',
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
    <section className={styles.storiesSection}>
      <h2>Historias, Logros y Noticias</h2>

      {/* Botones de filtro */}
      <div className={styles.filterButtons}>
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
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
