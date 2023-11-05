import styles from './Create.module.css';

const CreateBook = () => {
    return (
        <div className={styles.container}>
            <h2>Add new book</h2>
            <form>
                <div className={styles.formGroup}>
                    <label>Book name:</label>
                    <input type="text" name="title" />
                </div>
                <div className={styles.formGroup}>
                    <label>Author:</label>
                    <input type="text" name="author" />
                </div>
                <div className={styles.formGroup}>
                    <label>Genre:</label>
                    <input type="text" name="genre" />
                </div>
                <div className={styles.formGroup}>
                    <label>Image URL:</label>
                    <input type="text" name="image" />
                </div>
                <div className={styles.formGroup}>
                    <label>Price:</label>
                    <input type="text" name="price" />
                </div>
                <div className={styles.formGroup}>
                    <label>Description:</label>
                    <textarea name="description" />
                </div>
                <button type="button">Create</button>
            </form>
        </div>
    );
};

export default CreateBook;
