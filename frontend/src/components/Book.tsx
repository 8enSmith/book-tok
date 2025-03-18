import { FC } from 'react';

interface BookProps {
  title: string;
  content: string;
  image?: string;
}

const Book: FC<BookProps> = ({ title, content, image }) => {
  return (
    <article 
      className="book-container"
      role="article"
      aria-labelledby="book-title"
    >
      <h2 id="book-title" className="book-title">
        {title}
      </h2>
      
      {image && (
        <img 
          src={image} 
          alt={`Illustration for article: ${title}`}
          className="book-image"
        />
      )}
      
      <div 
        className="book-content"
        role="contentinfo"
        aria-label="Book content"
      >
        {content}
      </div>
    </article>
  );
};

export default Book;