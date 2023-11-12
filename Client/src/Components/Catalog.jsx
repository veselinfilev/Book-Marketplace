import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Catalog.module.css"
import { getAllBook } from "../services/bookService.js";


const Catalog = () => {

  const [books, setBooks] = useState([]);

  useEffect(() => {
    getAllBook()
      .then(response => setBooks(response));
  }, [books.length])

  return (
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
  );
};

export default Catalog;