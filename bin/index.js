#!/usr/bin/env node

require('dotenv').config()
const axios = require("axios");

const locations = process.argv.slice(2).join(' ').split(',');

const API_URL = "http://api.openweathermap.org/data/2.5/weather"
const { API_KEY } = process.env

const requests =  Promise.all(
  locations.map(
    location => axios.get(encodeURI(`${API_URL}?q=${location.trim()}&appid=${API_KEY}&units=metric`))
  )
)

requests
  .then((res) => {
    res.forEach(({ data }) => {
      console.log(`The weather in ${data.name} is: ${data.main.temp}°C`);
    })
  })
  .catch((err) => {
    console.log(err.response.data.message);
  })
