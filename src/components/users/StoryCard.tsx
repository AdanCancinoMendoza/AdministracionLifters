// src/components/StoryCard.tsx
import styles from '../../styles/UsersStoryCard.module.css';

type Story = {
  image: string;
  title: string;
  description: string;
  category: 'Noticia' | 'Testimonio' | 'Logro';
  date: string;
  type?: 'imagen' | 'youtube'; // Nuevo campo opcional
};

const categoryColors: Record<string, string> = {
  Noticia: '#e3f2fd',
  Testimonio: '#fce4ec',
  Logro: '#f3e5f5',
};

const StoryCard = ({ image, title, description, category, date, type = 'imagen' }: Story) => {
  return (
    <div className={styles.storyCard}>
      <div className={styles.storyMedia}>
        {type === 'youtube' ? (
          <iframe
            src={image}
            title={title}
            width="100%"
            height="200"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img src={image} alt={title} className={styles.storyImage} />
        )}
      </div>
      <div className={styles.storyContent}>
        <h3 dangerouslySetInnerHTML={{ __html: title }} />
        <p>{description}</p>
        <div className={styles.storyMeta}>
          <span
            className={styles.categoryBadge}
            style={{ backgroundColor: categoryColors[category] }}
          >
            {category}
          </span>
          <span className={styles.date}>Publicado: {date}</span>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
