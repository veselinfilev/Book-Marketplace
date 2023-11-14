import styles from "./HomePage.module.css"

const HomePage = () => {
    return (
            
            <div className={styles.homePage}>
               
                <div className={styles.textOverlay}>
                    <h1>Welcome to our online book store!</h1>
                    <p>Discover a rich variety of literary masterpieces, from classic novels to the latest bestsellers. We believe in the power of words and offer books that will inspire and captivate you. Explore our collection and find your next favorite book!</p>
                </div>
            </div>
    );
}

export default HomePage