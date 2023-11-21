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
        const result = await login(email, password);

        setAuth(result);
        localStorage.setItem('accessToken', result.accessToken)

        navigate('/catalog')
    }

    const onRegister = async (email, password, username) => {
        const result = await register(email, password, username);
        //TODO check password and repeat password are equal

        setAuth(result);
        localStorage.setItem('accessToken', result.accessToken)

        navigate('catalog')
    }

    const onLogout = () => {

        setAuth({})
        localStorage.removeItem('accessToken')
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