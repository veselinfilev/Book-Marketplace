import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';

import styles from './Register.module.css';
import { AuthContext } from '../../contexts/AuthContext';

const Register = () => {

    const {onRegister} = useContext(AuthContext)

    const [formValues, setFormValues] = useState({
        email:'',
        username:'',
        password:'',
        repass:''
    })

    const changeHandler = (e) => {
        setFormValues(state => ({
            ...state,
            [e.target.name]:e.target.value
        }))
    }

    const submitHandler = (e) => {
        e.preventDefault();
        onRegister(formValues.email, formValues.password,formValues.username);
    };



    return (

            <div className={styles.registerContainer}>
                <h2>Register</h2>

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
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formValues.username}
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
                    <div className={styles.inputGroup}>
                        <label htmlFor="repass">Repeat Password:</label>
                        <input
                            type="password"
                            id="repass"
                            name="repass"
                            value={formValues.repass}
                            onChange={changeHandler}
                        />
                    </div>
                    <button type="submit" className={styles.registerButton}>Register</button>
                </form>
                <p>If you have registration <Link to="/login">click here</Link> </p>
            </div>
    );
}

export default Register;
