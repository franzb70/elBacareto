import { useState, useEffect } from 'react'
import '../App.css'
import '../css/bootstrap.min.css'
import {BookingSlots as BookingSlots, Booking as Booking} from '../modules/Booking.js'
import Navbar from "../modules/Navbar.js"
import Popup from '../modules/Popup.js'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'react-feather'
import { ChevronLeft } from 'react-feather'

function Admin() {
  let configFile = JSON.parse(localStorage.getItem('configuration'))
  let slotsNum = Math.floor((configFile.endAfternoon - configFile.startAfternoon)*60/configFile.slotDuration)
  if (slotsNum%2 !== 0)
    slotsNum -= 1
  let arrayBlank = Array(slotsNum).fill('')

  const [bookingNext, setBookingNext] = useState([])              //  Array of the Booking items of the day (full class)
  const [bookingIndexes, setBookingIndexes] = useState([])        //  Array of the Booking indexes (from 0 to 23) of the day
  const [userBooked, setUserBooked] = useState(arrayBlank)        //  Names of the users who booked
  const [serviceBooked, setServiceBooked] = useState(arrayBlank)  //  Name of the services booked
  const [servicePaid, setServicePaid] = useState(arrayBlank)      //  Paid services
  const [newBookings, setNewBookings] = useState(arrayBlank)      //  Manual bookings names
  const [daySlots, setDaySlots] = useState([])                    //  List of time slots in the day to fill the table
  const [message, setMessage] = useState('')
  const [trigger, setTrigger] = useState(false)
  const [type, setType] = useState('')
  const [date, setDate] = useState(dayjs())
  const [notWorkingDays, setNotWorkingDays] = useState([])        //  List of not working days to be skipped in navigation
  const [holidays, setHolidays] = useState([])                    //  List of holydays dates to be skipped in navigation
  const [askConfirmation, setAskConfirmation] = useState(false)
  const [isPastDate, setIsPastDate] = useState(false)

  let bookingSlots = new BookingSlots()
  bookingSlots.loadSlots()  

  let navigate = useNavigate()  

  let allNextBookings = []
  let allNextBookingsIndexes = []

  const fetchBookings = async (date) => {
    
    let year = date.$y
    let month = date.$M + 1
    let day = date.$D

    const res = await fetch('/alldaybookings', {
      method: "POST",
      body: JSON.stringify({ year, month, day }),
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const ret = await res.json()

    allNextBookings = []          // array of Booking items in the day
    allNextBookingsIndexes = []   // array of indexes where bookings are present in the day
    if (ret.length > 2) {
      let jsonData = JSON.parse(ret)
      for (let i = 0; i < jsonData.length; i++) {
        if (date.$D !== jsonData[i].day || date.$M+1 !== jsonData[i].month)
          continue

        let aBooking = new Booking(
          jsonData[i]._id,
          jsonData[i].operator, 
          jsonData[i].user_id, 
          jsonData[i].service_name, 
          jsonData[i].year, 
          jsonData[i].month, 
          jsonData[i].day, 
          jsonData[i].sHour.toString().padStart(2, "0"), 
          jsonData[i].sMin.toString().padStart(2, "0"),
          jsonData[i].duration,
          jsonData[i].done,
          jsonData[i].status)
        
        allNextBookings.push(aBooking)
        allNextBookingsIndexes.push(bookingSlots.getIndex(Number(jsonData[i].sHour),Number(jsonData[i].sMin)))
      }
    }
    setBookingNext(allNextBookings)
    setBookingIndexes(allNextBookingsIndexes)

    let arrayBlankUser = Array(slotsNum).fill('')
    let arrayBlankService = Array(slotsNum).fill('')
    let arrayPaidService = Array(slotsNum).fill(false)

    let userInBooking = arrayBlankUser
    let serviceInBooking = arrayBlankService
    let paidBooking = arrayPaidService
    for (let i = 0; i < allNextBookingsIndexes.length; i++) {
      userInBooking[allNextBookingsIndexes[i]] = allNextBookings[i].user_id
      if (allNextBookings[i].operator != '-1')
        userInBooking[allNextBookingsIndexes[i]] += ` con ${allNextBookings[i].operator}`
      serviceInBooking[allNextBookingsIndexes[i]] = " - " + allNextBookings[i].service_name
      paidBooking[allNextBookingsIndexes[i]] = allNextBookings[i].status
    }
    setUserBooked(userInBooking)
    setServiceBooked(serviceInBooking)
    setServicePaid(paidBooking)
  }

  useEffect(() => {
    setDaySlots(bookingSlots.slots)
    fetchBookings(date)
    let notWorkDays = []
    for (let i = 0; i < configFile.notWorkingDays.length; i++) {  
      notWorkDays.push(configFile.notWorkingDays[i].day)
    }
    setNotWorkingDays(notWorkDays)

    let holidaysDates = []
    for (let i = 0; i < configFile.holidays.length; i++) {  
      holidaysDates.push(configFile.holidays[i].date)
    }
    setHolidays(holidaysDates)

    let showConfirmButton =  localStorage.getItem('askConfirmation')
    if (showConfirmButton === 'true')
      setAskConfirmation(true)
    else
      setAskConfirmation(false)
  }, [])

  useEffect(() => {
    if (window.forcelogout === true) {
      window.forcelogout = false
      navigate('/')
    }
  }, [window.forcelogout])

  const handleDelete = async (ix) => {
    let index = -1
    for (let i = 0; i < bookingIndexes.length; i++) {
      if (bookingIndexes[i] == ix) {
        index = i
        break
      }
    }

    let id = bookingNext[index]._id
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged == null) {
      setTrigger(true)
      setType('alert')
      setMessage("Effettuare l'accesso!")
      return
    }
     
    let user_id = userLogged.user_id 

    const res = await fetch('/delete', {
        method: "POST",
        body: JSON.stringify({ id, user_id }),
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
        fetchBookings(date)
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

  const handleConfirm = async (ix) => {
    let index = -1
    for (let i = 0; i < bookingIndexes.length; i++) {
      if (bookingIndexes[i] == ix) {
        index = i
        break
      }
    }

    let id = bookingNext[index]._id
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged == null) {
      setTrigger(true)
      setType('alert')
      setMessage("Effettuare l'accesso!")
      return
    }
     
    let jsonData = JSON.parse(userLogged)
    let user_id = jsonData.user_id 
    let emailToSend =  localStorage.getItem('sendEmail')
    if (emailToSend === undefined || emailToSend === null)
      emailToSend = 'false'

    let slot_id = await getSlotId(id)
    const res = await fetch('/confirm', {
        method: "POST",
        body: JSON.stringify({ id, user_id, slot_id, emailToSend }),
        headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
        }
    })
    const sts = await res.status
    if (sts !== 200) {
        setTrigger(true)
        setType('alert')
        setMessage("Conferma non riuscita!")
    }
    else {
        setTrigger(true)
        setType('info')
        setTimeout(() => {
          setTrigger(false)
        }, 3000) 

        setMessage("Conferma effettuata!")
        fetchBookings(date)
    }
  }

  const handleDeleteOld = async() => {
    const res = await fetch('/deleteold', {
      method: "GET",
      headers: {
      "x-access-token": localStorage.getItem('token'),
      "Content-Type": "application/json"
      }
    })
    const sts = await res.status
    if (sts !== 200) {
        setTrigger(true)
        setType('alert')
        setMessage("Aggiornamento non riuscito!")
    }
    else {
        setTrigger(true)
        setType('info')
        setTimeout(() => {
          setTrigger(false)
        }, 3000) 

        setMessage("Aggiornamento riuscito!")
        fetchBookings(date)
    }
  }

  const handleAdd = async (h,m,ix) => {
    if (newBookings[ix] == '') {
      setTrigger(true)
      setType('alert')
      setMessage("Scrivi il nome per la prenotazione!")
      return
    }
    sessionStorage.setItem('forcedBooking', newBookings[ix])
    sessionStorage.setItem('forcedHour', h)
    sessionStorage.setItem('forcedMinute', m)
    sessionStorage.setItem('selectedDate', date)
    navigate('/ordine', { state: {sHour: h, sMin: m, name: newBookings[ix]} })
  }

  const handlePrevDay = async () => {
    var prevDay = new Date(date)
    prevDay.setDate(prevDay.getDate() - 1)
    while (notWorkingDays.includes(prevDay.getDay().toString()))
      prevDay.setDate(prevDay.getDate() - 1)

    let dateTo = `${prevDay.getDate()}/${prevDay.getMonth() + 1}`
    while (holidays.includes(dateTo)) {
      prevDay.setDate(prevDay.getDate() - 1)
      dateTo = `${prevDay.getDate()}/${prevDay.getMonth() + 1}`
    }
  
    if (prevDay.getTime()+60000 < Date.now()) //  Add 1 minute to avoid false positives
      setIsPastDate(true)
    else
      setIsPastDate(false)

    setDate(dayjs(prevDay))
    fetchBookings(dayjs(prevDay))
  }
  
  const handleNextDay = async () => {
    var nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    while (notWorkingDays.includes(nextDay.getDay().toString()))
      nextDay.setDate(nextDay.getDate() + 1)

    let dateTo = `${nextDay.getDate()}/${nextDay.getMonth() + 1}`
    while (holidays.includes(dateTo)) {
      nextDay.setDate(nextDay.getDate() + 1)
      dateTo = `${nextDay.getDate()}/${nextDay.getMonth() + 1}`
    }

    if (nextDay.getTime()+60000 < Date.now()) //  Add 1 minute to avoid false positives
      setIsPastDate(true)
    else
      setIsPastDate(false)

    setDate(dayjs(nextDay))
    fetchBookings(dayjs(nextDay))
  }

  const handleNewBookingName = async (e, ix) => {
    let arrayBlankFill = Array(slotsNum).fill('')
    let selectedItem = [...arrayBlankFill.slice(0, ix),e.target.value.toUpperCase(),...arrayBlankFill.slice(ix)]
    setNewBookings(selectedItem)
  }

  return (
    <div>
      <Navbar></Navbar>
      <h4 className="titleLeft">Prenotazioni del {date.$D.toString().padStart(2, "0")}/{(date.$M+1).toString().padStart(2, "0")}/{date.$y.toString().padStart(2, "0")}</h4>
      <div className='center'><ChevronLeft  onClick={() => handlePrevDay()}/><span className={`${'horizontalSpacing'}`}></span><ChevronRight  onClick={() => handleNextDay()} /></div>     
      {daySlots.map((item, index) => (
        <div className={`${'row'} ${'timeListAdmin'} ${'border-bottom'}`} key={index}>
          <div className={`${'col'}`}>
            <label style={{ color: (userBooked[index] === '') ? '#5B92F8' : '#777' }}>{item.sHour.toString().padStart(2, "0")}:{item.sMin > 10 ? item.sMin.toString().padEnd(2, "0") : item.sMin.toString().padStart(2, "0")} {userBooked[index]} {serviceBooked[index]}</label>
            <input placeholder='Nome Cognome' style={{ display: ((userBooked[index] === '') && (isPastDate === false)) ? 'flex' : 'none' }} className={`${'inputTextBooking'}`} value={newBookings[index]} onChange={(e) => handleNewBookingName(e, index)}></input>
          </div>
          <div className={`${'col'}`}>
            <button style={{ display: ((userBooked[index] === '') && (isPastDate === false)) ? 'flex' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustomFree'}`} onClick={() => handleAdd(item.sHour,item.sMin,index)}>Prenota</button>
            <button style={{ display: (userBooked[index] !== '' && servicePaid[index] !== 'paid') ? 'flex' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustomAdmin'}`} onClick={() => handleDelete(index)}>Cancella</button>
            <span style={{ display: (userBooked[index] !== '' && servicePaid[index] === 'booked' && askConfirmation === true) ? 'flex' : 'none' }} className={`${'tableSpace'}`}></span>
            <button style={{ display: (userBooked[index] !== '' && servicePaid[index] === 'booked' && askConfirmation === true) ? 'flex' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustomAdmin'}`} onClick={() => handleConfirm(index)}>Conferma</button>
            <span className={`${'tableSpace'}`}></span>
            <label style={{ display: (servicePaid[index] === 'paid') ? 'flex' : 'none' }} className='paidService'>Pagato</label>
          </div>
        </div>
      ))}
      <div className={`${'row'} ${'leftPadTop'}`}>
        <div className={`${'col'}`}>
          <button className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'}`} onClick={() => handleDeleteOld()}>Cancella vecchie prenotazioni</button>
        </div>
      </div>         
      <Popup trigger={trigger} msg= {message} setTrigger={setTrigger} type={type}>
      </Popup>
    </div>
  )
}

export default Admin
