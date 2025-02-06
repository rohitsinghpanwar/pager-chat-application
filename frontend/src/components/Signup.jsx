import React from 'react'
import { useState } from 'react'
import axios from "axios"
import { useNavigate } from 'react-router-dom'
function Signup() {
    const navigate=useNavigate()
    const [formdata, Setformdata] = useState({
        username: "",
        email: "",
        password: "",
    })
    const handleInput = (e) => {
        Setformdata({ ...formdata, [e.target.name]: e.target.value });
    }
    const handleLogin=()=>{
        navigate("/login")
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://pager-chat-application-gqz1.vercel.app/signup", formdata);
            alert("form submitted successfully");
            localStorage.setItem('username',formdata.username)
            navigate("/chat")
        }
        catch {
            alert("failed to submit the form")
        }
    }
    return (
        <div className='signupcontainer'>
        <form onSubmit={handleSubmit} id='signup'>
            <label>Username:<input type="text"  name='username' id='username' value={formdata.username} onChange={handleInput} required/></label>
            <label>Email:<input type="email" name="email" id="email" value={formdata.email} required onChange={handleInput} /></label>
            <label>Password:<input type="password" name='password' id='password' value={formdata.password} required onChange={handleInput} /></label>
            <button type="submit">SignUp</button>
        </form> 
        <button onClick={handleLogin}>LogIn</button>
        </div>
    )
}

export default Signup