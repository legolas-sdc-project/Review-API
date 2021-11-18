CREATE TABLE IF NOT EXISTS reviews(
   id INT PRIMARY KEY NOT NULL,
   product_id  INT,
   rating  INT,
   date  BIGINT,
   summary VARCHAR(300),
   body VARCHAR(30000),
   recommend BOOLEAN,
   reported BOOLEAN,
   reviewer_name VARCHAR(300),
   reviewer_email VARCHAR(300),
   response VARCHAR(30000),
   helpfulness INT
);

CREATE TABLE IF NOT EXISTS reviews_photo(
   id INT PRIMARY KEY  NOT NULL,
   review_id INT  NOT NULL REFERENCES reviews(ID),
   url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characteristic(
   id INT PRIMARY KEY  NOT NULL,
   product_id  INT,
   name  VARCHAR(100)  NOT NULL
);

CREATE TABLE IF NOT EXISTS characteristic_review(
   id INT PRIMARY KEY     NOT NULL,
   characteristic_id     INT    NOT NULL REFERENCES characteristic(ID),
   review_id INT NOT NULL REFERENCES reviews(ID),
   value INT
);