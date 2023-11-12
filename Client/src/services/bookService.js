const baseUrl = "http://localhost:3030/jsonstore/books"

export const getAllBook = async () => {

    const response = await fetch(baseUrl);
    const result = await response.json();
    const data = Object.values(result);

    return data;
}

export const getOneBook = async (bookId) => {
    const response = await fetch(`${baseUrl}/${bookId}`);
    const result = await response.json();

    return result;
}

export const deleteBook = async (bookId) => {

    const response = await fetch(`${baseUrl}/${bookId}`, {
        method: "DELETE"
    });

    return response.status

}

export const buyBook = async (bookId, userId) => {

}

export const createBook = async (data) => {


    const bookData =
    {
            "name": data.title,
            "author": data.author,
            "genre": data.genre,
            "price": data.price,
            "description": data.description,
            "imageUrl": data.image,
            buy: []
        
    };

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
    });

    return response.status

}
