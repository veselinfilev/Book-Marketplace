import { createContext } from 'react'

import { login, register, logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import usePersistedState from '../hooks/UsePersistedState';

export const AuthContext = createContext();

export const AuthProvider = ({
    children,
}) => {

    const navigate = useNavigate();
    const [auth, setAuth] = usePersistedState('user', {});


    const onLogin = async (email, password) => {
        try {
            const result = await login(email, password);

            if (result.code === 403) {
                throw new Error('Email or password don\'t match')
            } else {

                setAuth(result);
                localStorage.setItem('user', JSON.stringify(result))

                navigate('/catalog')
            }
        } catch (error) {
            return error
        }

    }

    const onRegister = async (email, password, username) => {
        try {
            const result = await register(email, password, username);

            if (result.code === 400) {
                throw new Error('All fields are required')
            } else if (result.code === 409) {
                throw new Error('This email already exists')
            } else {

                setAuth(result);
                localStorage.setItem('user', JSON.stringify(result))

                navigate('catalog')
            }
        } catch (error) {
            return error
        }
    }

    const onLogout = () => {

        setAuth({})
        localStorage.removeItem('user')
    }

    const contextValues = {
        onLogin,
        onRegister,
        onLogout,
        userId: auth._id,
        token: auth.accessToken,
        userEmail: auth.email,
        username: auth.username,
        isAuthenticated: !!auth.accessToken
    }



    return (
        <>
            <AuthContext.Provider value={contextValues}>
                {children}
            </AuthContext.Provider>
        </>
    );

}