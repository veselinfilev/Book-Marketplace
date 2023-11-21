import './App.css'
import { Routes, Route } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext.jsx'

import Header from './Components/header/Header.jsx'
import Footer from './Components/footer/Footer.jsx'
import HomePage from './Components/home/HomePage.jsx'
import Login from './Components/login/Login.jsx'
import Register from './Components/register/Register.jsx'
import Create from './Components/create/Create.jsx'
import Details from './Components/details/Details.jsx'
import Catalog from './Components/catalog/Catalog.jsx'
import ErrorPage from './Components/error/ErrorPage.jsx'
import EditBook from './Components/edit/EditBook.jsx'
import ProfilePage from './Components/profile/Profile.jsx'
import Logout from './Components/logout/Logout.jsx'

function App() {

    return (
        <AuthProvider>
                <Header />

                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='/profile' element={<ProfilePage />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/register' element={<Register />} />
                    <Route path='/logout' element={<Logout />} />
                    <Route path='/create' element={<Create />} />
                    <Route path='/catalog' element={<Catalog />} />
                    <Route path='/details/:bookId' element={<Details />} />
                    <Route path='/edit/:bookId' element={<EditBook />} />
                    <Route path='*' element={<ErrorPage />} />


                </Routes>

                <Footer />

        </AuthProvider>
    )
}

export default App
