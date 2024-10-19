import { useState, useEffect } from 'react'
import '../App.css'
import '../css/bootstrap.min.css'
import Navbar from "../modules/Navbar.js"
import Form from 'react-bootstrap/Form'
import { useNavigate } from 'react-router-dom'

function Settings() {
  const [sendEmail, setSendEmail] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [askConfirmation, setAskConfirmation] = useState(false)
  const [enableCheckout, setEnableCheckout] = useState(true)
  let navigate = useNavigate()  

  useEffect(() => {
    let userLogged = localStorage.getItem('loggedUser')

    if (userLogged !== null) {
      let jsonData = JSON.parse(userLogged)
      if (jsonData.role === 'admin' || jsonData.role === 'operator')
        setIsAdmin(true)
    }

    let emailToSend =  localStorage.getItem('sendEmail')
    if (emailToSend === 'true')
      setSendEmail(true)
    else
      setSendEmail(false)

    let askConf =  localStorage.getItem('askConfirmation')
    if (askConf === 'true')
      setAskConfirmation(true)
    else
      setAskConfirmation(false)
  
      let checkout =  localStorage.getItem('enableCheckout')
    if (checkout === 'true')
      setEnableCheckout(true)
    else
      setEnableCheckout(false)
  
      let theme =  localStorage.getItem('theme')
    if (theme === 'dark')
      setIsDark(true)
    else
      setIsDark(false)
    }, [])

  useEffect(() => {
    if (window.forcelogout === true) {
      window.forcelogout = false
      navigate('/')
    }
  }, [window.forcelogout])

  const handleSetEmailSending = (e) => {
    let status = e.target.checked
    setSendEmail(status)
    localStorage.setItem('sendEmail', status)
  }

  const handleSetEnableCheckout = (e) => {
    let status = e.target.checked
    setEnableCheckout(status)
    localStorage.setItem('enableCheckout', status)
  }   

  const handleSetAskConfirmation = (e) => {
    let status = e.target.checked
    setAskConfirmation(status)
    localStorage.setItem('askConfirmation', status)
  }   

  const handleSetTheme = (e) => {
    let status = e.target.checked
    if (status === true) {
      document.documentElement.setAttribute('data-bs-theme','dark')
      localStorage.setItem('theme', 'dark')
    }
    else {
      document.documentElement.setAttribute('data-bs-theme','light')
      localStorage.setItem('theme', 'light')
    }
    setIsDark(status)
  }

  const handleGoToBookings = () => {
    navigate('/admin')
  }

  const handleLoadConfig = async () => {
    const res = await fetch('/getconfiguration', {
      method: "GET",
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const retConfig = await res.json()
    let jsonDoc = JSON.parse(retConfig)
    localStorage.setItem('configuration', JSON.stringify(jsonDoc[0]))
    window.settingsChanged = true
  }

  return (
    <div>
      <Navbar></Navbar>
      <h4 className="titleLeft">Impostazioni</h4>
      <div className='leftPadTop'>
      <Form>
      <Form.Check
        type="switch"
        id="email"
        label="Abilita spedizione e-mail di notifica"
        checked={sendEmail}
        onChange={(e) => handleSetEmailSending(e)}
      />
      <p><div className={`${'tableSpace'}`}></div></p>
      <div>
      <Form.Check
        type="switch"
        id="theme"
        label="Scegli sfondo scuro"
        checked={isDark}
        onChange={(e) => handleSetTheme(e)}
      />        
      </div>
      <p><div className={`${'tableSpace'}`}></div></p>
      <div style={{ display: (isAdmin == true) ? 'flex' : 'none' }} >
      <Form.Check
        type="switch"
        id="confirmation"
        label="Richiedi conferma di prenotazione"
        checked={askConfirmation}
        onChange={(e) => handleSetAskConfirmation(e)}
      />
      </div>
      <p><div className={`${'tableSpace'}`}></div></p>
      <div style={{ display: (isAdmin == true) ? 'flex' : 'none' }} >
      <Form.Check
        type="switch"
        id="checkout"
        label="Abilita pagamento da App"
        checked={enableCheckout}
        onChange={(e) => handleSetEnableCheckout(e)}
      />
      </div>
       </Form>
       </div>
       <p><div className={`${'tableSpace'}`}></div></p>
       <div className={`${'leftPadTop'}`}>
         <button style={{ display: (isAdmin == true) ? 'flex' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustomSettings'}`} onClick={handleGoToBookings}>Gestisci Prenotazioni</button>
       </div>
       <div className={`${'tableSpace'}`}></div>
       <div className={`${'leftPadTop'}`}>
         <button style={{ display: (isAdmin == true) ? 'flex' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustomSettings'}`} onClick={handleLoadConfig}>Ricarica Configurazione</button>
       </div>
    </div>    
  )
}

export default Settings
