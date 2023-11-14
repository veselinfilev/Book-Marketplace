import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Create.module.css';
import { createBook } from '../../services/bookService.js';


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

    const changeHandler = (e) => {
        setFormValues(state => ({
            ...state,
            [e.target.name]: e.target.name == 'price' ? Number(e.target.value) : e.target.value
        }))
    }

    const onCreate = () => {
        createBook(formValues)
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
                <button type="button" onClick={onCreate}>Create</button>
            </form>
        </div>
    );
};

export default CreateBook;
