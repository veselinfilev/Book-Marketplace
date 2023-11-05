import "../Components/Header.module.css"

const Header = () =>{
    return(
        <header>
        <nav>
            <ul>
                <li><a href="#">Login</a></li>
                <li><a href="#">Register</a></li>
                <li><a href="#">Logout</a></li>
                <li><a href="#">Catalog</a></li>
                <li><a href="#">Create</a></li>
            </ul>
        </nav>
    </header>
    );
}


export default Header