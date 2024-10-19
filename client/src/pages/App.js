import '../App.css'
import { useState,useEffect } from 'react'
import Navbar from "../modules/Navbar"
import homePicture from "../images/home.jpg"
import { useWindowSize } from "@uidotdev/usehooks";
import { useNavigate } from 'react-router-dom'

export default function App() {
  const [startAfternoon, setStartAfternoon] = useState('15:00')
  const [endAfternoon, setEndAfternoon] = useState('19:00')
  const [configLoaded, setConfigLoaded] = useState(false)
  const [addressStreet, setAddressStreet] = useState('')
  const [addressTown, setAddressTown] = useState('')
  const [companyName, setACompanyName] = useState('')

  const size = useWindowSize()
  let navigate = useNavigate()

  let largeScreen = true
  if (size.width < 768)
        largeScreen = false

  const home = {
    backgroundImage: `url(${homePicture})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    width: '100vw',
    height: '50vh',
  }

  const getConfiguration = async () => {

    const res = await fetch('/getconfiguration', {
      method: "GET",
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const retConfig = await res.json()
    let jsonDoc = JSON.parse(retConfig)
    let config = JSON.stringify(jsonDoc[0])
    if (config !== undefined && config !== 'undefined') {
      localStorage.setItem('configuration', JSON.stringify(jsonDoc[0]))
      setConfigLoaded(true)
      window.settingsChanged = false
    }
  }

  useEffect(() => {
    getConfiguration()
    let configFile = localStorage.getItem('configuration')

    let jsonConfig = JSON.parse(configFile)
    setACompanyName(jsonConfig.companyName)
    setAddressStreet(jsonConfig.addressStreet)
    setAddressTown(jsonConfig.addressTown)

    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged !== null && userLogged !== undefined) {    
      window.logged = true
    }
    else {
      window.logged = false
    }
    let theme =  localStorage.getItem('theme')
    if (theme === 'dark')
      document.documentElement.setAttribute('data-bs-theme','dark')
    else
      document.documentElement.setAttribute('data-bs-theme','light')

  }, [])

  useEffect(() => {
    if (configLoaded === false)
      return
    
    let configFile = JSON.parse(localStorage.getItem('configuration'))

    let afterStart = configFile.startAfternoon.toString().split('.')
    if (afterStart.length > 1)
      afterStart = afterStart[0].padStart(2, "0") + ":" + afterStart[1].padEnd(2, "0")
    else
      afterStart = afterStart[0].padStart(2, "0") + ":00"
    
    let afterEnd = configFile.endAfternoon.toString().split('.')
    if (afterEnd.length > 1)
      afterEnd = afterEnd[0].padStart(2, "0") + ":" + afterEnd[1].padEnd(2, "0")
    else
      afterEnd = afterEnd[0].padStart(2, "0") + ":00"

    setStartAfternoon(afterStart)
    setEndAfternoon(afterEnd)
    setACompanyName(configFile.companyName)
    setAddressStreet(configFile.addressStreet)
    setAddressTown(configFile.addressTown)

  }, [configLoaded])

  const bookNow = () => {
    navigate('/ordine')
  }

  return (
    <div>
      <Navbar></Navbar>
      <div style={home}>
        <div className={`${'col-sm-12'} ${'center'}`}>
          <h1 className='appHome'>{companyName}</h1>
        </div>
      </div>
      <div className={`${'row'} ${'leftNoPad'}`}>
        <div className={`${'col'} ${'titleLeft'}`}>
          <h4>Dove ci trovi</h4>
        </div>
        <div className={`${'col'} ${'titleLeft'}`}>
          <button className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'} ${'rightPadTop'}`} onClick={bookNow}>Prenota ora</button>
        </div>
      </div>
      <div className={`${'row'} ${'leftNoPad'}`}>
        <div className='col pb-4'>
        <label><b>Lunedì</b></label><br></br>
        <label>Chiuso</label>
        </div>
        <div className='col'>
        <label><b>Martedì</b></label><br></br>
        <label>{startAfternoon} - {endAfternoon}</label><br></br>
        </div>
      </div>
      <div className={`${'row'} ${'leftNoPad'} ${'border-top'}`}>
        <div className='col'>
        <label><b>Mercoledì</b></label><br></br>
        <label>{startAfternoon} - {endAfternoon}</label><br></br>
        </div>
        <div className='col'>
        <label><b>Giovedì</b></label><br></br>
        <label>{startAfternoon} - {endAfternoon}</label><br></br>
        </div>
      </div>
      <div className={`${'row'} ${'leftNoPad'} ${'border-top'}`}>
        <div className='col'>
        <label><b>Venerdì</b></label><br></br>
        <label>{startAfternoon} - {endAfternoon}</label><br></br>
        </div>
        <div className='col'>
        <label><b>Sabato</b></label><br></br>
        <label>{startAfternoon} - {endAfternoon}</label><br></br>
        </div>
      </div>
      <div className={`${'row'} ${'leftNoPad'} ${'border-top'}`}>
      <div className='col'>
        <label><b>Domenica</b></label><br></br>
        <label>{startAfternoon} - {endAfternoon}</label><br></br>
        </div>
        <div className='col'>
        <label><b>Indirizzo</b></label><br></br>
        <label>{addressStreet}</label><br></br>
        <label>{addressTown}</label>
        </div>
      </div>
      <div className={`${'row'} ${'leftPadTop'} ${'googleMap'}`}>
      <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d704.7120351772816!2d12.062366751584255!3d45.04830343214978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x477e8c11b0281c01%3A0x98a1f30033605d3b!2sNew%20Center%20Gym%20Plus!5e0!3m2!1sit!2sit!4v1717856763990!5m2!1sit!2sit"
        width="600" 
        height="300" 
        style={{ border: "0" }} 
        allowFullScreen="" 
        loading="lazy">
        </iframe>
      </div>
    </div>
  )
}
