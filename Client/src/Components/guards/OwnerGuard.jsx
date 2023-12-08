import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { getOneBook } from "../../services/bookService";

export default function OwnerGuard() {
    const { userId } = useContext(AuthContext);
    const { bookId } = useParams();
    const [book, setBook] = useState(null);

    useEffect(() => {
        const fetchBook = async () => {
            const bookData = await getOneBook(bookId);
            setBook(bookData);
        };

        fetchBook();
    }, [bookId]);

    if (!book) {
        return null;
    }

    if (book._ownerId !== userId) {
        return <Navigate to='/catalog' />;
    }

    return <Outlet />;
}
