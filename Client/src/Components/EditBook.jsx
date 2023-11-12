import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Create.module.css';
import { createBook } from '../services/bookService.js';


const EditBook = ({ location }) => {
    const navigate = useNavigate();
    const book = location.state;

    const [editBook, setEditBook] = useState({
        title: book.title,
        author: book.author,
        genre: book.genre,
        image: book.imageUrl,
        price: book.price,
        description: book.description,
    });

    const changeHandler = (e) => {
        setEditBook(state => ({
            ...state,
            [e.target.name]: e.target.name == 'price' ? Number(e.target.value) : e.target.value
        }))
    }

    const onEdit = () => {
        createBook(editBook)
            .then(response => {
                console.log(response);
                if (response == 200) {
                    navigate('/catalog')
                } else {
                    throw new Error('Unsuccessful create');
                }
            })
            .catch(error => {
                console.log(error);
            });
    }


    return (
        <div className={styles.container}>
            <h2>Edit book</h2>
            <form>
                <div className={styles.formGroup}>
                    <label>Book name:</label>
                    <input type="text" name="title" value={editBook.title} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Author:</label>
                    <input type="text" name="author" value={editBook.author} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Genre:</label>
                    <input type="text" name="genre" value={editBook.genre} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Image URL:</label>
                    <input type="text" name="image" value={editBook.image} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Price:</label>
                    <input type="number" name="price" value={editBook.price} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Description:</label>
                    <textarea name="description" value={editBook.description} onChange={changeHandler} />
                </div>
                <button type="button" onClick={onEdit}>Save changes</button>
            </form>
        </div>
    );
};

export default EditBook;
