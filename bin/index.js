#!/usr/bin/env node

require("dotenv").config();
const axios = require("axios");
const format = require("date-fns/format");

const locations = process.argv.slice(2).join(" ").split(",");

const OPEN_API_URL = "http://api.openweathermap.org/data/2.5/weather";
const GOOGL_API_URL = "https://maps.googleapis.com/maps/api/timezone/json";
const { OPEN_API_KEY, GOOGL_API_KEY } = process.env;
const targetDate = new Date();
const timestamp =
  targetDate.getTime() / 1000 + targetDate.getTimezoneOffset() * 60;

const getTemperatureAndCoordinate = async (location) => {
  const URL = encodeURI(
    `${OPEN_API_URL}?q=${location.trim()}&appid=${OPEN_API_KEY}&units=metric`
  );
  try {
    const res = await axios.get(URL);
    return {
      location: res.data.name,
      temp: res.data.main.temp,
      coord: res.data.coord,
    };
  } catch (err) {
    console.log(err.response.data.message);
  }
};

const getOffset = async ({ coord, location }) => {
  const URL = encodeURI(
    `${GOOGL_API_URL}?location=${coord.lat},${coord.lon}&key=${GOOGL_API_KEY}&timestamp=${timestamp}`
  );
  const res = await axios.get(URL);
  if (res.data.status === "OK") {
    return {
      location,
      dstOffset: res.data.dstOffset,
      rawOffset: res.data.rawOffset,
    };
  } else {
    console.log(res.data.errorMessage);
  }
};

const calculateTime = ({ dstOffset, rawOffset, location }) => ({
  location,
  time: format(
    timestamp * 1000 + dstOffset * 1000 + rawOffset * 1000,
    "hh:mm:ss a"
  ),
});

const combineTimeAndWeather = ({ allTempAndCoord, allLocalTime }) => {
  return allTempAndCoord.map((curr) => ({
    location: curr.location,
    temp: curr.temp,
    time: allLocalTime.find((time) => time.location === curr.location).time,
  }));
};

const showTimeAndWeather = async (locations) => {
  const allTempAndCoord = await Promise.all(
    locations.map(getTemperatureAndCoordinate)
  );
  const allOffsets = await Promise.all(allTempAndCoord.map(getOffset));
  const allLocalTime = allOffsets.map(calculateTime);
  const combinedTimeAndWeather = combineTimeAndWeather({
    allLocalTime,
    allTempAndCoord,
  });

  combinedTimeAndWeather.forEach(({ temp, location, time }) => {
    console.log(
      `The weather in ${location} is: ${temp}°C and the time is: ${allLocalTime[0].time}`
    );
  });
};

showTimeAndWeather(locations);
