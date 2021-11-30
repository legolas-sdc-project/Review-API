CREATE TABLE IF NOT EXISTS reviews(
   id SERIAL PRIMARY KEY,
   product_id INT,
   rating INT,
   date BIGINT,
   summary VARCHAR(300),
   body VARCHAR(30000),
   recommend BOOLEAN,
   reported BOOLEAN,
   reviewer_name VARCHAR(300),
   reviewer_email VARCHAR(300),
   response VARCHAR(30000),
   helpfulness INT
);

CREATE INDEX review_product on reviews USING HASH (product_id);

CREATE TABLE IF NOT EXISTS reviews_photo(
   id SERIAL PRIMARY KEY,
   review_id INT NOT NULL REFERENCES reviews(ID),
   url TEXT NOT NULL
);

CREATE INDEX review_photo_review_id on reviews_photo USING HASH(review_id);

CREATE TABLE IF NOT EXISTS characteristic(
   id SERIAL PRIMARY KEY,
   product_id INT,
   name VARCHAR(100) NOT NULL
);

CREATE INDEX characteristic_product on characteristic USING HASH(product_id);

CREATE TABLE IF NOT EXISTS characteristic_review(
   id SERIAL PRIMARY KEY,
   characteristic_id INT NOT NULL REFERENCES characteristic(ID),
   review_id INT NOT NULL REFERENCES reviews(ID),
   value INT
);

CREATE INDEX characteristic_review_id on characteristic_review USING HASH(characteristic_id);

CREATE INDEX characteristic_review_review_id on characteristic_review USING HASH(review_id);

/*
 COPY reviews(
 id,
 product_id,
 rating,
 date,
 summary,
 body,
 recommend,
 reported,
 reviewer_name,
 reviewer_email,
 response,
 helpfulness
 )
 FROM
 '/Users/xinyili/Desktop/SDC-project/reviews.csv' DELIMITER ',' CSV HEADER;
 
 
 COPY reviews_photo(id, review_id, url)
 FROM
 '/Users/xinyili/Desktop/SDC-project/reviews_photos.csv' DELIMITER ',' CSV HEADER;
 
 COPY characteristic(id, product_id, name)
 FROM
 '/Users/xinyili/Desktop/SDC-project/characteristics.csv' DELIMITER ',' CSV HEADER;
 
 COPY characteristic_review(id, characteristic_id, review_id, value)
 FROM
 '/Users/xinyili/Desktop/SDC-project/characteristic_reviews.csv' DELIMITER ',' CSV HEADER;
 
 
 //set serial number
 SELECT
 pg_catalog.setval(
 pg_get_serial_sequence('reviews', 'id'),
 (
 SELECT
 MAX(id)
 FROM
 reviews
 ) + 1
 );
 */