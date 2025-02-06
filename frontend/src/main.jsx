import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Signup from './components/Signup.jsx'
import Login from './components/Login.jsx'
import Chat from './components/Chat.jsx'
const route=createBrowserRouter([
  {path:"/",
    element:<App/>
  }, 
  {
    path:"/signup",
    element:<Signup/>
  },
  {path:"/login",
    element:<Login/>
  },
  {
    path:"/chat",
    element:<Chat/>
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={route}/>
  </StrictMode>,
)
