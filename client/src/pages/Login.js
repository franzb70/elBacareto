import React, { useState, useEffect } from "react"
import '../App.css'
import Navbar from "../modules/Navbar"
import '../css/bootstrap.min.css'
import Popup from '../modules/Popup'
import { useNavigate } from 'react-router-dom'
import googleLogo from "../images/google.png"
import { useWindowSize } from "@uidotdev/usehooks";
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'

export default function Login() {
  const [ userGoogle, setUserGoogle ] = useState(null);
  const [ profile, setProfile ] = useState(null);
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [authResponse, setAuthResponse] = useState("")
  const [message, setMessage] = useState("")
  const [trigger, setTrigger] = useState(false)
  const [type, setType] = useState('')
  const [isLogged, setIsLogged] = useState()
  const size = useWindowSize()

  let navigate = useNavigate()  
  let pcScreen = true
  if (size.width < 12000) //  Change it to 1200 when the first level domain is available for redirtect uri
    pcScreen = false

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUserGoogle(codeResponse),
    onError: (error) => console.log('Login Failed:', error)
  })
  
  function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  function checkLogStatus() {
    setTrigger(false)
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged !== null) {
      let jsonData = JSON.parse(userLogged)
      setIsLogged(true)
      setUser(jsonData.username)
      setEmail(jsonData.user_id)
      if (jsonData.operator !== undefined)
        sessionStorage.setItem('operator', jsonData.operator)
      window.logged = true
    }
    else {
      setIsLogged(false)
      setUser('')
      setEmail('')
      window.logged = false
   }
  }

  useEffect(
    () => {
      if (userGoogle) {
        axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${userGoogle.access_token}`, {
            headers: {
                Authorization: `Bearer ${userGoogle.access_token}`,
                Accept: 'application/json'
            }
        })
        .then((res) => {
            setProfile(res.data)
            handleLogin(res.data)
        })
        .catch((err) => console.log(err));
      }
    },
    [ userGoogle ]
  )

  /*
    Google Login. It works only from PC.
  */
  const handleLogin = async (googledata) => {

    let userLogged = { "user_id":googledata.email, "username":googledata.name, "role": "admin", "operator": "1"}

    localStorage.setItem('loggedUser', JSON.stringify(userLogged))

    const res = await fetch("/logingoogle", {
        method: "POST",
        body: JSON.stringify({
        profile: googledata
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    const data = await res.json()
    let jsonData = JSON.parse(data)
    if (jsonData.isNew === 'true')
      setAuthResponse("Si è registrato come nuovo utente")
    else if (jsonData.isNew === 'false')
      setAuthResponse("Ha effettuato l'accesso")
     
     setTimeout(() => {
        setAuthResponse("")
      }, 3000)

    userLogged = { "user_id":jsonData.user_id, "username":jsonData.username, "role": jsonData.role, "operator": jsonData.operator}
    localStorage.setItem('loggedUser', JSON.stringify(userLogged))
    localStorage.setItem('token', jsonData.token)
    sessionStorage.setItem('operator', jsonData.operator)

    window.logged = true
    checkLogStatus()
}

  useEffect(() => {
    checkLogStatus()
  }, [window.logged])

  /*
  Email Login
  */
  const handleSubmitLogin = async (e) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setMessage("Formato Email non corretto")
      setType('alert')
      setTrigger(true)
      return
    }
    
    const res = await fetch('/login', {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const ret = await res.json()

    let jsonData = JSON.parse(ret)
    if (!jsonData.auth) {
      setIsLogged(false)
      localStorage.removeItem('token')
      navigate('/registrazione')
    }
    else {
      setIsLogged(true)
      localStorage.setItem('token', jsonData.token)
      sessionStorage.setItem('operator', jsonData.operator)
      setAuthResponse(" ha effettuato l'accesso")
      setTimeout(() => {
        setAuthResponse("")
      }, 3000) 

      let userLogged = { "user_id":jsonData.user_id, "username":jsonData.username, "role": jsonData.role, "operator": jsonData.operator}
      localStorage.setItem('loggedUser', JSON.stringify(userLogged))
      window.logged = true
      checkLogStatus()
    }
  }

  return (
    <div>
      <Navbar></Navbar>
      <div>
        <div className="leftPadTop">
          <h4 style={{ display: (isLogged == false) ? 'flex' : 'none' }}>Effettua l'accesso</h4>
          <h4 style={{ display: (isLogged == true) ? 'flex' : 'none' }}>Utente connesso</h4>
        </div>
        <div className={`${'leftPadTop'} ${isLogged == false ? 'hideItem': ''}`}>{user}</div>
        <div className={`${'leftPadTop'} ${isLogged == false ? 'hideItem': ''}`}><p>{authResponse}</p></div>
        <div style={{ display: (isLogged == false) ? 'flex' : 'none' }} className={`${'leftPadTop'}`}>
          <input className={`${'center'} ${'inputTextCorners'}`} value={email} placeholder="Indirizzo Email" name="email" autoComplete="email" type="email" onChange={(e) => setEmail(e.target.value.toLowerCase())}></input>
        </div>
        <div className={`${'leftPadTop'}`}>
        <button style={{ display: (isLogged == false) ? 'flex' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'}`} onClick={handleSubmitLogin}>Entra</button>
        </div>
      </div>
      <div className={`${'leftPadTop'}`} style={{ display: (pcScreen == true) ? 'flex' : 'none' }}>
        {profile ? (
          <div className={`${'pointer'}`}>
            <img src={profile.picture} alt="user image" />
          </div>
        ) : 
        (
          <div>
            <div className={`${'pointer'}`}>
              <img src={googleLogo} alt="" onClick={() => login()}></img><p></p>
            </div>
            <div className={`${'pointer'}`}>
              <h4 onClick={() => login()}>Continua con Google</h4>
            </div>
        </div>          
        )}
      </div>          
      <Popup trigger={trigger} msg= {message} setTrigger={setTrigger} type={type}>
      </Popup>
    </div>
  )
}
