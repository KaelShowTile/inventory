//admin UI
const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tile Inventory Mapping Admin</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
    <style> body { padding: 20px; } </style>
</head>
<body>
    <div class="container-fluid">
        <h2>Stock Management</h2>
        <table id="productsTable" class="table table-striped" style="width:100%">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Stock</th>
                    <th>CHT Name</th>
                    <th>GTO Name</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                
            </tbody>
        </table>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
    
    <script>
        $(document).ready(function() {
            // init databse table
            const table = $('#productsTable').DataTable({
                ajax: {
                    url: '/api/products', 
                    dataSrc: 'data'
                },
                columns: [
                    { data: 'sku' },
                    { data: 'name' },
                    { data: 'stock' },
                    { data: 'cht_product_name' },
                    { data: 'gto_product_name' },
                    { 
                        data: null,
                        render: function(data, type, row) {
                            return '<button class="btn btn-sm btn-primary edit-btn" data-id="'+row.id+'">Edit</button>';
                        }
                    }
                ]
            });
            

        });
    </script>
</body>
</html>
`;

async function signCookie(email: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const payload = `${email}:${exp}`;
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${payload}:${sigHex}`;
}

async function verifyCookie(cookie: string, secret: string) {
  try {
    const parts = cookie.split(':');
    if (parts.length !== 3) return null;
    const [email, exp, sigHex] = parts;
    if (Date.now() > parseInt(exp)) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const payload = `${email}:${exp}`;
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
    return isValid ? email : null;
  } catch (e) {
    return null;
  }
}

function getCookie(request: Request, name: string) {
  const cookieString = request.headers.get('Cookie');
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Auth Check for protected routes
    if (url.pathname === '/admin' || url.pathname === '/api/products') {
      const cookie = getCookie(request, 'admin_session');
      const secret = env.COOKIE_SECRET || 'dev-secret-key-change-me';
      const email = cookie ? await verifyCookie(cookie, secret) : null;

      if (!email) {
        if (url.pathname === '/api/products') {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        return Response.redirect(`${url.origin}/login`, 302);
      }
    }

    // 2. Login Page with Google Identity Button
    if (request.method === 'GET' && url.pathname === '/login') {
      const clientId = env.GOOGLE_CLIENT_ID || '';
      const LOGIN_HTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Admin Login</title>
          <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8f9fa; font-family: Arial, sans-serif; }
              .login-box { padding: 40px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
          </style>
      </head>
      <body>
          <div class="login-box">
              <h2>Inventory Admin</h2>
              <p>Sign in with an authorized Google account.</p>
              <br/>
              <script src="https://accounts.google.com/gsi/client" async defer></script>
              <div id="g_id_onload"
                   data-client_id="${clientId}"
                   data-login_uri="${url.origin}/auth/google"
                   data-auto_prompt="false">
              </div>
              <div class="g_id_signin"
                   data-type="standard"
                   data-size="large"
                   data-theme="outline"
                   data-text="sign_in_with"
                   data-shape="rectangular"
                   data-logo_alignment="center">
              </div>
          </div>
      </body>
      </html>
      `;
      return new Response(LOGIN_HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // 3. Google Auth Callback Verification
    if (request.method === 'POST' && url.pathname === '/auth/google') {
      try {
        const formData = await request.formData();
        const credential = formData.get('credential');

        // Verify token with Google's public endpoint
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!verifyRes.ok) return new Response('Invalid Google token', { status: 400 });
        
        const payload: any = await verifyRes.json();
        const email = payload.email;

        // Check if email is in our allowlist
        const allowedEmails = (env.ALLOWED_EMAILS || 'your-email@gmail.com').split(',').map((e: string) => e.trim().toLowerCase());
        if (!allowedEmails.includes(email.toLowerCase())) {
           return new Response(`Access Denied: Email not authorized. (Got: ${email})`, { status: 403 });
        }

        // Create a signed session cookie
        const secret = env.COOKIE_SECRET || 'dev-secret-key-change-me';
        const sessionToken = await signCookie(email, secret);

        return new Response('Redirecting...', {
           status: 303, // 303 Redirects POST back to GET
           headers: {
              'Location': '/admin',
              'Set-Cookie': `admin_session=${sessionToken}; HttpOnly; Secure; Path=/; Max-Age=604800`
           }
        });
      } catch (e: any) {
        return new Response('Auth Error: ' + e.message, { status: 500 });
      }
    }

    if (request.method === 'GET' && url.pathname === '/admin') {
      return new Response(ADMIN_HTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    if (request.method === 'GET' && url.pathname === '/api/products') {
      const { results } = await env.tile_db.prepare("SELECT * FROM products").all();
      return new Response(JSON.stringify({ data: results }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST' && url.pathname === '/sync') {
      const providedKey = request.headers.get('X-API-Key');
      const EXPECTED_KEY = "w6`?k(b);KH09nDc3QO5`8<WhTs.@Mb7#~qe9k";

      if (!providedKey || providedKey !== EXPECTED_KEY) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Invaild API Key!' 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        let data: any = await request.json();
        console.log("Received data from your soft:", data);

        // Extract array if it is wrapped in an 'updates' object
        let items = data.updates && Array.isArray(data.updates) ? data.updates : data;

        // Ensure items is treated as an array for batch processing
        if (!Array.isArray(items)) {
          items = [items];
        }

        // Prepare statement using UPSERT to insert or update existing products
        const stmt = env.tile_db.prepare(`
          INSERT INTO products (sku, name, stock, rrp, mpb, pcs, brp)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
          ON CONFLICT(sku) DO UPDATE SET
            name = COALESCE(excluded.name, products.name),
            stock = COALESCE(excluded.stock, products.stock),
            rrp = COALESCE(excluded.rrp, products.rrp),
            mpb = COALESCE(excluded.mpb, products.mpb),
            pcs = COALESCE(excluded.pcs, products.pcs),
            brp = COALESCE(excluded.brp, products.brp)
        `);

        const batchStatements = items.map((p: any) => 
          stmt.bind(
            p.sku, 
            p.name ?? p.description ?? null, // Fallback to description if name is not present
            p.stock ?? null, 
            p.rrp ?? null, 
            p.mpb ?? null, 
            p.pcs ?? null, 
            p.brp ?? null
          )
        );

        if (batchStatements.length > 0) {
          await env.tile_db.batch(batchStatements);
        }

        return new Response(JSON.stringify({ 
          status: 'success', 
          message: 'Data successfully synced to the D1 database!',
          received_data: data
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Bad Request', details: e.message }), { status: 400 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};