import { Link } from "react-router-dom";

import styles from "./Header.module.css"
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

const Header = () => {

    const { isAuthenticated } = useContext(AuthContext)

    return (
        <header>
            <nav>
                <ul>
                    <li><Link to="/"><img src="./images.png" alt="logo" /></Link></li>
                    <li> <Link to="/">Book store</Link></li>
                    <li><Link to="/catalog">Catalog</Link></li>
                    {isAuthenticated && (
                        <>
                            <li><Link to="/create">Create</Link></li>
                            <li><Link to="/profile">Profile</Link></li>
                            <li><Link to="/logout">Logout</Link></li>
                        </>
                    )}
                    {!isAuthenticated && (
                        <>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/register">Register</Link></li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
}


export default Header