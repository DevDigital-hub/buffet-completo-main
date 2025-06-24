class AppointmentFactory {

    Build(simpleAppointement){
        
        var day = simpleAppointement.date.getDate()+1
        var month = simpleAppointement.date.getMonth()
        var year = simpleAppointement.date.getFullYear()
        var hour = Number.parseInt(simpleAppointement.time.split(':')[0])
        var minutes = Number.parseInt(simpleAppointement.time.split(':')[1])

        var startDate = new Date(year, month, day, hour, minutes,0,0)
        
        
        var appo = {
            id: simpleAppointement._id,
            title: simpleAppointement.name,
            start: startDate,
            end: startDate
            

        }
        return appo
    }

}

module.exports = new AppointmentFactory();