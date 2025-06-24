const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;
const twilio = require('twilio');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('./database/User.js');;
const AppointmentServices = require('./services/AppointmentServices');
const appointment = require('./database/Appointment.js');

const SESSION_SECRET = process.env.SESSION_SECRET
const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.CLOUD_APIKEY;
const API_SECRET = process.env.CLOUD_API_SECRET;  
const ACCOUNT_SID = process.env.TWILIO_ACOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

mongoose.connect("mongodb://localhost:27017/buffetdb",{ useNewUrlParser: true})
.then(() => {
  console.log("Conectado ao MongoDB!");
})
.catch((err) => {console.log("Erro ao conectar ao MongoDB:", err);});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
});

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.cargo === 'admin') return next();
  res.status(403).send("Acesso negado");
}

// <% if (user && user.cargo === 'admin') { %>
//  <a href="/cadastrar-evento" class="btn btn-primary">Cadastrar Evento</a>
// <% } %>

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const user = await userModel.findOne({ email, senha });
  if (!user) return res.send("Login inválido");
  req.session.user = user;  
  res.redirect('/home');
});

app.get("/home", (req, res) => {
  res.render('home', { user: req.session.user }); 
});

app.get("/novo-evento", (req, res) => {
res.render("novo-evento", { user: req.session.user });
});

app.post('/gerar-pdf', async (req, res) => {
  try {
    const { nome, data, local, pessoas, observacoes } = req.body;

    // 1. Geração do PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const html = `
      <html>
        <body>
          <h1>${nome}</h1>
          <p>Data: ${data}</p>
          <p>Local: ${local}</p>
          <p>Pessoas: ${pessoas}</p>
          <p>Observações: ${observacoes}</p>
        </body>
      </html>`;
    await page.setContent(html);
    const buffer = await page.pdf({ format: 'A4' });
    await browser.close();

    const tempFilePath = path.join(__dirname, `${nome}.pdf`);
    fs.writeFileSync(tempFilePath, buffer);

    // 2. Upload no Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: 'raw',
      public_id: `orcamentos/${nome}-${Date.now()}`
    });

    fs.unlinkSync(tempFilePath);

    const accountSid = ACCOUNT_SID;
    const authToken = AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    // 3. Envio via WhatsApp
    const mensagem = `Olá, segue novo pdf do evento: ${result.secure_url}`;
    const numeroVendedor = `whatsapp:+558592623775`;

    const envio = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: numeroVendedor,
      body: mensagem
    });

    console.log(envio.sid);
    console.log('Mensagem enviada com sucesso!');

    // 4. Resposta final ao navegador
    res.send(`PDF gerado e enviado via WhatsApp com sucesso!<br><a href="${result.secure_url}" target="_blank">${result.secure_url}</a>`);

  } catch (error) {
    console.error('Erro no processo:', error);
    res.status(500).send('Erro ao processar PDF ou enviar mensagem.');
  }
});

app.get('/new-calendar', async (req, res) => {
  res.render('new-calendar', { user: req.session.user });
})

app.post('/new-calendar', async (req, res) => {
  

  var status = await AppointmentServices.create(
    req.body.name,
    req.body.date,
    req.body.time,
    req.body.desc,
    req.body.locale
  )
  if (status) {
    res.redirect('/calendario');
  } else {
    res.send("Erro ao criar o agendamento");
  }
})

app.get('/calendario', (req, res) => {
  res.render('calendar');
})

app.get('/getcalendar', async (req, res) => {

  var appointments = await AppointmentServices.getAll(false);
  res.json(appointments);

})

app.get("/event/:id",async (req,res)=>{
  var appointment = await AppointmentServices.GetById(req.params.id);
  console.log(appointment)
  res.render("event",{Appo:appointment});

  
})
app.post("/finished",async(req,res)=>{
  var id = req.body.id;
  var result = await AppointmentServices.Finished(id);
  res.redirect("/calendario");
})


app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
