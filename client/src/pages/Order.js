import Navbar from "../modules/Navbar.js"
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { MobileDatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { itIT } from '@mui/x-date-pickers/locales'
import 'dayjs/locale/it'
import '../App.css'
import {BookingSlots as BookingSlots, ServiceItem as ServiceItem} from '../modules/Booking.js'
import Popup from '../modules/Popup.js'
import { useNavigate } from 'react-router-dom'
import { useLocation } from "react-router-dom"

function Order() {
  let configFile = JSON.parse(localStorage.getItem('configuration'))

  let slotsNum = Math.floor((configFile.endAfternoon - configFile.startAfternoon)*60/configFile.slotDuration)
  if (slotsNum%2 !== 0)
    slotsNum -= 1
  let arrayBlank = Array(slotsNum).fill(0)
  let selectedh

  const {state} = useLocation()                                                       //  Receives state data from Admin page
  const [storedOrder, setStoredOrder] = useState()                            //  Service Selected and stored in sessionStorage
  const [orderList, setOrderList] = useState([])                          //  List of all Order from configuration.json file
  const [dayProgramLeft, setDayProgramLeft] = useState([])                            //  List of slots displayed in the left column
  const [dayProgramRight, setDayProgramRight] = useState([])                          //  List of slots displayed in the right column
  const [dayProgram, setDayProgram] = useState([])                                    //  List of slots displayed if not showing booked slots
  const [date, setDate] = useState()                                                  //  Date set by the DatePicker
  const [startHour, setStartHour] = useState(-1)                                      //  Selected Start Hour for the booking
  const [startMinute, setStartMinute] = useState(-1)                                  //  Selected Start Minute for the booking
  const [startHourShow, setStartHourShow] = useState('19')                            //  Start Hour of the booking to be displayed
  const [startMinuteShow, setStartMinuteShow] = useState('00')                        //  Start Minute of the booking to be displayed
  const [isSelectedTimeLeft, setIsSelectedTimeLeft] = useState(arrayBlank)            //  Clicked slot if on the left column
  const [isSelectedTimeRight, setIsSelectedTimeRight] = useState(arrayBlank)          //  Clicked slot if on the right column
  const [isSelectedTime, setIsSelectedTime] = useState(arrayBlank)                    //  Clicked slot if not showing booked slots
  const [bookedSlotLeft, setIsBookedLeft] = useState(arrayBlank)                      //  Booked slots in the left column
  const [bookedSlotRight, setIsBookedRight] = useState(arrayBlank)                    //  Booked slots in the right column
  const [bookedSlot, setIsBooked] = useState(arrayBlank)                              //  Booked slots if not showing booked slots
  const [forcedBooking, setForcedBooking] = useState("")                              //  Name of the booking forced by Admin page
  const [message, setMessage] = useState("")
  const [trigger, setTrigger] = useState(false)
  const [type, setType] = useState('')
  const [bookingString, setBookingString] = useState('')                              //  Booking message including details
  const [showBooked, setShowBooked] = useState(true)                                  //  By default show the slot hours booked shading them in grey
  const [selectedHour, setSelHour] = useState('1')

  let bookingSlots = new BookingSlots()
  bookingSlots.loadSlots()  
  let slotDuration = configFile.slotDuration

  let theOrders = []
  let navigate = useNavigate()  

  useEffect(() => {
    let notWorkingDays = []
    for (let i = 0; i < configFile.notWorkingDays.length; i++) {  
      notWorkingDays.push(configFile.notWorkingDays[i].day)
    }

    // identify next working day available
    let start = new Date()
    var nextWorkingDay = start
    while(notWorkingDays.includes(nextWorkingDay.getDay().toString())) {
      nextWorkingDay = new Date(start)
      nextWorkingDay.setDate(nextWorkingDay.getDate() + 1)
    }

    let slotsLeft = []
    let slotsRight = []
    let slotsAll = []
    for (let i = 0; i < bookingSlots.slots.length; i++) {
      if (i%2 === 0)
        slotsLeft.push(bookingSlots.slots[i])
      else
        slotsRight.push(bookingSlots.slots[i])
      slotsAll.push(bookingSlots.slots[i])
    }
    setDayProgramLeft(slotsLeft)
    setDayProgramRight(slotsRight)
    setDayProgram(slotsAll)

    theOrders = []
    let storedOrder = sessionStorage.getItem('theOrder')
    if (storedOrder !== null && storedOrder !== undefined && storedOrder !== '' && storedOrder !== '[null]') 
      setOrderList(JSON.parse(storedOrder))

    slotDuration = configFile.slotDuration

    if (state !== null && state !== undefined) {
      setStartHour(state.sHour)
      setStartHourShow(state.sHour.toString().padStart(2, "0"))
      setStartMinute(state.sMin)
      setStartMinuteShow(state.sMin.toString().padStart(2, "0"))
      setForcedBooking(state.name)
    }
    else {
      let forcedBookingStored = sessionStorage.getItem('forcedBooking')
      if (forcedBookingStored !== null && forcedBookingStored !== undefined && forcedBookingStored !== '')
        setForcedBooking(forcedBookingStored)

      let forcedHourStored = sessionStorage.getItem('forcedHour')
      if (forcedHourStored !== null && forcedHourStored !== undefined && forcedHourStored !== '') {
        setStartHour(forcedHourStored)
        setStartHourShow(forcedHourStored.toString().padStart(2, "0"))
      }

      let forcedMinuteStored = sessionStorage.getItem('forcedMinute')
      if (forcedMinuteStored !== null && forcedMinuteStored !== undefined && forcedMinuteStored !== '') {
        setStartMinute(forcedMinuteStored)
        setStartMinuteShow(forcedMinuteStored.toString().padStart(2, "0"))
      }
    }
    let storedDate = sessionStorage.getItem('selectedDate')
    if (storedDate !== null && storedDate !== undefined) {
      setDate(storedDate)
      handleChangeDate(dayjs(storedDate))
    }
    else
      handleChangeDate(dayjs(nextWorkingDay))

    let showBook = configFile.showBooked
    if (showBook == "false")
      setShowBooked(false)
    
  }, [])

  useEffect(() => {
    if (window.forcelogout === true) {
      window.forcelogout = false
      navigate('/')
    }
  }, [window.forcelogout])

  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    setTrigger(false)
    setMessage("")      

    let year = date.$y
    let month = date.$M + 1
    let day = date.$D

    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged == null || userLogged == undefined) {
      setType('alert')
      setTrigger(true)
      setMessage("Prima effettua l'accesso")
      setTimeout(() => {
        navigate('/login')
      }, 3000) 
      return
    }

    let storedOrder = sessionStorage.getItem('theOrder')
    if (storedOrder !== null && storedOrder !== undefined && storedOrder !== '' && storedOrder !== '[null]') {
      setType('alert')
      setTrigger(true)
      setMessage("Completa prima l'ordine")
      return
    }
    
    if (startHour === -1 && startMinute === -1) {
      setType('alert')
      setTrigger(true)
      setMessage("Seleziona la fascia oraria")      
      return
    }

    let email =  localStorage.getItem('sendEmail')
    if (email === undefined || email === null)
      email = 'false'

    let userData = JSON.parse(userLogged)
    let user_id = userData.user_id
    let jsonData = JSON.parse(storedOrder)
    let currDuration = slotDuration
    let service_name = jsonData.name
    let price = ""

    for (let i = 0; i < configFile.services.length; i++) { 
      if (configFile.services[i].name == service_name) {
        currDuration = configFile.services[i].duration
        price = configFile.services[i].price
        break
      }
    }
    
    let sHour = startHour
    let sMin = startMinute
    let duration = currDuration

    let slotsUsed = Number(selectedHour)*60/slotDuration

    let forcedName = ""
    if (forcedBooking !== null && forcedBooking !== undefined && forcedBooking !== '')
      forcedName = forcedBooking

    let slot_id = user_id + "_" + Date.now().toString()
    for (let i = 0; i < slotsUsed; i++) {
      let nextDate = new Date(year,month-1,day, sHour, sMin, 0)
      if (i > 0) {
        nextDate.setTime(nextDate.getTime() + slotDuration*60000)
        email = 'false'
      }

      year = nextDate.getFullYear()
      month = nextDate.getMonth() + 1
      day = nextDate.getDate()
      sHour = nextDate.getHours()
      sMin = nextDate.getMinutes()
      let slot = i
  
      const res = await fetch("/submit", {
        method: "POST",
        body: JSON.stringify({user_id, service_name, year, month, day, sHour, sMin, duration, forcedName, slot, slot_id, price, email }),
        headers: {
          "x-access-token": localStorage.getItem('token'),
          "Content-Type": "application/json"
        }
      })
      const sts = await res.status
      if (sts === 200) {
        setTrigger(true)
        setType('info')
        setMessage("Prenotazione completata!")
        setTimeout(() => {
          setTrigger(false)
        }, 3000) 
        sessionStorage.setItem('bookingID', slot_id)
        handleChangeDate(date)
        if (state !== null && state !== undefined) {
          navigate('/admin')
        }
        else {
          let checkout =  localStorage.getItem('enableCheckout')
          if (checkout === 'true') { 
            setTimeout(() => {
              navigate('/pagaora')
            }, 3000)
          }
        }
      }
      else {
        setTrigger(true)
        setType('alert')
        if (sts === 402)
          setMessage("Prenotazione parziale! Risorsa già impegnata.")
        else if (sts === 403)
          setMessage("Prenotazione fallita! Operatore già impegnato.")
        else
          setMessage("Prenotazione non riuscita!")
      }
    }
    sessionStorage.removeItem('forcedBooking')
    sessionStorage.removeItem('forcedHour')
    sessionStorage.removeItem('forcedMinute')
  }

  const handleChangeDate = async (newDate) => {

    setDate(newDate)
    
    let storedService = sessionStorage.getItem('selectedService')
    let selected_service = ''
    if (storedService !== null && storedService !== undefined) {
      let jsonData = JSON.parse(storedService)
      selected_service = jsonData.name
    }

    setBookingString(`${dayjs(newDate).$D.toString().padStart(2, "0")}/${(dayjs(newDate).$M+1).toString().padStart(2, "0")} - ${startHourShow}:${startMinuteShow}`)

    const year = newDate.$y
    const month = newDate.$M+1
    const day = newDate.$D
    sessionStorage.setItem('selectedDate', newDate)

    const res = await fetch('/alldaybookings', {
      method: "POST",
      body: JSON.stringify({ year, month, day }),
      headers: {
        "x-access-token": localStorage.getItem('token'),
        "Content-Type": "application/json"
      }
    })
    const ret = await res.json()

    if (ret.length > 2) {
      let idxBookedLeft = Array(slotsNum/2).fill(0)
      let idxBookedRight = Array(slotsNum/2).fill(0)
      let idxBookedAll = Array(slotsNum).fill(0)
      let jsonData = JSON.parse(ret)
      for (let i = 0; i < jsonData.length; i++) {
        let idx = bookingSlots.getIndex(Number(jsonData[i].sHour), Number(jsonData[i].sMin))
        if (idx%2 === 0)
          idxBookedLeft[idx/2] = 1
        else
          idxBookedRight[(idx-1)/2] = 1
        idxBookedAll[idx] = 1
      }
      setIsBookedLeft(idxBookedLeft)
      setIsBookedRight(idxBookedRight)
      setIsBooked(idxBookedAll)
    }
    else {
      let arrayBookBlank = Array(slotsNum/2).fill(0)
      setIsSelectedTimeLeft(arrayBookBlank)
      setIsSelectedTimeRight(arrayBookBlank)
      setIsBookedLeft(arrayBookBlank)
      setIsBookedRight(arrayBookBlank)
      arrayBookBlank = Array(slotsNum).fill(0)
      setIsSelectedTime(arrayBookBlank)
    }
  }

  const setTime = (h,m,ix,side) => {
    if (side === 'left')
      if (bookedSlotLeft[ix] == 1)
        return

    if (side === 'right')
      if (bookedSlotRight[ix] == 1)
        return

    if (side === 'all')
      if (bookedSlot[ix] == 1)
        return

    if (date === undefined) {
      setType('alert')
      setTrigger(true)
      setMessage("Prima seleziona il giono")
      return
    }
    
    setStartHour(h)
    setStartHourShow(h.toString().padStart(2, "0"))
    setStartMinute(m)
    setStartMinuteShow(m.toString().padStart(2, "0"))

    let arrayBlankFill = Array(slotsNum/2-1).fill(0)
    let selectedItem = [...arrayBlankFill.slice(0, ix),1,...arrayBlankFill.slice(ix)]

    if (side === 'left') {
      setIsSelectedTimeLeft(selectedItem)
      setIsSelectedTimeRight(arrayBlankFill)
    }
    else if (side === 'right') {
      setIsSelectedTimeRight(selectedItem)
      setIsSelectedTimeLeft(arrayBlankFill)
    }
    else {
      arrayBlankFill = Array(slotsNum).fill(0)
      selectedItem = [...arrayBlankFill.slice(0, ix),1,...arrayBlankFill.slice(ix)]
      setIsSelectedTime(selectedItem)
    }

    setBookingString(`${date.$D.toString().padStart(2, "0")}/${(date.$M+1).toString().padStart(2, "0")} - ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
  }

  const handleShowBookings = () => {
    navigate('/prenotazioni')
  }

  return (
    <div>
      <Navbar></Navbar>
      <div className={`${'row border-bottom'} ${'leftPadBottom'}`}>
        <div className={`${'col'}`}>
          <h4 className="titleLeft">Ordine del</h4>
        </div>
        <div className={`${'col'}`}>
          <h5 className="titleLeft">{bookingString}</h5>
        </div>
      </div>
      <div className='row'>
          <div className={`${'col'}`}>
          {orderList.map((order) => (
            order.map((item, index) =>
            <div key={index} className={`${storedOrder!== undefined && storedOrder.id == (index+1) ? 'serviceSelected' :''}`}>
              <div className={`${'row  border-top'} ${'serviceItem'}`} >
                <div  className={`${'col'} ${'serviceItem'}`}>
                  <label><b>{item.prodotto}</b>{item.addIngr}</label>
                </div>
                <div  className={`${'col'}`}>
                  <label className='textGray'>{item.price}</label>
                </div>
              </div>
            </div>
          )))}                
          </div>
      </div>
      <div className={`${'row  border-top'} ${'datePicker'}`}>
        <div  className={`${'col'}`}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it" localeText={itIT.components.MuiLocalizationProvider.defaultProps.localeText}>
            <MobileDatePicker label="Cambia data" value={date || null} onChange={(newDate) => handleChangeDate(newDate)}  disablePast
            defaultValue={dayjs(new Date())}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "20px",
                color: "gray"
              },
              "& .MuiFormLabel-root": { color: "gray" },
              "& .MuiInputLabel-root.Mui-error": { color: "gray" },
              "& .MuiInputLabel-root.Mui-focused": { color: "gray" },
              "& .MuiOutlinedInput-root.Mui .MuiOutlinedInput-notchedOutline": { border: "1px solid gray"},
              "& .MuiOutlinedInput-root.Mui-hover .MuiOutlinedInput-notchedOutline": { border: "1px solid gray"},
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "1px solid gray"},
              "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": { border: "1px solid gray"} 
              }}/>
          </LocalizationProvider>
        </div>
        <div  className={`${'col'}`}>
          <div className={`${'bottomButtons'}`}>
              <button className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustomWidth'}`} onClick={handleSubmitBooking}>Ordina</button>
          </div>
        </div>
      </div>                  
      <div className='row' style={{ display: (showBooked === true) ? 'flex' : 'none' }}>
          <div className={`${'col'}`}>
          {dayProgramLeft.map((item, indexEven) => (
            <div key={indexEven}>
                <div className={`${'col'} ${isSelectedTimeLeft[indexEven] == 1 ? 'timeListSelected' :'timeListBooking'} ${bookedSlotLeft[indexEven] == 1 ? 'hideSlot': ''} ${'border-bottom'}`}>
                <label onClick={() => setTime(item.sHour,item.sMin,indexEven, 'left')}>{item.sHour.toString().padStart(2, "0")}:{item.sMin > 10 ? item.sMin.toString().padEnd(2, "0") : item.sMin.toString().padStart(2, "0")}</label>
                </div>
            </div>
          ))}
          </div>
          <div className={`${'col'}`}>
          {dayProgramRight.map((item, indexOdd) => (
            <div key={indexOdd}>
                <div className={`${'col'} ${isSelectedTimeRight[indexOdd] == 1 ? 'timeListSelected' :'timeListBooking'} ${bookedSlotRight[indexOdd] == 1 ? 'hideSlot': ''} ${'border-bottom'}`}>
                  <label onClick={() => setTime(item.sHour,item.sMin,indexOdd, 'right')}>{item.sHour.toString().padStart(2, "0")}:{item.sMin > 10 ? item.sMin.toString().padEnd(2, "0") : item.sMin.toString().padStart(2, "0")}</label>
                </div>
            </div>
          ))}
          </div>
      </div>
      <div className='row' style={{ display: (showBooked === false) ? 'flex' : 'none' }}>
          <div className={`${'col'}`}>
          {dayProgram.map((item, index) => (
            <div key={index}>
                <div style={{ display: (bookedSlot[index] === 1) ? 'none' : 'flex' }} className={`${'col'} ${isSelectedTime[index] == 1 ? 'timeListSelected' :'timeListBooking'} ${bookedSlot[index] == 1 ? 'hideSlot': ''} ${'border-bottom'}`}>
                  <label onClick={() => setTime(item.sHour,item.sMin,index, 'all')}>{item.sHour.toString().padStart(2, "0")}:{item.sMin > 10 ? item.sMin.toString().padEnd(2, "0") : item.sMin.toString().padStart(2, "0")}</label>
                </div>
            </div>
          ))}
          </div>
      </div> 
      <div className={`${'bottomButtons'} ${'leftPadBottom'}`}>
              <button className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustomWidth'}`} onClick={handleShowBookings}>Vedi tutte</button>
      </div>
      <Popup trigger={trigger} msg= {message} setTrigger={setTrigger} type={type}>
      </Popup>
    </div>
  )
}

export default Order
