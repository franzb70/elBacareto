
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = new Schema({
    user_id: {
        required: true,
        unique: true,
        type: String,
    },
    username: {
        required: true,
        type: String
    },
    role:  {
        required: true,
        type: String
    },
    operator:  {
        required: true,
        type: String
    },
})

const User = mongoose.model("User", userSchema);
module.exports = User;