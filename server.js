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
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      console.log(sqlResults.rows);
      let displayBooks = [];
      sqlResults.rows.forEach(value => {
        displayBooks.push(value);
      })
      console.log(displayBooks);
      response.status(200).render('./pages/index.ejs', { link: './searches', bookshelfResults: displayBooks });
    })
});

// app.get('/hello', (request, response) => {
//   console.log('I am on Hello!');
//   response.status(200).render('./pages/index.ejs');
// })

app.get('/searches', (request, response) => {
  console.log('This is the search route');
  response.status(200).render('./pages/searches/new.ejs');
})

app.post('/searches', (request, response) => {
  let searchQuery = request.body.search[0];
  let titleOrAuthor = request.body.search[1];

  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if(titleOrAuthor === 'title'){
    url+=`+intitle:${searchQuery}`;
  }else if(titleOrAuthor === 'author'){
    url+=`+inauthor:${searchQuery}`;
  }

  superagent.get(url)
    .then(results => {
      // console.log(results.body.items);
      let bookArray = results.body.items;
      const finalBookArray = bookArray.map(book => {
        return new Book(book.volumeInfo);
      });
      // console.log(finalBookArray[0]);
      response.render('./pages/searches/show.ejs', {searchResults: finalBookArray});
    }).catch();
})

app.get('/books/:id', (request, response) => {
  let id = request.params.id;

  let sql = 'SELECT * FROM books WHERE id = $1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).render('./pages/books/show.ejs', {book:sqlResults.rows[0]});
    })
})

app.post('/books', (request, response) => {
  console.log(request.body);

  let {author, title, isbn, image_url, description} = request.body;

  let sql = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING ID;';

  let safeValues = [
    author,
    title,
    isbn,
    image_url,
    description
  ]

  client.query(sql, safeValues)
    .then(results => {
      console.log(results.rows);
      let id=results.rows[0].id;
      response.redirect(`/books/${id}`);
    });
});

// Catch all for any errors
app.all('*', (request, response) => {
  console.error('No escape from reality!');
  response.status(404).render('./pages/error.ejs');
});

function Book(info) {
  this.title = info.title ? info.title : 'no title available';
  this.author = info.authors ? info.authors : 'no author available'; // returns an array
  this.description = info.description ? info.description : 'no description available';
  if(this.description.length > 254) this.description = this.description.slice(0,250)+'...';
  this.image = info.imageLinks && info.imageLinks.smallThumbnail ? info.imageLinks.smallThumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.finalImage = this.image[4] !== 's'? 'https' + this.image.slice(4):info.imageLinks.smallThumbnail;
  this.isbn ='industryIdentifiers' in info ? info.industryIdentifiers[0].identifier : 'No ISBN available'
}


// Turning on the server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening to Queen ${PORT}`);
    })
  })
