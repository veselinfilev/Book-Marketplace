import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';

import styles from './Register.module.css';
import { AuthContext } from '../../contexts/AuthContext';
import isValidEmail from '../../utils/emailValidator';

const Register = () => {

    const { onRegister } = useContext(AuthContext)

    const [formValues, setFormValues] = useState({
        email: '',
        username: '',
        password: '',
        repass: ''
    })

    const [error, setError] = useState('')

    const [showPassword, setShowPassword] = useState({
        'password': false,
        'repass': false
    });

    const toggleShowPassword = (field) => {
        setShowPassword((prevState) => ({
          ...prevState,
          [field]: !prevState[field]
        }));
      };

    const changeHandler = (e) => {
        setFormValues(state => ({
            ...state,
            [e.target.name]: e.target.value
        }))
    }

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!isValidEmail(formValues.email)) {
            setError('Invalid email address')
            return
        }

        if (Object.values(formValues).some(v => !v)) {
            setError('All fields are required')
            return
        }

        if (formValues.password !== formValues.repass) {
            setError('Password and repeat password must mach');
            return
        }

        const registerError = await onRegister(formValues.email, formValues.password, formValues.username);
        if (registerError) {
            setError(registerError.message)
        }
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
                        type={showPassword.password ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formValues.password}
                        onChange={changeHandler}
                    />
                    <button
                        type="button"
                        className={`${styles.showPasswordButton}`}
                        onClick={() => toggleShowPassword('password')}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="repass">Repeat Password:</label>
                    <input
                        type={showPassword.repass ? 'text' : 'password'}
                        id="repass"
                        name="repass"
                        value={formValues.repass}
                        onChange={changeHandler}
                    />
                     <button
                        type="button"
                        className={`${styles.showRepassButton}`}
                        onClick={() => toggleShowPassword('repass')}
                    />
                </div>

                {error && (
                    <div className={styles.errorBox}>
                        <p>{error}</p>
                    </div>
                )}

                <button type="submit" className={styles.registerButton}>Register</button>
            </form>
            <p>If you have registration <Link to="/login">click here</Link> </p>
        </div>
    );
}

export default Register;
