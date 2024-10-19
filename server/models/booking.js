const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let bookingSchema = new Schema({
    operator: {
        required: false,
        type: String,
    },
    user_id: {
        required: true,
        type: String,
    },
    service_name: {
        required: true,
        type: String,
    },
    year: {
        required: true,
        type: Number,
    },
    month: {
        required: true,
        type: Number,
    },
    day: {
        required: true,
        type: Number,
    },
    sHour: {
        required: true,
        type: Number,
    },
    sMin: {
        required: true,
        type: Number,
    },
    duration: {
        required: false,
        type: Number,
    },
    done: {
        required: true,
        type: Boolean,
    },
    created: {
        required: false,
        type: Date,
    },
    forcedName: {
        required: false,
        type: String,
    },    
    slot: {
        required: false,
        type: Number,
    },
    slot_id: {
        required: false,
        type: String,
    },
    status: {
        required: false,
        type: String,
    },
    price: {
        required: false,
        type: String,
    },
    email: {
        required: false,
        type: Boolean,
    }
})

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking