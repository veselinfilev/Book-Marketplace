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

export const deleteBook = async (bookId) =>{

    const response = await fetch(`${baseUrl}/${bookId}`,{
        method:"DELETE"
    });

    return response.status

}

export const buyBook = async (bookId,userId)=>{

}

export const create = async (bookId,userId)=>{

}
