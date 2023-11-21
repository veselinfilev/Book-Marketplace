import { useContext, useEffect } from "react"
import { logout } from "../../services/authService"
import { AuthContext } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom";

export default function Logout() {
    const navigate = useNavigate();
    const { onLogout } = useContext(AuthContext);

    useEffect(() => {
        logout()
            .then(() => {
                onLogout();
                navigate('/');
            })
            .catch(() => navigate('/'));
    }, []);

    return null;
}
