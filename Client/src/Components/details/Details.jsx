import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { AuthContext } from "../../contexts/AuthContext.jsx";

import styles from "./Details.module.css";
import { deleteBook, getOneBook } from "../../services/bookService.js";
import { buyBook, getBookSales, hasAlreadyBought } from "../../services/buyService.js";
import DeleteModal from "./DeleteModal.jsx";

const Details = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState({});
    const [sales, setSales] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [hasBought, setHasBought] = useState('');
    const [showModal, setShowModal] = useState(false);
    const { isAuthenticated, userId } = useContext(AuthContext);


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
        if (isOwner) {
            deleteBook(bookId)
                .then(response => {
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
        } else {
            navigate('/catalog')
        }
    }

    const handleDeleteClick = (bookId) => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const onBuy = (bookId) => {
        if (isOwner) {
            navigate('/catalog')
        }
        if (hasAlreadyBought > 0) {
            navigate('/catalog')
        }
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
                        {!isOwner && hasBought < 1 && (
                            <button onClick={() => onBuy(bookId)}>Buy</button>
                        )}
                        {hasBought > 0 && (
                            <p className={styles.sb}>Successfuly buying</p>
                        )}
                        {isOwner && (
                            <>
                                <button onClick={() => handleDeleteClick(bookId)}>Delete</button>

                                {showModal && (
                                    <DeleteModal
                                        onDelete={onDelete}
                                        bookId={bookId}
                                        onClose={handleCloseModal}
                                    />
                                )}


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
