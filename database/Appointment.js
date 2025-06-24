const mongoose = require('mongoose');

const appointment = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    desc: { type: String, required: true },
    locale: { type: String, required: true },
    finished: { type: Boolean, default: false },
    dataCadastro: { type: Date, default: Date.now },
});

module.exports = appointment;
