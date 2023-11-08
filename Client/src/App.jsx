import { Routes, Route } from 'react-router-dom'

import Header from './Components/Header.jsx'
import Footer from './Components/Footer.jsx'
import HomePage from './Components/HomePage.jsx'
import Login from './Components/Login.jsx'
import Register from './Components/Register.jsx'
import Create from './Components/Create.jsx'
import Details from './Components/Details.jsx'
import Catalog from './Components/Catalog.jsx'

function App() {

    return (
        <>
            <Header />

            <Routes>
                <Route path='/' element={<HomePage />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/create' element={<Create />} />
                <Route path='/catalog' element={<Catalog />} />
                <Route path='/details' element={<Details />} />

            </Routes>

            <Footer />

        </>
    )
}

export default App
