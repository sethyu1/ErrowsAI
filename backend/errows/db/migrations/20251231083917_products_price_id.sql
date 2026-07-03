ALTER TABLE products
  ALTER COLUMN name DROP NOT NULL,
  ADD COLUMN price_id VARCHAR(255) NOT NULL,
  ADD CONSTRAINT products_price_id_stv_tr_excl EXCLUDE USING GIST (price_id WITH =, stv_tr WITH &&);