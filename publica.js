const express = require('express');
const fs = require('fs');
const mqtt = require('mqtt');
const mysql = require('mysql');

// Configura la conexión
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'data_sensor'
});

// Conecta a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos');
});

const app = express();
const port = 3000;
let sensorData = {};

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});

// Rutas
app.get('/', (req, res) => {
  fs.readFile('index.html', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error al cargar el archivo HTML');
    } else {
      res.send(data);
    }
  });
});

app.get('/sensordata-json', (req, res) => {
  res.json(sensorData);
});

app.get('/datos-tabla', (req, res) => {
  const query = 'SELECT * FROM datos';
  db.query(query, (err, resultados) => {
    if (err) {
      console.error('Error al obtener los datos:', err);
      res.status(500).send('Error al obtener los datos');
    } else {
      res.json(resultados);
    }
  });
});

app.get('/tabla', (req, res) => {
  fs.readFile('index.html', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error al cargar el archivo HTML');
    } else {
      res.send(data);
    }
  });
});

const url = 'e0287b1c3b054ddf98ec84843d94fec5.s1.eu.hivemq.cloud';
const puerto = 8883;
const options = {
  username: 'grupo6',
  password: 'Sena2024',
  clientId: 'losStrings',
  rejectUnauthorized: false
};

// Función para insertar registros
function insertarRegistro(temperatura, humedad) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const fechaActual = now.toISOString().replace('T', ' ').slice(0, 19);

  const timeString = `${hours}:${minutes}`;
  const query = 'INSERT INTO datos (fecha, hora, temperatura, humedad) VALUES (?, ?, ?, ?)';
  db.query(query, [fechaActual, timeString, temperatura, humedad], (err, resultados) => {
    if (err) {
      console.error('Error al insertar registro:', err);
    } else {
      console.log('Registro insertado con éxito. ID:', resultados.insertId);
    }
  });
}

const client = mqtt.connect(`mqtts://${url}:${puerto}`, options);

client.on('connect', function () {
  client.subscribe('losstrings/data');
});

client.on('message', function (topic, message) {
  try {
    console.log('Datos:', message.toString());
    sensorData = JSON.parse(message.toString());
    // Ejemplo de uso
    insertarRegistro(sensorData.temperature, sensorData.humidity);
    console.log("Se insertaron los registros");
  } catch (error) {
    console.error('Error al procesar los datos del sensor:', error);
  }
});