const baseUrl = "http://localhost:3030/data/buy"

export const buyBook = async (bookId) => {
    const token = JSON.parse(localStorage.getItem('user')).accessToken;

    const buyBookData =
    {
        bookId
    };

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Authorization': token
        },
        body: JSON.stringify(buyBookData)
    });

    return response.status
}


export const getBookSales = async (bookId) => {
    const encodeWhereUrl = encodeURIComponent(`="${bookId}"`)

    const responce = await fetch(`${baseUrl}?where=bookId${encodeWhereUrl}`)
    const result = await responce.json()
    return result.length
}


export const currentUserBooks = async (userId) => {
    const encodeUserId = encodeURIComponent(`="${userId}"`)
    const encodedBook = encodeURIComponent('book=bookId:books')



    const responce = await fetch(`${baseUrl}?where=_ownerId${encodeUserId}&load=${encodedBook}`)
    const result = await responce.json()

    return result

}