import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Details.module.css";
import { deleteBook, getOneBook } from "../../services/bookService.js";
import { buyBook, getBookSales } from "../../services/buyService.js";

const Details = () => {
    const { bookId } = useParams();
    const [book, setBook] = useState({});
    const [sales,setSales] = useState('')
    const navigate = useNavigate();

    useEffect(() => {
        getOneBook(bookId)
            .then(result => setBook(result))
    }, [bookId])

    useEffect(()=>{
        getBookSales(bookId)
        .then(result => setSales(result))
    },[bookId])

    const onDelete = (bookId) => {
        deleteBook(bookId)
            .then(response => {
                console.log(response);
                if (response == 200) {
                   navigate('/catalog')
                } else {
                    navigate('/catalog')
                    // throw new Error('Unsuccessful delete');
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    const onEdit = () => {
        navigate(`/edit/${bookId}`,{state:book});
    }

    const onBuy = (bookId) =>{
        buyBook(bookId)
        alert('Successfuly buying')
    }

    return (
        <div className={styles.bookDetails}>
            <h1>Book details</h1>
            <img src={book.image} alt="Book image" />
            <h2>{book.title}</h2>
            <p>Author: {book.author}</p>
            <p>Genre: {book.genre}</p>
            <p>Price: ${book.price}</p>
            <p>Description: {book.description}</p>
            <p>Sales: {sales}</p>
            <div className={styles.buttonContainer}>
                <button onClick={() => onBuy(bookId)}>Buy</button>
                <button onClick={() => onDelete(bookId)}>Delete</button>
                <button onClick={onEdit}>Edit</button>
            </div>
        </div>
    );
}

export default Details;
