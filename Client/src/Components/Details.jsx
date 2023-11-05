import styles from "./Details.module.css"

const Details = () => {

    return (
        <div className={styles.bookDetails}>
            <h1>Book details</h1>
            <img src="book-image.jpg" alt="Book image" />
            <h2>Book name</h2>
            <p>Author: Автор</p>
            <p>Genre: Жанр</p>
            <p>Price: $19.99</p>
            <p>Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <button>Buy</button>
            <button>Delete</button>
            <button>Edit</button>
        </div>
    );
}

export default Details