import React from 'react';
import { useState, useEffect } from 'react'
import styled from 'styled-components';
import logo from "../images/avatar.png"
import { NavLink as Link} from 'react-router-dom'
import { Home } from 'react-feather'
import { ShoppingBag } from 'react-feather'
import { LogIn } from 'react-feather'
import { LogOut } from 'react-feather'
import { Settings } from 'react-feather'
import { ShoppingCart } from 'react-feather'
import { useWindowSize } from "@uidotdev/usehooks";

const Nav = styled.nav`
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #000;
  padding: 0.5rem calc((100vw -1000px)/2);
  z-index: 10;
`;

const NavLink = styled(Link)`
color: #888;
display: flex;
align-items: right;
text-decoration: none;
padding: 0 1rem;
cursor: pointer;
&.active{
  color: #FFF;
}
`

const NavMenu = styled.div`
  display: flex;
  align-items: right;
  margin-right: -24px;

  @media (max-width: 767px) {
    display: none;
  }
`
const NavMenuMobile = styled.div`
  align-items: right;
  margin-right: 64px;

  @media (max-width: 768px) {
    display: flex;
  }
`
const NavBtn = styled.nav`
  display: flex;
  align-items: right;
  margin-right: 24px;

  @media (max-width: 767px) {
    display: none;
  }
`

const NavBtnLink = styled(Link)`
border-radius: 4px;
background-color: #000;
padding: 8px 22px;
color: #888;
border: none;
outline: none;
text-decoration: none;
transition: all 0.2s ease-in-out;

&:hover {
  transition: all 0.2s ease-in-out;
  color: #010606;
  background-color: #fff;
}
&.active{
  color: #FFF;
}
`

const Navbar = () => {
  const size = useWindowSize()
  const [initials, setInitials] = useState("");

  function checkLogStatus() {
    let userLogged = localStorage.getItem('loggedUser')
    if (userLogged !== null) {
      window.logged = true
      let jsonData = JSON.parse(userLogged)
      let userNameSurname = jsonData.username
      let firstCharName = userNameSurname.split(' ')[0].slice(0,1)
      let firstCharSurname = userNameSurname.split(' ')[1].slice(0,1)
      setInitials(firstCharName+firstCharSurname)
    }
    else 
      window.logged = false
  }

  useEffect(() => {
    checkLogStatus()
  }, [window.logged])

  const logOut = () => {
    localStorage.removeItem('loggedUser')
    window.logged = false
    window.forcelogout = true
  }

  let largeScreen = true
  if (size.width < 768)
        largeScreen = false

  return (
    <Nav>
      <NavLink to='/'>
      <img src={logo} alt="" />
      </NavLink>
      <NavMenu>
        <NavLink to="/" ><Home className='menuSpace' /></NavLink>
        <NavLink to="/prodotti" >Panini<ShoppingBag className='menuSpace' /></NavLink>
        <NavLink to="/ordine" >Ordine<ShoppingCart className='menuSpace' /></NavLink>
        <NavLink to="/impostazioni" >Impostazioni<Settings className='menuSpace' /></NavLink>
      </NavMenu>
      <NavMenuMobile style={{ display: (largeScreen == false) ? 'flex' : 'none' }}>
        <NavLink to="/" ><Home /></NavLink>
        <NavLink to="/prodotti" ><ShoppingBag /></NavLink>
        <NavLink to="/ordine" ><ShoppingCart /></NavLink>
        <NavLink to="/impostazioni" ><Settings /></NavLink>
        <NavLink style={{ display: (window.logged == false) ? 'flex' : 'none' }} to="/login" ><LogIn /></NavLink>
        <NavLink onClick={logOut} style={{ display: (window.logged == true) ? 'flex' : 'none' }}><LogOut />{initials}</NavLink>
      </NavMenuMobile>      
      <NavBtn style={{ display: (largeScreen == true && window.logged == false) ? 'flex' : 'none' }}>
        <NavBtnLink to="/login">Login<LogIn className='menuSpace' /></NavBtnLink>
      </NavBtn>
      <NavBtn style={{ display: (largeScreen == true && window.logged == true) ? 'flex' : 'none' }}>
        <NavBtnLink onClick={logOut}>Esci<LogOut className='menuSpace' />{initials}</NavBtnLink>
      </NavBtn>
    </Nav>
  )
}

export default Navbar