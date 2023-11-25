const baseUrl = "http://localhost:3030/data/books"

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
const token = JSON.parse(localStorage.getItem('user')).accessToken;

console.log(token);
    const response = await fetch(`${baseUrl}/${bookId}`, {
        method: "DELETE",
        headers: {
            'X-Authorization':token
        },
    });

    return response.status

}

export const buyBook = async (bookId, userId) => {
    
}

export const createBook = async (data) => {
const token = JSON.parse(localStorage.getItem('user')).accessToken;

    const bookData =
    {
        "title": data.title,
        "author": data.author,
        "genre": data.genre,
        "price": data.price,
        "description": data.description,
        "image": data.image,
        "buy": []

    };

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Authorization':token
        },
        body: JSON.stringify(bookData)
    });

    return response.status

}

export const updateBook = async (data, bookId) => {
const token = JSON.parse(localStorage.getItem('user')).accessToken;


    const bookData =
    {
       
            "_id":[bookId],
            "title": data.title,
            "author": data.author,
            "genre": data.genre,
            "price": data.price,
            "description": data.description,
            "image": data.image,
            "buy": data.buy
        
    };

    const response = await fetch(`${baseUrl}/${bookId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Authorization':token
        },
        body: JSON.stringify(bookData)
    });

    return response.status

}
