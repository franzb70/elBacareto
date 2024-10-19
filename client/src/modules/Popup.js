import React from 'react'
import { useState, useEffect } from 'react'
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css'
import { Alert } from 'reactstrap';

export default function Popup(props) {
    const[color, setColor] = useState('info')

    useEffect(() => {
        if (props.type ==='alert')
            setColor("danger")
        if (props.type ==='info')
            setColor("success")
    }, [props.type])

    return (props.trigger) ? (
        <div className='popup'>
            <Alert color={color} onClick={() => props.setTrigger(false)}>
                {props.msg}
            </Alert>            
        </div>
    ) : ""
}