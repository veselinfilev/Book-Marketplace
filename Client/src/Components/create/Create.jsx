import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Create.module.css';
import { createBook } from '../../services/bookService.js';
import isValidUrl from '../../utils/urlValidator.js';


const CreateBook = () => {

    const navigate = useNavigate();

    const [formValues, setFormValues] = useState({
        title: '',
        author: '',
        genre: '',
        image: '',
        price: '',
        description: '',
    })

    const [error, setError] = useState('')

    const changeHandler = (e) => {
        setFormValues(state => ({
            ...state,
            [e.target.name]: e.target.name == 'price' ? Number(e.target.value) : e.target.value
        }))
    }

    const onCreate = () => {

        if (Object.values(formValues).some(v => !v)) {
            setError('All fields are required')
            return
        }

        if (!isValidUrl(formValues.image)) {
            setError('Invalid URL address')
            return
        }

        if (formValues.price <= 0) {
            setError('Price must be a positive number')
            return
        }

        if (formValues.description.length < 10) {
            setError('Description must be at least 10 characters long')
            return
        }

        createBook(formValues)
            .then(response => {
                if (response == 200) {
                    navigate('/catalog')
                } else {
                    throw new Error('Unsuccessful create');
                }
            })
            .catch(error => {
                setError(error)
            });
    }


    return (
        <div className={styles.container}>
            <h2>Add new book</h2>
            <form>
                <div className={styles.formGroup}>
                    <label>Book name:</label>
                    <input type="text" name="title" value={formValues.title} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Author:</label>
                    <input type="text" name="author" value={formValues.author} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Genre:</label>
                    <input type="text" name="genre" value={formValues.genre} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Image URL:</label>
                    <input type="text" name="image" value={formValues.image} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Price:</label>
                    <input type="number" name="price" value={formValues.price} onChange={changeHandler} />
                </div>
                <div className={styles.formGroup}>
                    <label>Description:</label>
                    <textarea name="description" value={formValues.description} onChange={changeHandler} />
                </div>
                {error && (
                    <div className={styles.errorBox}>
                        <p>{error}</p>
                    </div>
                )}
                <button type="button" onClick={onCreate}>Create</button>
            </form>
        </div>
    );
};

export default CreateBook;
