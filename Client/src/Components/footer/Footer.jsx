import styles from "./Footer.module.css"

const Footer = () => {
    return (
        <footer>
            <div className={styles.footerContent}>
                <p>&copy; 2023 Book Store</p>
                <ul>
                    <li><a href="#">Terms of Use</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                </ul>
            </div>
        </footer>
    );
}

export default Footer
