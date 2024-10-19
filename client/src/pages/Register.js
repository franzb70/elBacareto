import React, { useState, useEffect } from "react"
import '../App.css'
import axios from 'axios'
import Navbar from "../modules/Navbar"
import '../css/bootstrap.min.css'
import Popup from '../modules/Popup'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [authResponse, setAuthResponse] = useState("")
  const [message, setMessage] = useState("")
  const [trigger, setTrigger] = useState(false)
  const [type, setType] = useState('')
  const [isLogged, setIsLogged] = useState(false)

  let navigate = useNavigate()  

  function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  function validateNameSurname(user) {
    let space = user.indexOf(' ')
    if (space > 0 && space < (user.length - 1))
      return true
    else
      return false
  }

  function checkLogStatus() {
    setTrigger(false)
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged !== null) {
      let jsonData = JSON.parse(userLogged)
      setUser(jsonData.username)
      setEmail(jsonData.user_id)
      window.logged = true
    }
    else {
      setUser('')
      setEmail('')
      window.logged = false
   }
  }

  useEffect(() => {
    checkLogStatus()
  }, [window.logged])

  const handleSubmitRegistration = (e) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setMessage("Formato Email non corretto")
      setType('alert')
      setTrigger(true)
      return
    }

    if (!validateNameSurname(user)) {
      setMessage("Formato Nome/Cognome")
      setType('alert')
      setTrigger(true)
      return
    }
    
    axios.post("/register", {
      user: user, email: email,
    }).then((response) => {
      let jsonData = JSON.parse(response.data)
      if (!jsonData.auth) {
        localStorage.removeItem('token')
        setIsLogged(false)
      }
      else {
        setIsLogged(true)
        localStorage.setItem('token', jsonData.token)
        setAuthResponse(" si è registrato come nuovo utente")
        setTimeout(() => {
          setAuthResponse("")
        }, 3000) 

        let userLogged = { "user_id":email, "username":user, "role": "user"}
        localStorage.setItem('loggedUser', JSON.stringify(userLogged))
        window.logged = true
        checkLogStatus()
        navigate('/login')
      }
    })
  }

  return (
    <div>
      <Navbar></Navbar>
      <div>
        <div className="leftPadTop">
          <h4>Registrati</h4>
        </div>
        <div className={`${'leftPadTop'} ${isLogged == false ? 'hideItem': ''}`}>
          <p>{user}{authResponse}</p>
          <br />
        </div>
        <div className={`${'leftPadTop'}`}>
          <input className={`${'center'} ${'inputTextCorners'}`} value={email} placeholder="Indirizzo Email" name="email" autoComplete="email" type="email" onChange={(e) => setEmail(e.target.value.toLowerCase())}></input>
        </div>
        <div className={`${'leftPadTop'}`}>
          <input className={`${'center'} ${'inputTextCorners'}`} value={user} placeholder="Nome Cognome" name="user" type="text" onChange={(e) => setUser(e.target.value.toUpperCase())}></input>
        </div>
        <div className={`${'leftPadTop'}`}>
        <button className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'}`} onClick={handleSubmitRegistration}>Registrati</button>
        </div>
      </div>          
      <Popup trigger={trigger} msg= {message} setTrigger={setTrigger} type={type}>
      </Popup>
    </div>
  )
}
