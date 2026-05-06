DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT,
    stock REAL DEFAULT 0,
    rrp REAL,
    mpb REAL,
    pcs INTEGER,
    brp INTEGER,
    cht_product_id TEXT,
    cht_product_name TEXT,
    cht_product_url TEXT,
    gto_product_id TEXT,
    gto_product_name TEXT,
    gto_product_url TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);