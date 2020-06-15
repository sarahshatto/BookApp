'use strict'

// Import express - this is our server
const express = require('express');
// This stores express in a variable we can use later
const app = express();

// Import and configure the chamber of secrets
require('dotenv').config();

// Import and configure the pg library ( Postgress )
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// superagent will go out and get info from API for us
const superagent = require('superagent');

// defining the PORT location and throwing an error if it's unavailable
const PORT = process.env.PORT = process.env.PORT || 3001;

// This translates the form data and parses it so that we can read it in the back end
app.use(express.urlencoded({extended: true}));

// This will serve files from the public folder
app.use(express.static('public'));

// set up the view engine for templating
app.set('view engine', 'ejs');


// Testing the home route, Proof of life
app.get('/', (request, response) => {
  console.log('Is this the real life?');
  response.status(200).send('Is this just fantasy?');
});

app.get('/hello', (request, response) => {
  console.log('I am on Hello!');
  response.status(200).render('./pages/index.ejs');
})

// Catch all for any errors
app.all('*', (request, response) => {
  response.status(404).send('No escape from reality');
});

// Turning on the server
app.listen(PORT, () => {
  console.log(`Listening to Queen on ${PORT}`);
});
