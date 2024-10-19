const express = require('express')
const mongoose = require('mongoose')
const dotenv = require("dotenv")
const cors = require("cors")
const app = express()
const path = require('path')
const User = require('./models/user')
const Booking = require('./models/booking.js')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")
const {MongoClient} = require('mongodb')
const schedule = require('node-schedule')

dotenv.config();

app.use(cors({
    origin:process.env.CLIENT_URL, 
    credentials:true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Credentials",
    ],  
}));

app.use(express.json());
app.use(express.static(path.join(__dirname + "/public")))

/*
    Nodemailer transporter using App password for bookingstore.fb@gmail.com
*/
const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "bookingstore.fb@gmail.com",
      pass: "rmjd zjat qymj ytrf",
    },
})

/*
    Sends notification email to admin and user that performed the action (booking or deletion)
*/
const sendEmail = async (userMail, subjectMail, bodyMail) => {
    const mailOptions = {
        from: "bookingstore.fb@gmail.com",
        to: `"${userMail}", "${process.env.ADMIN_EMAIL}"`,
        subject: subjectMail,
        text: bodyMail,
    }

    return await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error)
                reject(error)
            } else {
                console.log("Email sent: ", info.response)
                resolve(info)
            }
        })
    })
}

/*
    Middleware that verifies the user token sent in the header of the rest API
*/
const verifyJWT = (res,req,next) => {
    const token = res.headers["x-access-token"]
    if (token === null || token === undefined) {
        res.status(501).send()
    }
    else {
        jwt.verify(token, process.env.NICE_STRING, (err, decoded) => {
            if (err) {
                res.status(502).send()
            }
            else {
                req.userid = decoded.id
                next()
            }
        })
    }
}

/*
    Queries the Mongo DB to retrieve user name/surneme passing user ID
*/
async function getUserName(userId) {
    const retData = await User.findOne({user_id: userId})
    if (retData !== null && retData !== undefined)
        return retData.username
    else return "Utente Sconosciuto"
} 

/*
    Login using the google data, manages both registration and login
    The JWT is not required and it is generated here, and to be used in all following REST API calls
*/
app.post("/logingoogle", async (req, res) => {
    try {
        const profile  = req.body.profile
        const email = profile.email
        const retData = await User.findOne({user_id: profile.email})
        let jsonObj = ""
        const token = jwt.sign({email}, process.env.NICE_STRING)
        if(!retData) {
            const newUser = new User({
                user_id: profile.email,
                username: profile.name,
                role: "user",
                operator: -1,
            });
            await newUser.save()
            jsonObj = {"auth": true, "token": token, "username": profile.name, "isNew": "true"}
        }
        else {
            jsonObj = {"auth": true, "token": token, "user_id": retData.user_id, "username": retData.username, "role": retData.role, "operator": retData.operator, "isNew": "false"}
        }
        res.json(JSON.stringify(jsonObj))
    }
    catch(err) {
        console.error(`/logingoogle error: ${err}`)
        res.status(401).send()
    }
})    

/*
    Login via email. If the user is not registered authentication is set to false and triggers registration
    The JWT is not required and it is generated here, to be used in all following REST API calls
*/
app.post("/login", async (req, res) => {
    try {
        const email  = req.body.email
        const retData = await User.findOne({user_id: email})
        let jsonObj = ""
        if(!retData) {  // User not found go to registration
            jsonObj = {"auth": false}
        }
        else {  // existing user
            const token = jwt.sign({email}, process.env.NICE_STRING)
            jsonObj = {"auth": true, "token": token, "user_id": retData.user_id, "username": retData.username, "role": retData.role, "operator": retData.operator}
        }   
        res.json(JSON.stringify(jsonObj))
    }
    catch(err) {
        console.error(`/login error: ${err}`)
        res.status(401).send()
    }
})

/*
    Register via email
*/
app.post("/register", async (req, res) => {
    try {
        const email  = req.body.email
        const user  = req.body.user //   must be valid name/surname
        const token = jwt.sign({email}, process.env.NICE_STRING)
        const retData = await User.findOne({user_id: email})
        let jsonObj = ""
        if(!retData) {  // new User
            if (user === null || user === undefined) {
                console.error(`/login error: User not defined`)
                res.status(401).send()
                return                   
            }
            const newUser = new User({
                user_id: email,
                username: user,
                role: 'user',
                operator: -1, 
            });
            await newUser.save()
            jsonObj = {"auth": true, "token": token}
        }
        else {  // existing user
            jsonObj = {"auth": true, "token": token, "user_id": retData.user_id, "username": retData.username, "role": retData.role, "operator": -1}
        }   
        res.json(JSON.stringify(jsonObj))
    }
    catch(err) {
        console.error(`/register error: ${err}`)
        res.status(401).send()
    }
}) 

/*
    Submit a booking and sends notification email if the service is enabled
*/
app.post("/submit", verifyJWT, async (req, res) => {
    try {
        const body = req.body
        let exit = false

        let retData = await Booking.find({year: body.year, month: body.month, day: body.day, sHour: body.sHour, sMin: body.sMin, service_name: body.service_name})
        if (retData.length > 0) {
            console.error(`/submit error: Slot already booked`)
            res.status(402).send()
            exit = true
        }

        retData = await Booking.find({year: body.year, month: body.month, day: body.day, sHour: body.sHour, sMin: body.sMin, operator: body.operator})
        if (retData.length > 0) {
            console.error(`/submit error: Operator already booked`)
            res.status(403).send()
            exit = true
        }

        if (exit === true) return

        let status = 'booked'
        if (body.forcedName !== '')
            status = 'confirmed'

        if (body.operator == undefined)
            body.operator = ''

        const newBooking = new Booking({
            operator: body.operator,
            user_id: body.user_id,
            service_name: body.service_name,
            year: body.year,
            month: body.month,
            day: body.day,
            sHour: body.sHour,
            sMin: body.sMin,
            duration: body.duration,
            done: false,
            created: Date.now(),
            forcedName: body.forcedName,
            slot: body.slot,
            slot_id: body.slot_id,
            status: status,
            price: body.price,
            email: body.email
        })

        await newBooking.save()
        if (body.email === 'true' || body.user_id === process.env.ADMIN_EMAIL) {
            let userName = await getUserName(body.user_id)
            let subjectMail = process.env.COMPANY_NAME + `: Nuova prenotazione il ${body.day}/${body.month}/${body.year} ore ${body.sHour.toString().padStart(2, "0")}:${body.sMin.toString().padStart(2, "0")}`
            let bodyMail = `${userName} ha prenotato ${body.service_name} il ${body.day}/${body.month}/${body.year} ore ${body.sHour.toString().padStart(2, "0")}:${body.sMin.toString().padStart(2, "0")}`
            sendEmail(body.user_id, subjectMail, bodyMail)
        }
        res.status(200).send()
    }
    catch(err) {
        console.error(`/submit error: ${err}`)
        res.status(401).send()
    }
})

/*
    Returns all bookings of a specific user ordered by creation date descending
*/
app.post("/mybookings", verifyJWT, async (req, res) => {
    try {
        const body = req.body
        const retData = await Booking.find({user_id: body.user_id}).sort({ created: -1})
        res.json(JSON.stringify(retData))
    }
    catch(err) {
        console.error(`/mybookings error: ${err}`)
        res.status(401).send()
    }
})


/*
    Returns all bookings of a specific day
*/
app.post("/alldaybookings", verifyJWT, async (req, res) => {
    let body = req.body
    try {
        let retData = await Booking.find({year: body.year, month: body.month, day: body.day})

        if (retData !== null && retData !== undefined) {
            for (let i = 0; i < retData.length; i++) {
                if (retData[i].forcedName !== '')
                    retData[i].user_id = retData[i].forcedName
                else {
                    userName = await getUserName(retData[i].user_id)
                    retData[i].user_id = userName
                }
            }
        }
        res.json(JSON.stringify(retData))
    }
    catch(err) {
        console.error(`/alldaybookings error: ${err}`)
        res.status(401).send()
    }
})    


/*
    Deletes one booking (including all slots)
*/
app.post("/delete", verifyJWT, async (req, res) => {
    let body = req.body
    try {
        const delData = await Booking.findOne({_id: body.id})
        let slot_id_del = delData.slot_id
        const retData = await Booking.deleteMany({slot_id: slot_id_del})

        if (body.emailToSend === 'true' || body.user_id === process.env.ADMIN_EMAIL) {
            let userName = await getUserName(body.user_id)
            let subjectMail = process.env.COMPANY_NAME + `: Prenotazione cancellata da ${userName}`  
            sendEmail("", subjectMail, "")
        }
        res.status(200).send()
    }
    catch(err) {
        console.error(`/delete error: ${err}`)
        res.status(401).send()
    }
})

/*
    Get slot ID from booking ID
*/
app.post("/getslotid", verifyJWT, async (req, res) => {
    let body = req.body
    try {
        const retData = await Booking.findOne({_id: body.bookingID})
        res.json(JSON.stringify(retData))
    }
    catch(err) {
        console.error(`/getslotid error: ${err}`)
        res.status(401).send()
    }
})

/*
    Function that deletes all bookings older than one month approximately
    Sets as done bookings in the past.
*/
const deleteOldBookings = async () => {
    let from = new Date(new Date().setMonth(new Date().getMonth() - 1))
    let retData = await Booking.deleteMany({"created":{ $lte: `${from}` }})
    console.log(`${retData.deletedCount} Bookings Deleted!`)

    from = new Date(new Date().setDate(new Date().getDate() - 1))
    const filter = { "created":{ $lte: `${from}` } }
    const updateCmd =  { "done": true}
    retData = await Booking.updateMany(filter, updateCmd)
    console.log(`${retData.modifiedCount} Bookings Updated!`)
}

/*
   API that calls deleteOldBookings.
*/
app.get("/deleteold", verifyJWT, async (req, res) => {
    try {
        deleteOldBookings()
        res.status(200).send()
    }
    catch(err) {
        console.error(`/deleteold error: ${err}`)
        res.status(401).send()
    }
})

/*
   API called by a Cron Job in vercel that calls deleteOldBookings.
*/
app.get("/crondelete", async (req, res) => {
    try {
        deleteOldBookings()
    }
    catch(err) {
        console.error(`/crondelete error: ${err}`)
    }
})

/*
    Function that checks all bookings of the day, and in case the email
    service is active it sends a reminder email to the user
*/
const alertNextBookers = async () => {
    try {
        let today = new Date()  //  to be run as Cron Job at 07:00
        const filter = { "year": today.getFullYear(), "month": today.getMonth()+1, "day": today.getDate() }

        const retData = await Booking.find(filter)
        if (retData !== null && retData !== undefined) {
            for (let i = 0; i < retData.length; i++) {
                if (retData[i].email === true) {
                    let userName = await getUserName(retData[i].user_id)
                    let subjectMail = process.env.COMPANY_NAME + `: ATTENZIONE oggi è fissata la prenotazione per ${userName} alle ore ${retData[i].sHour.toString().padStart(2, "0")}:${retData[i].sMin.toString().padStart(2, "0")}`  
                    sendEmail(retData[i].user_id, subjectMail, "")
                }
            }
        }
    }
    catch(err) {
        console.error(`/alertNextBookers error: ${err}`)
    }
}

/*
   API called by a Cron Job in vercel that calls alertNextBookers.
*/
app.get("/cronreminder", async (req, res) => {
    try {
        alertNextBookers()
    }
    catch(err) {
        console.error(`/cronreminder error: ${err}`)
    }
})

/*
    Sets status as paid in a booking slot(s).
*/
app.post("/paybooking", verifyJWT, async (req, res) => {
    try {
        let slot_id = req.body.slot_id
        const filter = { "slot_id": slot_id }
        const updateCmd =  { "status": 'paid'}
        retData = await Booking.updateMany(filter, updateCmd)
        console.log(`${retData.length} Bookings Paid!`)
        
        res.status(200).send()
    }
    catch(err) {
        console.error(`/paybooking error: ${err}`)
        res.status(401).send()
    }
})

/*
    Sets status as confirmed in a booking slot(s).
    Sends confirmation email if the feature is enabled
*/
app.post("/confirm", verifyJWT, async (req, res) => {
    try {
        let body = req.body
        let slot_id = body.slot_id
        const filter = { "slot_id": slot_id }
        const updateCmd =  { "status": 'confirmed'}
        retData = await Booking.updateMany(filter, updateCmd)
        console.log(`${retData.length} Bookings Confirmed!`)
        
        if (body.emailToSend === 'true' || body.user_id === process.env.ADMIN_EMAIL) {
            let userName = await getUserName(body.user_id)
            let subjectMail = process.env.COMPANY_NAME + `: Prenotazione Confermata per ${userName}`  
            sendEmail(body.user_id, subjectMail, "")
        }

        res.status(200).send()
    }
    catch(err) {
        console.error(`/confirm error: ${err}`)
        res.status(401).send()
    }
})

/*
    Sends to Client the JSON configuration.
*/
app.get("/getconfiguration", async (req, res) => {
    try {
        let clientDB = new MongoClient(process.env.MONGODB_URI)
        await clientDB.connect()
        let configuration = await clientDB.db().collection('configuration')

        let jsonDoc = await configuration.find({}).toArray()
        let resJson = JSON.stringify(jsonDoc)
        res.json(resJson)
        clientDB.close()
    }
    catch(err) {
        console.error(`/getconfiguration error: ${err}`)
        res.status(401).send()
    }
})

/*
    Connect the Mongo DB, either Local (MONGO_CLIENT) or on Vercel (MONGODB_URI)
*/
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log(`Database ${process.env.MONGODB_URI} connected!`))
.catch((err) => console.log(err))


schedule.scheduleJob(process.env.SCHEDULE_DELETE, async () => {
    try {
        deleteOldBookings()
        console.log(`Old Bookings Updated!`)  
    }
    catch(err) {
        console.error(`/scheduleJob SCHEDULE_DELETE error: ${err}`)
    }
})

schedule.scheduleJob(process.env.SCHEDULE_REMIND, async () => {
    try {
        alertNextBookers()
        console.log(`Next Bookers alerted!`)  
    }
    catch(err) {
        console.error(`/scheduleJob SCHEDULE_REMIND error: ${err}`)
    }
})

/*
    Run Express server
*/
app.listen(process.env.PORT || 5000, () => {
    console.log('Server started!');
})
