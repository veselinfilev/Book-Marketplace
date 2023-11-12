import { Link } from "react-router-dom";

import "../Components/Header.module.css"

const Header = () => {
    return (
        <header>
            <nav>
                <ul>
                    <li><Link to="/"><img src="./images.png" alt="Описание на снимката" /></Link></li>
                    <li> <Link to="/">Book store</Link></li>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/register">Register</Link></li>
                    <li><Link to="/logout">Logout</Link></li>
                    <li><Link to="/catalog">Catalog</Link></li>
                    <li><Link to="/create">Create</Link></li>
                </ul>
            </nav>
        </header>
    );
}


export default Header