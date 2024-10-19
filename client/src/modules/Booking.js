const ONE_HOUR = 60

class Booking {

    constructor(_id, operator, user_id, service_name, year, month, day, sHour, sMin, duration, done, status, price, email) {
        this._id = _id
        this.operator = operator
        this.user_id = user_id
        this.service_name = service_name
        this.year = year
        this.month = month
        this.day = day
        this.sHour = sHour
        this.sMin = sMin
        this.duration = duration
        this.done = done
        this.status = status
        this.price = price
        this.email = email
    }

    markAsDone() {
        this.done = true
    }
}

class BookingSlot {
    constructor(sHour, sMin) {
        this.sHour = sHour
        this.sMin = sMin
    }
}

class BookingSlotOperator {
    constructor(operator, sHour, sMin) {
        this.operator = operator
        this.sHour = sHour
        this.sMin = sMin
    }
}

class BookingSlots {
    constructor() {
        this.slots = []
    }

    loadSlots () {
        let configFile = JSON.parse(localStorage.getItem('configuration'))
        let afternoonHours = Math.ceil(Number(configFile.endAfternoon) - Number(configFile.startAfternoon))
        let slotNumPerHour = ONE_HOUR/configFile.slotDuration

        let startSlot = configFile.startAfternoon
        let remainTime = 0
        let k = 0
        for (let i = 0; i < afternoonHours*slotNumPerHour; i++) {
            let nextSlot = (Number(startSlot) + configFile.slotDuration/100*k).toFixed(2)
            let h = Number(nextSlot.split('.')[0])
            let m = 0
            if (nextSlot.split('.').length > 1) {
                m = Number(nextSlot.split('.')[1].padEnd(2, "0"))
                if (m >= ONE_HOUR) {
                    remainTime = m - ONE_HOUR
                    let nextHour = Number(startSlot.split('.')[0]) + 1
                    if (remainTime >= 10)
                        startSlot = nextHour.toString() + "." + remainTime.toString().padEnd(2, "0")
                    else
                        startSlot = nextHour.toString() + "." + remainTime.toString().padStart(2, "0")

                    h = Number(startSlot.split('.')[0])
                    m = Number(startSlot.split('.')[1])
                    remainTime = 0
                    k = 0
                }
            }
            if (Number(configFile.endAfternoon.split('.')[0]) > h) {
                let aSlot = new BookingSlot(h, m)
                this.slots.push(aSlot)
            }
            k++
        }
    }

    getIndex (sHour, sMin) {
        for (let i = 0; i < this.slots.length; i++) {
            if (sHour === this.slots[i].sHour && sMin === this.slots[i].sMin)
                return i
        }
    }
}

class ServiceItem {
    constructor(id, name, price, duration, description) {
        this.id = id
        this.name = name
        this.price= price
        this.duration = duration
        this.description = description
    }
}

class Prodotto {
    constructor(name, price) {
        this.name = name
        this.price= price
    }
}

export {Booking, BookingSlots, ServiceItem, Prodotto, BookingSlotOperator}