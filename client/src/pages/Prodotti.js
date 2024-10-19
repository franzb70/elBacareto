import Navbar from "../modules/Navbar.js"
import { useState, useEffect } from 'react'
import '../css/bootstrap.min.css'
import { useNavigate } from 'react-router-dom'
import { Phone } from 'react-feather'
import {Prodotto as Prodotto} from '../modules/Booking.js'
import Popup from '../modules/Popup.js'
import Select from 'react-select'

function Prodotti() {
  const [prodotti, setProdotti] = useState([])
  const [prodotto, setProdotto] = useState([])
  const [message, setMessage] = useState("")
  const [trigger, setTrigger] = useState(false)
  const [type, setType] = useState('')
  const [selectedAdd, setSelectedAdd] = useState('')
  const [addIngrList, setAddIngrList] = useState()
  const [phone, setPhone] = useState('')
  const [confLoaded, setConfLoaded] = useState(false)
  const [fullOrder, setFullOrder] = useState([])

  let navigate = useNavigate()

  let configFile = JSON.parse(localStorage.getItem('configuration'))

  useEffect(() => {
    let thePanini = []
    for (let i = 0; i < configFile.prodotti.length; i++) {
      let aPanino = new Prodotto(configFile.prodotti[i].name,configFile.prodotti[i].price)
      thePanini.push(aPanino)
    }
    setPhone(configFile.operators[0].phone)
    setProdotti(thePanini)
    setConfLoaded(true)

    let storedOrder = sessionStorage.getItem('theOrder')
    if (storedOrder !== null && storedOrder !== undefined && storedOrder !== '' && storedOrder !== '[null]') {
      let presentOrder = JSON.parse(storedOrder)
      setFullOrder(presentOrder)
    }   
  }, [])

  useEffect(() => {
    let addList = []
    let theList = configFile.ingredienti
    for (let i = 0; i < theList.length; i++) {
      let option = { label: theList[i].name + " - " + theList[i].price, value: theList[i].name}
      addList.push(option)
    }

    setAddIngrList(addList)
  }, [confLoaded])


  const handleChoose = async (index) => {
    let productChosen = [prodotti[index].name, prodotti[index].price]
    setProdotto(productChosen)
  }

  const bookNow = () => {
    let chosenProduct = { "prodotto":prodotto[0], "price":prodotto[1]}
    let newOrder = []
    newOrder.push(chosenProduct)
    for (let i = 0; i < selectedAdd.length; i++) {
      let label = selectedAdd[i].label
      let splitLabel = label.split(" - ")
        let aIngr = { "addIngr":splitLabel[0], "price":splitLabel[1]}
        newOrder.push(aIngr)
    }

    let storedOrder = fullOrder
    storedOrder.push(newOrder)
    setFullOrder(storedOrder)
    sessionStorage.setItem('theOrder', JSON.stringify(fullOrder))
  }

  const handleCopyPhoneNr = (phone) => {
    navigator.clipboard.writeText(phone)
    setTrigger(true)
    setType('info')
    setMessage("Numero copiato!")
    setTimeout(() => {
      setTrigger(false)
    }, 2000) 
  }

  const handleAddIngrediente = (selectedOption) => {
    setSelectedAdd(selectedOption)
  }

  const handleCheckOut = () => {
    navigate('/ordine')
  }

  return (
    <div>
      <Navbar></Navbar>
      <div className='row'>
        <div className={`${'col'}`}>
            <h4 className="titleLeft">Scegli il panino</h4>
        </div>
        <div className={`${'col'} ${'titleLeft'}`}>
            <button className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'} ${'rightPadTop'}`} onClick={handleCheckOut}>Carrello</button>
        </div>
      </div>
      <label className='leftNoPad' onClick={() =>  handleCopyPhoneNr(phone)}><Phone />{phone}</label>
      <div class ="row">
      <div class ="col">
      {prodotti.map((item, index) => (
          <div className={`${'row'} ${'leftPadTop'} ${prodotto[0] == prodotti[index].name ? 'operatorSelected' :''}`} key={index}>
            <div className={`${'col'}`}>
              <img className='operatorPicture' src={require('../images/Panino'+(index+1)+'.png')} onClick={() => handleChoose(index)}></img>
              <label>{item.name} - {item.price}</label>
            </div>
            <div className={`${'col'} ${'titleLeft'}`}>
              <button style={{ display: prodotto[0] == prodotti[index].name ? 'flex' : 'none' }} className={`${'btn'} ${'btn-outline-secondary'} ${'buttonCustom'} ${'rightPadTop'}`} onClick={bookNow}>Aggiungi</button>
            </div>
          </div>
        ))}
        </div>
        <div className={`${'col'}`}>
          <legend className="legend">+ Ingredienti</legend>
          <Select
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  borderColor: state.isFocused ? 'grey' : 'orange',
                  color: 'white',
                }),
                option:(baseStyles) => ({
                  ...baseStyles,
                  color: '#FFF'
                }),
              }}
              theme={(theme) => ({
                ...theme,
                borderRadius: 10,
                colors: {
                  ...theme.colors,
                  primary: 'orange',
                  primary25: 'orange',
                  primary75: 'orange',
                  neutral0: 'grey',
                  neutral80: 'grey'
                },
              })}
              isMulti
              className="basic-select"
              value={selectedAdd}
              options={addIngrList}
              onChange={handleAddIngrediente}
              autoFocus={true}
            />                          
            </div>        
          </div>

      <Popup trigger={trigger} msg= {message} setTrigger={setTrigger} type={type}>
      </Popup>
    </div>
  )
}

export default Prodotti
