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
    pool.query('select reviews_photo.id, url, reviews_photo.review_id from reviews_photo inner join reviews on reviews.id = reviews_photo.review_id where product_id = $1', [product_id], (err, res) => {

      // for (var i = 0; i < results.rows.length; i++) {

      //   results.rows[i].photos = [];
      //   for (var j = 0; j < res.rows.length; j++) {
      //     if (results.rows[i].id === res.rows[j].review_id) {
      //       const { id, url } = res.rows[j];
      //       results.rows[i].photos.push({ id: id, url: url })
      //     }
      //   }
      // }
      var obj = {};
      for (let i = 0; i < res.rows.length; i++) {
        if (obj[res.rows[i].review_id] === undefined) {
          obj[res.rows[i].review_id] = [];
        }
        const { id, url } = res.rows[i];

        obj[res.rows[i].review_id].push({ id: id, url: url })
      }

      for (let j = 0; j < results.rows.length; j++) {
        if (obj[results.rows[j].id] === undefined) {
          results.rows[j].photos = [];
        } else {
          results.rows[j].photos = obj[results.rows[j].id];
        }
      }

      response.status(200).json({
        product: product_id.toString(),
        page: start_count,
        count: count,
        results: results.rows,
      });
    })

  });
}


const addReviews = (req, res) => {
  const { product_id, rating, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, photos, characteristic } = req.body;
  var keys = Object.keys(characteristic);
  var vals = Object.values(characteristic);
  // console.log(keys, vals);
  var query = `
    with ins1 as (
  INSERT INTO
    reviews (
      product_id,
      rating,
      summary,
      body,
      recommend,
      reported,
      reviewer_name,
      reviewer_email,
      response,
      helpfulness
    )
  VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10
    ) returning id as review_id
),
ins2 as (
  INSERT INTO
    reviews_photo(review_id, url)
  values
    (
      (
        select
          review_id
        from
          ins1
      ),
      unnest(cast($11 as text []))
    )
)
INSERT INTO
  characteristic_review(characteristic_id, review_id, value)
SELECT characteristic_review.characteristic_id, ins1.review_id, characteristic_review.value
FROM unnest($12:: int[], $13:: int[]) as characteristic_review(characteristic_id,value), ins1
  `;
  pool.query(
    query,
    [product_id, rating, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, photos, keys, vals],
    (error) => {
      if (error) {
        throw error
      }
      res.status(201).json({ status: 'success', message: 'Reviews added.' });
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
  if (!product_id) {
    response.status(422).send('Error: invalid product_id provided');
    return;
  }
  var res;
  pool.query('SELECT * FROM reviews WHERE product_id = $1', [product_id], (error, results) => {
    if (error) {
      throw error
    }

    res = results.rows;
    var sendOut = {};
    sendOut.ratings = {};
    sendOut.recommend = {};
    for (var i = 0; i < res.length; i++) {
      if (sendOut.ratings[res[i].rating] === undefined) {
        sendOut.ratings[res[i].rating] = 0;
      }
      sendOut.ratings[res[i].rating]++;

      if (sendOut.recommend[res[i].recommend] === undefined) {
        sendOut.recommend[res[i].recommend] = 0;
      }
      sendOut.recommend[res[i].recommend]++;
    }
    pool.query('select avg(value), characteristic_id, name from characteristic_review inner join characteristic on characteristic_review.characteristic_id = characteristic.id where characteristic.product_id = $1 group by characteristic_review.characteristic_id, characteristic.name', [product_id], (err, result2) => {
      if (error) {
        throw error
      }
      sendOut.characteristics = {};
      for (var j = 0; j < result2.rows.length; j++) {
        if (sendOut.characteristics[result2.rows[j].name] === undefined) {
          sendOut.characteristics[result2.rows[j].name] = {
            'id': result2.rows[j].characteristic_id,
            'value': result2.rows[j].avg
          }
        }
      }
      response.status(201).json({ 'product_id': product_id, 'ratings': sendOut.ratings, 'recommended': sendOut.recommend, 'characteristics': sendOut.characteristics });
    })

  })
}

app
  .route('/reviews/meta/')
  //Get reveiew meta data
  .get(getReviewsMeta);

const putHelpful = (request, response) => {
  const reviewId = parseInt(request.params.review_id)
  // const {helpfulness} = request.body;
  pool.query('update reviews set helpfulness = helpfulness + 1 where id = $1', [reviewId], (err, res) => {
    if (err) {
      throw err
    }
    response.status(200).send(`reviews modified with helpfulness`)
  })
}

app
  .route('/reviews/:review_id/helpful')
  //Get reveiew meta data
  .put(putHelpful);


const putReport = (request, response) => {
  const reviewId = parseInt(request.params.review_id)
  // const {helpfulness} = request.body;
  pool.query('update reviews set reported = true where id = $1', [reviewId], (err, res) => {
    if (err) {
      throw err
    }
    response.status(200).send(`reviews reported`)
  })
}

app
  .route('/reviews/:review_id/report')
  //Get reveiew meta data
  .put(putReport);


// Start server
app.listen(process.env.PORT || 8080, () => {
  console.log(`Server listening`)
})