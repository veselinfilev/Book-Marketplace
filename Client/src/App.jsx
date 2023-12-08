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
import AuthGuard from './Components/guards/AuthGuard.jsx'
import GuestGuard from './Components/guards/GuestGuard.jsx'
import OwnerGuard from './Components/guards/OwnerGuard.jsx'

function App() {

    return (
        <AuthProvider>
            <Header />

            <Routes>
                <Route path='/' element={<HomePage />} />
                <Route element={<GuestGuard />}>
                    <Route path='/login' element={<Login />} />
                    <Route path='/register' element={<Register />} />
                </Route>
                <Route element={<AuthGuard />}>
                    <Route path='/profile' element={<ProfilePage />} />
                    <Route path='/logout' element={<Logout />} />
                    <Route path='/create' element={<Create />} />
                    <Route element={<OwnerGuard />}>
                        <Route path='/edit/:bookId' element={<EditBook />} />
                    </Route>
                </Route>
                <Route path='/catalog' element={<Catalog />} />
                <Route path='/details/:bookId' element={<Details />} />
                <Route path='*' element={<ErrorPage />} />
            </Routes>

            <Footer />

        </AuthProvider>
    )
}

export default App
