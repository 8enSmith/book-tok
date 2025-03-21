import { FC, KeyboardEvent } from 'react'
import Book from './Book'

export interface BookProps {
  id?: string | number
  title: string
  content: string
  image?: string
}

interface BookListProps {
  books: BookProps[]
  onArticleSelect?: (article: BookProps) => void
}

const BookList: FC<BookListProps> = ({ books, onArticleSelect }) => {
  const handleKeyPress = (e: KeyboardEvent<HTMLLIElement>, article: BookProps) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onArticleSelect?.(article)
    }
  }

  const handleClick = (article: BookProps) => {
    onArticleSelect?.(article)
  }

  return (
    <nav aria-label="Articles navigation">
      <ul role="list" className="articles-list">
        {books.map((book, index) => (
          <li
            key={index}
            role="listitem"
            tabIndex={0}
            onClick={() => handleClick(book)}
            onKeyPress={e => handleKeyPress(e, book)}
            aria-label={`Article: ${book.title}`}
          >
            <Book {...book} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BookList
