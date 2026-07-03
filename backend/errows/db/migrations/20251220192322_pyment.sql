CREATE TABLE products (
  id                                  UUID NOT NULL,
  title                               TEXT NOT NULL,
  name                                VARCHAR(100) NOT NULL,
  amount                              INT,
  discount_rate                       FLOAT NOT NULL,
  price                               FLOAT NOT NULL,
  before_discount_price               FLOAT NOT NULL,
  type                                VARCHAR(20) NOT NULL,
  bonus_coin                          INT,
  bonus_date                          INT,
  bonus_time                          INT,
  value                               TEXT,
  rights                              TEXT,

	stv_tr                             TSTZRANGE DEFAULT TSTZRANGE(NOW(), 'INFINITY', '[)'),

  EXCLUDE USING GIST (id WITH =, stv_tr WITH &&),
  EXCLUDE USING GIST (name WITH =, type WITH =, stv_tr WITH &&)
);