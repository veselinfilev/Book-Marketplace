import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import styles from "./Details.module.css";
import { deleteBook, getOneBook } from "../../services/bookService.js";
import { buyBook, getBookSales, hasAlreadyBought } from "../../services/buyService.js";
import { AuthContext } from "../../contexts/AuthContext.jsx";

const Details = () => {
    const { bookId } = useParams();
    const [book, setBook] = useState({});
    const [sales, setSales] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, userId } = useContext(AuthContext);
    const [ hasBought, setHasBought ] = useState('');

    useEffect(() => {
        getOneBook(bookId)
            .then(result => setBook(result))
    }, [bookId])

    useEffect(() => {
        getBookSales(bookId)
            .then(result => setSales(result))
    }, [bookId])

    useEffect(() => {
        getOneBook(bookId)
            .then(result => setIsOwner(result._ownerId === userId))
    }, [bookId])

    useEffect(() => {
        hasAlreadyBought(userId, bookId)
            .then(result => setHasBought(result))
    }, [bookId])

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



    const onBuy = (bookId) => {
        buyBook(bookId)
        setHasBought(1)
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
            {isAuthenticated && (

                <>
                    {isOwner && (
                        <p>Sales: {sales}</p>
                    )}
                    <div className={styles.buttonContainer}>
                        {!isOwner && hasBought<1 && (
                            <button onClick={() => onBuy(bookId)}>Buy</button>
                        )}
                        {hasBought>0 && (
                            <p className={styles.sb}>Successfuly buying</p>
                        )}
                        {isOwner && (
                            <>
                                <button onClick={() => onDelete(bookId)}>Delete</button>
                                <Link to={`/edit/${bookId}`}> <button>Edit</button></Link>
                            </>
                        )}
                    </div>
                </>
            )
            }
        </div >
    );
}

export default Details;
