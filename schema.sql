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
    backorder INTEGER DEFAULT 0,
    force_in_stock INTEGER DEFAULT 0,
    cht_product_id TEXT,
    cht_product_name TEXT,
    cht_product_url TEXT,
    gto_product_id TEXT,
    gto_product_name TEXT,
    gto_product_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS price_schemas (
    schema_id INTEGER PRIMARY KEY AUTOINCREMENT,
    schema_name TEXT NOT NULL UNIQUE
);


CREATE TABLE IF NOT EXISTS price_schema_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    schema_id INTEGER NOT NULL,
    cht_product_id TEXT NOT NULL,
    schema_price REAL NOT NULL,
    UNIQUE(schema_id, cht_product_id),
    FOREIGN KEY (schema_id) REFERENCES price_schemas(schema_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dealers (
    dealer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, 
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    phone TEXT,
    email TEXT,
    company_address TEXT,
    price_schema_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (price_schema_id) REFERENCES price_schemas(schema_id)
);

CREATE TABLE IF NOT EXISTS dealer_overrides (
    dealer_id INTEGER NOT NULL,
    cht_product_id TEXT NOT NULL,
    override_price REAL NOT NULL,
    PRIMARY KEY (dealer_id, cht_product_id),
    FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_ledger (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cht_product_id TEXT NOT NULL,       
    change_type INTEGER NOT NULL,       -- 0: sell 1: new stock
    amount REAL NOT NULL,               
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_products_cht_name ON products(cht_product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON stock_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_product ON stock_ledger(cht_product_id);

CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site TEXT NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);