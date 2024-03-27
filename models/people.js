const mongoose = require("mongoose");

const socialNetworkSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true,
    },
    link: {
        type: String,
        required: true,
    }
});
const peopleSchema = new mongoose.Schema({
    name: {
        type: String,

    },
    surname: {
        type: String,
    },
    patronymic: {
        type: String,
    },
    nickname: {
        type: String,
    },
    socialNetworks: {
        type: [socialNetworkSchema], // Массив объектов socialNetworkSchema
    },
    dateOfBirth: {
        type: Date,
    },
    country: {
        type: String,
    },
    city: {
        type: String,
    },

}, { timestamps: true });


const People = mongoose.model("People", peopleSchema);

module.exports = People;
