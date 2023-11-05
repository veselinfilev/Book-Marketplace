const BookDetails = () => {

    return (
        <div className="book-details">
            <h1>Детайли на книгата</h1>
            <img src="book-image.jpg" alt="Снимка на книгата" />
            <h2>Име на книгата</h2>
            <p>Автор: Автор</p>
            <p>Жанр: Жанр</p>
            <p>Цена: $19.99</p>
            <p>Описание: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <button>Купи</button>
            <button>Изтий</button>
            <button>Редактирай</button>
        </div>
    );
}

export default BookDetails