import styles from './Register.module.css';

const Register = () => {
    return (

            <div className={styles.registerContainer}>
                <h2>Register</h2>

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
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"

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
                    <div className={styles.inputGroup}>
                        <label htmlFor="repass">Repeat Password:</label>
                        <input
                            type="password"
                            id="repass"
                            name="repass"

                        />
                    </div>
                    <button type="submit" className={styles.registerButton}>Register</button>
                </form>
            </div>
    );
}

export default Register;
