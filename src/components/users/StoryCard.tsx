import React from 'react';
import styles from '../../styles/UsersStoryCard.module.css';

type Props = {
  image: string;
  title: string;
  description: string;
  category: 'Noticia' | 'Testimonio' | 'Logro';
  date: string;
  type: 'imagen' | 'youtube';
};

const StoryCard: React.FC<Props> = ({ image, title, description, category, date, type }) => {
  return (
    <article className={styles.card} aria-label={title}>
      <div className={styles.media}>
        {/* thumbnail always as img (you use embed only in modal) */}
        <img src={image} alt={title} loading="lazy" className={styles.thumb} />
      </div>

      <div className={styles.content}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardText}>{description}</p>

        <div className={styles.meta}>
          <span className={`${styles.badge} ${category === 'Noticia' ? styles.noticia : category === 'Logro' ? styles.logro : styles.testimonio}`}>
            {category}
          </span>
          <small className={styles.date}>{date}</small>
        </div>
      </div>
    </article>
  );
};

export default StoryCard;
