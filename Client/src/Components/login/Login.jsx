import { Link } from 'react-router-dom'
import { useState, useContext } from 'react';

import styles from './Login.module.css';
import { AuthContext } from '../../contexts/AuthContext';

const Login = () => {

    const { onLogin } = useContext(AuthContext)

    const [formValues, setFormValues] = useState({
        email: '',
        password: ''
    })

    const changeHandler = (e) => {
        setFormValues(state => ({
            ...state,
            [e.target.name]: e.target.value
        }))
    }

    const submitHandler = (e) => {
        e.preventDefault();
        onLogin(formValues.email, formValues.password);
    };


    return (

        <div className={styles.loginContainer}>
            <h2>Login</h2>
            <form onSubmit={submitHandler}>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="text"
                        id="email"
                        name="email"
                        value={formValues.email}
                        onChange={changeHandler}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formValues.password}
                        onChange={changeHandler}
                    />
                </div>
                <button type="submit" className={styles.loginButton}>Login</button>
            </form>
            <p>If you don't have registration <Link to="/register">click here</Link> </p>
        </div>
    );
}

export default Login;
