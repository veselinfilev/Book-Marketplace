import styles from './Login.module.css';

const Login = () => {
    return (

            <div className={styles.loginContainer}>
                <h2>Login</h2>
                <form >
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="text"
                            id="email"
                            name="email"

                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"

                        />
                    </div>
                    <button type="submit" className={styles.loginButton}>Login</button>
                </form>
            </div>
    );
}

export default Login;
