import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export default function AuthGuard() {
    const { isAuthenticated } = useContext(AuthContext);

    console.log(`Auth: ${isAuthenticated}`);

    if (!isAuthenticated) {
        return <Navigate to='/login' />
    }

    return <Outlet />;
}