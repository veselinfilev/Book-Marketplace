import { createContext, useState } from 'react'

import { login, register, logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({
    children,
}) => {

    const [auth, setAuth] = useState({});
    const navigate = useNavigate();


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
        const result = await register(email, password, username);
        //TODO check password and repeat password are equal

        setAuth(result);
        localStorage.setItem('user', JSON.stringify(result))

        navigate('catalog')
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