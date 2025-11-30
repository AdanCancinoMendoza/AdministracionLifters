import React, { useState, useEffect } from 'react';
import StoryCard from '../../components/users/StoryCard';
import styles from '../../styles/UsersStoriesSection.module.css';

import { Newspaper, MessageSquare, Medal, LayoutGrid, Play } from "lucide-react";

type Story = {
  image: string;
  title: string;
  description: string;
  category: 'Noticia' | 'Testimonio' | 'Logro';
  date: string;
  type: 'imagen' | 'youtube';
  embed?: string;
  raw?: string;
};

const icons: any = {
  Todos: <LayoutGrid size={18} />,
  Noticia: <Newspaper size={18} />,
  Testimonio: <MessageSquare size={18} />,
  Logro: <Medal size={18} />,
};

function extractYoutubeId(url?: string | null) {
  if (!url || typeof url !== "string") return null;
  const patterns = [
    /(?:youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{6,})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{6,}$/.test(url)) return url;
  return null;
}

const StoriesSection: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState<'Todos' | 'Noticia' | 'Testimonio' | 'Logro'>('Todos');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/publicacion')
      .then(res => res.json())
      .then((data) => {
        const mappedStories = data.map((item: any) => {
          const tipo = item.Tipo === 'youtube' ? 'youtube' : 'imagen';
          if (tipo === 'youtube') {
            const id = extractYoutubeId(item.Contenido);
            if (id) {
              return {
                image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
                embed: `https://www.youtube.com/embed/${id}`,
                raw: item.Contenido,
                title: item.Titulo,
                description: item.Descripcion,
                category: item.Categoria as 'Noticia' | 'Testimonio' | 'Logro',
                date: item.Fecha ? new Date(item.Fecha).toLocaleDateString() : '',
                type: 'youtube' as const,
              };
            } else {
              return {
                image: item.Contenido || '/placeholder.png',
                title: item.Titulo,
                description: item.Descripcion,
                category: item.Categoria,
                date: item.Fecha ? new Date(item.Fecha).toLocaleDateString() : '',
                type: 'imagen' as const,
                raw: item.Contenido,
              };
            }
          } else {
            const imageUrl = item.Contenido && item.Contenido.startsWith('http')
              ? item.Contenido
              : `http://localhost:3001${item.Contenido || ''}`;
            return {
              image: imageUrl,
              title: item.Titulo,
              description: item.Descripcion,
              category: item.Categoria as 'Noticia' | 'Testimonio' | 'Logro',
              date: item.Fecha ? new Date(item.Fecha).toLocaleDateString() : '',
              type: 'imagen' as const,
              raw: item.Contenido,
            };
          }
        });
        setStories(mappedStories);
      })
      .catch(err => {
        console.error('Error cargando historias:', err);
      });
  }, []);

  // lock body scroll when modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (selectedStory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [selectedStory]);

  const filteredStories = filter === 'Todos'
    ? stories
    : stories.filter(story => story.category === filter);

  return (
    <section className={styles.storiesSection} aria-label="Historias, Logros y Noticias">
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Historias, Logros y Noticias</h2>
          <p className={styles.lead}>Mantente al día con las últimas novedades y testimonios.</p>
        </div>

        <div className={styles.filterButtons}>
          {['Todos', 'Noticia', 'Testimonio', 'Logro'].map(cat => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${filter === cat ? styles.active : ''}`}
              onClick={() => setFilter(cat as any)}
              aria-pressed={filter === cat}
            >
              <span className={styles.filterInner}>
                {icons[cat]}
                <span>{cat + (cat !== 'Todos' ? 's' : '')}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.storyGrid}>
        {filteredStories.length === 0 ? (
          <div className={styles.empty}>No hay publicaciones que coincidan.</div>
        ) : (
          filteredStories.map((story, index) => (
            <div
              key={index}
              className={styles.cardWrap}
              onClick={() => setSelectedStory(story)}
              role="button"
              tabIndex={0}
            >
              <StoryCard {...story} />
              {story.type === 'youtube' && (
                <div className={styles.playOverlay} aria-hidden>
                  <Play size={28} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedStory && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedStory(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedStory(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>

            {selectedStory.type === 'youtube' ? (
              selectedStory.embed ? (
                <div className={styles.embedWrapper}>
                  <iframe
                    src={selectedStory.embed + '?rel=0&modestbranding=1'}
                    title={selectedStory.title}
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={styles.noEmbed}>
                  <p>No se pudo cargar el video de YouTube.</p>
                  <a href={selectedStory.raw || '#'} target="_blank" rel="noreferrer">Abrir en YouTube</a>
                </div>
              )
            ) : (
              <img
                src={selectedStory.image}
                alt={selectedStory.title}
                className={styles.modalImage}
                loading="lazy"
              />
            )}

            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>{selectedStory.title}</h3>
              <p className={styles.modalCategory}>
                {selectedStory.category} · <small>{selectedStory.date}</small>
              </p>
              <p className={styles.modalDesc}>{selectedStory.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StoriesSection;
