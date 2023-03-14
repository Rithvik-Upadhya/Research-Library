import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Homepage from './components/Homepage'
import useScript from './hooks/useScript'
import './index.css'

function App() {
  useScript('/js/index.js')
  return (
    <>
    <Header />
    <main id="content">
      <Homepage />
    </main>
    <Footer />
    </>
  )
}

export default App
