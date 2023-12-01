import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Catalog.module.css"
import { getAllBook, getCurrentPageBooks } from "../../services/bookService.js";


const Catalog = () => {

  const [books, setBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeButton, setActiveButton] = useState(null);
  const pageSize = 6;

  useEffect(() => {
    const offset = (currentPage - 1) * pageSize;
    getCurrentPageBooks(offset, pageSize, activeButton)
      .then(response => setBooks(response));
  }, [currentPage, activeButton]);

  const handleClick = (buttonType) => {
    setActiveButton(buttonType);
  };

  return (
    <>
      <div className={styles.sortBtn}>
        <button
          className={activeButton === 'latest' ? 'active' : ''}
          onClick={() => handleClick('latest')}
        >
          Latest
        </button>
        <button
          className={activeButton === 'price-high-to-low' ? 'active' : ''}
          onClick={() => handleClick('price-high-to-low')}
        >
          Price High to Low
        </button>
        <button
          className={activeButton === 'price-low-to-high' ? 'active' : ''}
          onClick={() => handleClick('price-low-to-high')}
        >
          Price Low to High
        </button>
      </div>
      <div className={styles.catalog}>
        {books.map((book) => (
          <div className={styles.book} key={book._id}>
            <img src={book.image} alt={book.title} />
            <h3>{book.title}</h3>
            <p>Author: {book.author}</p>
            <p>Price: ${book.price}</p>
            <div className={styles.buttons}>
              <Link to={`/details/${book._id}`}><button> Detail</button></Link>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.pagination}>
        <button
          onClick={() => setCurrentPage(prevPage => prevPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>{currentPage}</span>
        <button
          onClick={() => setCurrentPage(prevPage => prevPage + 1)}
          disabled={books.length < currentPage * pageSize}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default Catalog;