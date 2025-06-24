var appointment = require('../database/Appointment');
var mongoose = require('mongoose');
var AppointmentFactory = require('../factories/AppointementFactory');

const Appo = mongoose.model('Appointment', appointment);

class AppointmentServices {

    async create(name, date, time, desc, locale) {
        var newAppo = new Appo({
            name,
            date,
            time,
            desc,
            locale
        });

        try {
            await newAppo.save();
            console.log("Agendamento salvo com sucesso!");  
            return true;
        } catch (error) {
            console.error("Erro ao salvar o agendamento:", error);
            return false;
        }
    }
    async GetById(id){
        try{
        var event = await Appo.findOne({"_id":id});
        return event
        }catch(err){
            console.log(err);
        }
        

       
    }
    async getAll(showFinished) {

        if (showFinished) {
           return await Appo.find()
        }else {
            var appos = await Appo.find({ 'finished': false })
            var appointments = []

            appos.forEach(appointment => {
                if (appointment.date != undefined) {
                    appointments.push( AppointmentFactory.Build(appointment) )
                }
            })
            return appointments
        }
    }
    async Finished(id){
        

        try{
            await Appo.findByIdAndUpdate(id,{finished:true})
            return true
        }
        catch(err){
            console.log(err)
            return false

        }
    }

}

module.exports = new AppointmentServices();