import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [status,setstatus]=useState(false)
  const [formdata, setFormdata] = useState({
    username: "",
    password: "",
  });


  const handleInput = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };
  const handleSignup=()=>{
    navigate("/signup")
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post("http://localhost:5000/login", formdata);
      alert('Login successfully')
      localStorage.setItem('username',formdata.username)
      navigate("/chat"); 
    } catch (error) {
      alert("Login failed: " + (error.response ? error.response.data.message : "Unknown error"));
    }
  };
  

  return (
    <div className="logincontainer">
    <form onSubmit={handleSubmit} id="login">
      <label>
        Username:
        <input type="text" name="username" value={formdata.username} onChange={handleInput} required />
      </label>
      <label>
        Password:
        <input type="password" name="password" value={formdata.password} onChange={handleInput} required/>
      </label>
      <button type="submit">LogIn</button>
    </form>
    <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Login;
