import React from 'react'
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate=useNavigate()
  const handleClick=()=>{
    navigate("/signup")
  }
  return (
  
    <div id='homepage'>
      <h1>Pager</h1>
      <button onClick={handleClick}>Get Started</button>
      <h2>Let's start Paging</h2>
    </div>
   
  )
}

export default App