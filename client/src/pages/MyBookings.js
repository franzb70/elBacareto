import { useState, useEffect } from 'react'
import '../App.css'
import '../css/bootstrap.min.css'
import {Booking as Booking} from '../modules/Booking.js'
import Navbar from "../modules/Navbar.js"
import Popup from '../modules/Popup.js'
import { useNavigate } from 'react-router-dom'
import {ServiceItem as ServiceItem} from '../modules/Booking.js'

export default function BookingCalendar() {
  const [bookingDone, setBookingDone] = useState([])
  const [bookingNext, setBookingNext] = useState([])
  const [bookingNextIndex, setBookingNextIndex] = useState([])
  const [hasHistory, setHasHistory] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [message, setMessage] = useState("")
  const [trigger, setTrigger] = useState(false)
  const [type, setType] = useState('')

  let navigate = useNavigate()  

  let myBookingsDone = []
  let myBookingsNext = []
  let myBookingsNextIndex = []
  let configFile = require('../configuration.json')

  let slotDuration = 30

  const fetchBookings = async () => {
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged == null) {
      setTrigger(true)
      setType('alert')
      setMessage("Effettuare l'accesso!")
      return
    }
    
    let jsonData = JSON.parse(userLogged)
    let user_id = jsonData.user_id
    const res = await fetch('/mybookings', {
      method: "POST",
      body: JSON.stringify({ user_id }),
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const ret = await res.json()

    myBookingsDone = []
    myBookingsNext = []
    myBookingsNextIndex = []
    let slotsNr = 0
    if (ret.length > 2) {
      let jsonData = JSON.parse(ret)
      slotsNr += 1
      for (let i = 0; i < jsonData.length; i++) {
        if (jsonData[i].slot > 0) {
          slotsNr += 1
          continue
        }
        let price = jsonData[i].price.slice(0, -1)
        if (slotDuration === 30)
          price = Number(price) * slotsNr/2
        else
          price = Number(price) * slotsNr

        let serviceNamePrice = jsonData[i].service_name +  " - " + price + "€"

        let aBooking = new Booking(
          jsonData[i]._id,
          jsonData[i].operator, 
          jsonData[i].user_id, 
          serviceNamePrice, 
          jsonData[i].year, 
          jsonData[i].month, 
          jsonData[i].day, 
          jsonData[i].sHour.toString().padStart(2, "0"), 
          jsonData[i].sMin.toString().padStart(2, "0"),
          jsonData[i].duration,
          jsonData[i].done,
          jsonData[i].status,
          jsonData[i].price
        )
        
        if (jsonData[i].done === true) {
          myBookingsDone.push(aBooking)
          setHasHistory(true)
        }
        else {
          myBookingsNext.push(aBooking)
          myBookingsNextIndex.push(jsonData[i]._id)
          setHasNext(true)
        }
      }
      setBookingNextIndex(myBookingsNextIndex)
      setBookingDone(myBookingsDone)
      setBookingNext(myBookingsNext)
    }
    else
      setBookingNext([])
  }

  useEffect(() => {
    slotDuration = configFile.slotDuration
    fetchBookings()
  }, [])

  useEffect(() => {
    if (window.forcelogout === true) {
      window.forcelogout = false
      navigate('/')
    }
  }, [window.forcelogout])
  
  const handleDelete = async (index) => {
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged == null) {
      setTrigger(true)
      setType('alert')
      setMessage("Effettuare l'accesso!")
      return
    }

    let emailToSend =  localStorage.getItem('sendEmail')
    if (emailToSend === undefined || emailToSend === null)
      emailToSend = 'false'
    
    let jsonData = JSON.parse(userLogged)
    let user_id = jsonData.user_id
    let id = bookingNextIndex[index]
    const res = await fetch('/delete', {
      method: "POST",
      body: JSON.stringify({ id, user_id, emailToSend }),
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const sts = await res.status
    if (sts !== 200) {
      setTrigger(true)
      setType('alert')
      setMessage("Cancellazione non riuscita!")
    }
    else {
      setTrigger(true)
      setType('info')
      setTimeout(() => {
        setTrigger(false)
      }, 3000) 

      setMessage("Cancellazione riuscita!")
      setTimeout(() => { fetchBookings() }, 1500) 
    }
  }
  
  const getSlotId = async (bookingID) => {

  const res = await fetch("/getslotid", {
      method: "POST",
      body: JSON.stringify({ bookingID }),
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const retData = await res.json()
    let jsonData = JSON.parse(retData)
    return jsonData.slot_id
  }

  const handlePayNow = async (index) => {
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged == null) {
      setTrigger(true)
      setType('alert')
      setMessage("Effettuare l'accesso!")
      return
    }

    let service = bookingNext[index].service_name.split(' - ')[0]
    let price = bookingNext[index].service_name.split(' - ')[1]

    let service_id = ""
    for (let i = 0; i < configFile.services.length; i++) { 
      if (configFile.services[i].name == service) {
        service_id = i+1
      }
    }

    let aServiceItem = new ServiceItem(service_id, service, price, bookingNext[index].duration)
    sessionStorage.setItem('theOrder', JSON.stringify(aServiceItem))
    let id = bookingNextIndex[index]

    let slot = await getSlotId(id)
    navigate('/pagaora', { state: {slot_id: slot} })
  }

  return (
    <div>
      <Navbar></Navbar>
      <h4 className={`${'titleLeft'} ${hasNext == false ? 'hideItem': ''}`}>Prossime prenotazioni</h4><p></p>
      <div className='row'>
          <div className='col'>
          {bookingNext.map((item, index) => (
            <div key={index}>
            <div className='timeList' style={{ display: (item.operator === '') ? 'block' : 'none' }} >
              <b>{item.service_name}</b> il {item.day.toString().padStart(2, "0")}/{item.month.toString().padStart(2, "0")}/{item.year} h {item.sHour}:{item.sMin}     
              <span style={{ display: (item.status !== 'paid') ? 'none' : 'block' }} className={`paidService`}>Già pagato</span>
            </div>
            <div className='timeList' style={{ display: (item.operator !== '') ? 'block' : 'none' }} >
              <b>{item.service_name}</b> il {item.day.toString().padStart(2, "0")}/{item.month.toString().padStart(2, "0")}/{item.year} h {item.sHour}:{item.sMin}
              <div style={{ display: (item.operator === '-1') ? 'none' : 'flex' }}> con {item.operator}</div> 
              <span style={{ display: (item.status !== 'paid') ? 'none' : 'block' }} className={`paidService`}>Già pagato</span>
            </div>
            <p></p>
            <div className={`${'leftPadTop'} border-bottom`}>
            <button style={{ display: (item.status !== 'paid') ? 'block' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'}`} onClick={() => handleDelete(index)}>Cancella</button>
            <span className={`${'leftNoPad'}`}></span>
            <button style={{ display: (item.status !== 'paid') ? 'block' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'}`} onClick={() => handlePayNow(index)}>Paga ora</button>
            </div>
            </div>
          ))}                
          </div>
      </div>
      <h4 className={`${'titleLeft'} border-top ${hasHistory == false ? 'hideItem': ''}`}>Tutti i servizi fatti</h4><p></p>
      <div className='row'>
        <div className='col'>
        {bookingDone.map((item, index) => (
          <div className='timeList' key={index}>
              <b>{item.service_name}</b>: il {item.day.toString().padStart(2, "0")}/{item.month.toString().padStart(2, "0")}/{item.year} h{item.sHour}:{item.sMin}     
          </div>
        ))}                
        </div>
      </div>
      <Popup trigger={trigger} msg= {message} setTrigger={setTrigger} type={type}>
      </Popup>
    </div>
  )
}