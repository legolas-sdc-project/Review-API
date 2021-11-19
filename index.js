const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { pool } = require('./config')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

const getReviewsById = (request, response) => {
  const product_id = parseInt(request.query.product_id);
  if (!product_id) {
    response.status(422).send('Error: invalid product_id provided');
    return;
  }

  const page = parseInt(request.query.page) || 1;
  const count = parseInt(request.query.count) || 5;
  const start_count = (page - 1) * count;
  var sort;
  switch (request.query.sort) {
    case 'helpful':
      sort = 'helpfulness';
      break;
    case 'relevant':
      sort = 'helpfulness';
      break;
    case 'newest':
    default:
      sort = 'date';
      break;
  }

  const query = {
    text: `
    SELECT *
    FROM reviews
    WHERE product_id = $1
    ORDER BY ${sort} DESC
    LIMIT $2
    OFFSET $3
    `,
    values: [product_id, count, start_count]
  };
  pool.query(query, (error, results) => {
    if (error) {
      response.status(422).send(error);
      return;
    }
    response.status(200).json({
      product: product_id.toString(),
      page: start_count,
      count: count,
      results: results.rows,
    });
  });
}


const addReviews = (request, response) => {
  const { author, title } = request.body

  pool.query(
    'INSERT INTO reviews (author, title) VALUES ($1, $2)',
    [author, title],
    (error) => {
      if (error) {
        throw error
      }
      response.status(201).json({ status: 'success', message: 'Book added.' })
    }
  )
}

app
  .route('/reviews/')
  // GET endpoint
  .get(getReviewsById)
  // POST endpoint
  .post(addReviews);



const getReviewsMeta = (request, response) => {
  const product_id = parseInt(request.query.product_id);
  var res;
  pool.query('SELECT * FROM reviews WHERE product_id = $1', [product_id], (error, results) => {
    if (error) {
      throw error
    }
    res = results.rows;
    var sendOut = {};
    sendOut.ratings = {};
    for (var i = 0; i < res.length; i++) {
      if (sendOut.ratings[res[i].rating] === undefined) {
        sendOut.ratings[res[i].rating] = 0;
      }
      sendOut.ratings[res[i].rating]++;
    }
    response.status(201).json(sendOut);
  })
}

app
  .route('/reviews/meta/')
  //Get reveiew meta data
  .get(getReviewsMeta);

// Start server
app.listen(process.env.PORT || 8080, () => {
  console.log(`Server listening`)
})