// src/components/StoryCard.tsx
import styles from '../../styles/UsersStoryCard.module.css';

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
    <div className={styles.storyCard}>
      <img src={image} alt={title} className={styles.storyImage} />
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
