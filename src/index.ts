//admin UI
const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tile Inventory Mapping Admin</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
    <style> body { background-color: #f8f9fa; } .container-fluid { padding: 20px; } </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container-fluid" style="padding: 0 20px;">
            <a class="navbar-brand" href="/admin">Inventory Admin</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link active" href="/admin">Products</a></li>
                    <li class="nav-item"><a class="nav-link" href="/admin/settings">Settings</a></li>
                </ul>
            </div>
        </div>
    </nav>
    <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Stock Management</h2>
            <button id="syncWebsitesBtn" class="btn btn-success">Sync Inventory to Websites</button>
        </div>
        <table id="productsTable" class="table table-striped" style="width:100%">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Stock</th>
                    <th>RRP</th>
                    <th>MPB</th>
                    <th>PCS</th>
                    <th>BRP</th>
                    <th>Update Date</th>
                    <th>CHT Name</th>
                    <th>GTO Name</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                
            </tbody>
        </table>
    </div>

    <!-- Edit Mapping Modal -->
    <div class="modal fade" id="editModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Map Product: <span id="modalSkuDisplay" class="fw-bold"></span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="mappingForm">
                        <input type="hidden" id="modalSku">
                        <div class="mb-3 position-relative">
                            <label class="form-label">CHT Product Mapping</label>
                            <input type="text" class="form-control" id="chtSearch" autocomplete="off" placeholder="Search CHT product...">
                            <input type="hidden" id="chtId">
                            <div id="chtSuggestions" class="list-group position-absolute w-100 shadow" style="z-index: 1000; display: none; max-height: 200px; overflow-y: auto;"></div>
                        </div>
                        <div class="mb-3 position-relative">
                            <label class="form-label">GTO Product Mapping</label>
                            <input type="text" class="form-control" id="gtoSearch" autocomplete="off" placeholder="Search GTO product...">
                            <input type="hidden" id="gtoId">
                            <div id="gtoSuggestions" class="list-group position-absolute w-100 shadow" style="z-index: 1000; display: none; max-height: 200px; overflow-y: auto;"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="saveMappingBtn">Save Mapping</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
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
                    { data: 'rrp' },
                    { data: 'mpb' },
                    { data: 'pcs' },
                    { data: 'brp' },
                    { data: 'updated_at' },
                    { data: 'cht_product_name' },
                    { data: 'gto_product_name' },
                    { 
                        data: null,
                        render: function(data, type, row) {
                            return '<button class="btn btn-sm btn-primary edit-btn" ' +
                                   'data-sku="'+row.sku+'" ' +
                                   'data-cht-id="'+(row.cht_product_id || '')+'" ' +
                                   'data-cht-name="'+(row.cht_product_name || '')+'" ' +
                                   'data-gto-id="'+(row.gto_product_id || '')+'" ' +
                                   'data-gto-name="'+(row.gto_product_name || '')+'">Edit</button>';
                        }
                    }
                ]
            });
            
            // Autocomplete Setup
            function setupAutocomplete(site, searchInputId, idInputId, suggestionsId) {
                let timer;
                $('#'+searchInputId).on('input', function() {
                    $('#'+idInputId).val(''); // Clear ID if user starts typing manually to prevent saving invalid mappings
                    clearTimeout(timer);
                    const keyword = $(this).val();
                    if(keyword.length < 2) { $('#'+suggestionsId).hide(); return; }
                    
                    timer = setTimeout(() => {
                        $.get('/api/mapping/search?site='+site+'&keyword='+encodeURIComponent(keyword), function(res) {
                            const container = $('#'+suggestionsId);
                            container.empty().show();
                            if(res.data && res.data.length > 0) {
                                res.data.forEach(item => {
                                    container.append('<button type="button" class="list-group-item list-group-item-action" data-id="'+item.id+'" data-name="'+item.name.replace(/"/g, '&quot;')+'">'+item.name+'</button>');
                                });
                            } else {
                                container.append('<div class="list-group-item text-muted">No results found</div>');
                            }
                        });
                    }, 300);
                });

                $('#'+suggestionsId).on('click', '.list-group-item-action', function() {
                    $('#'+searchInputId).val($(this).data('name'));
                    $('#'+idInputId).val($(this).data('id'));
                    $('#'+suggestionsId).hide();
                });

                $(document).on('click', function(e) {
                    if(!$(e.target).closest('#'+searchInputId+', #'+suggestionsId).length) { $('#'+suggestionsId).hide(); }
                });
            }

            setupAutocomplete('cht', 'chtSearch', 'chtId', 'chtSuggestions');
            setupAutocomplete('gto', 'gtoSearch', 'gtoId', 'gtoSuggestions');

            // Open Modal
            const editModalEl = document.getElementById('editModal');
            const editModal = new bootstrap.Modal(editModalEl);
            
            $('#productsTable').on('click', '.edit-btn', function() {
                $('#modalSku').val($(this).data('sku'));
                $('#modalSkuDisplay').text($(this).data('sku'));
                $('#chtSearch').val($(this).data('cht-name'));
                $('#chtId').val($(this).data('cht-id'));
                $('#gtoSearch').val($(this).data('gto-name'));
                $('#gtoId').val($(this).data('gto-id'));
                $('#chtSuggestions, #gtoSuggestions').hide();
                editModal.show();
            });

            // Save Mapping
            $('#saveMappingBtn').on('click', function() {
                const btn = $(this);
                btn.prop('disabled', true).text('Saving...');
                const payload = {
                    sku: $('#modalSku').val(),
                    cht_product_id: $('#chtId').val() || null,
                    cht_product_name: $('#chtId').val() ? $('#chtSearch').val() : null, // Only save name if a valid ID is selected
                    gto_product_id: $('#gtoId').val() || null,
                    gto_product_name: $('#gtoId').val() ? $('#gtoSearch').val() : null
                };
                
                $.ajax({
                    url: '/api/products/map',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function() {
                        bootstrap.Modal.getInstance(editModalEl).hide();
                        table.ajax.reload(null, false); // Reload table without resetting pagination
                    },
                    error: function(err) {
                        alert('Error saving mapping: ' + (err.responseJSON ? err.responseJSON.error : 'Unknown error'));
                    },
                    complete: function() {
                        btn.prop('disabled', false).text('Save Mapping');
                    }
                });
            });

            // Sync Inventory to Websites
            $('#syncWebsitesBtn').on('click', function() {
                const btn = $(this);
                btn.prop('disabled', true).text('Syncing...');
                $.ajax({
                    url: '/api/sync-websites',
                    type: 'POST',
                    success: function(res) {
                        let msg = 'Sync completed!\\n\\n';
                        if (res.details.cht) msg += 'CHT: ' + (res.details.cht.ok ? 'Success (' + res.details.cht.updated + ' products updated)' : 'Failed or Skipped') + '\\n';
                        if (res.details.gto) msg += 'GTO: ' + (res.details.gto.ok ? 'Success (' + res.details.gto.updated + ' products updated)' : 'Failed or Skipped');
                        alert(msg);
                    },
                    error: function(err) {
                        alert('Error syncing: ' + (err.responseJSON ? err.responseJSON.error : 'Unknown error'));
                    },
                    complete: function() {
                        btn.prop('disabled', false).text('Sync Inventory to Websites');
                    }
                });
            });

        });
    </script>
</body>
</html>
`;

const SETTINGS_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Settings - Inventory Mapping</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
    <style> body { background-color: #f8f9fa; } .container-fluid { padding: 20px; } .settings-container { max-width: 800px; margin: 0 auto; } </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container-fluid" style="padding: 0 20px;">
            <a class="navbar-brand" href="/admin">Inventory Admin</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="/admin">Products</a></li>
                    <li class="nav-item"><a class="nav-link active" href="/admin/settings">Settings</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="settings-container bg-white p-4 rounded shadow-sm">
        <h2 class="mb-4">System Settings</h2>
        <div id="alertBox" class="alert d-none"></div>
        <form id="settingsForm">
            <h5 class="mt-4 border-bottom pb-2">CHT Website API</h5>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Endpoint URL</label>
                    <input type="url" class="form-control" name="cht_endpoint" placeholder="https://cht.example.com/wp-json/wc/v3/...">
                </div>
                <div class="col-md-6">
                    <label class="form-label">API Key / Secret</label>
                    <input type="text" class="form-control" name="cht_api_key">
                </div>
                <div class="col-md-12 mt-3">
                    <label class="form-label">Products JSON URL</label>
                    <input type="url" class="form-control" name="cht_products_json_url" placeholder="https://cht.example.com/.../products.json">
                </div>
            </div>

            <h5 class="mt-4 border-bottom pb-2">GTO Website API</h5>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Endpoint URL</label>
                    <input type="url" class="form-control" name="gto_endpoint" placeholder="https://gto.example.com/wp-json/wc/v3/...">
                </div>
                <div class="col-md-6">
                    <label class="form-label">API Key / Secret</label>
                    <input type="text" class="form-control" name="gto_api_key">
                </div>
                <div class="col-md-12 mt-3">
                    <label class="form-label">Products JSON URL</label>
                    <input type="url" class="form-control" name="gto_products_json_url" placeholder="https://gto.example.com/.../products.json">
                </div>
            </div>

            <button type="submit" class="btn btn-primary mt-3" id="saveBtn">Save Settings</button>
        </form>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script>
        $(document).ready(function() {
            $.get('/api/settings', function(res) {
                if(res.data) {
                    for(const key in res.data) { $('[name="'+key+'"]').val(res.data[key]); }
                }
            });
            $('#settingsForm').on('submit', function(e) {
                e.preventDefault();
                $('#saveBtn').prop('disabled', true).text('Saving...');
                const formData = {};
                $(this).serializeArray().forEach(item => formData[item.name] = item.value);
                $.ajax({ url: '/api/settings', type: 'POST', contentType: 'application/json', data: JSON.stringify(formData), success: function() { $('#alertBox').removeClass('d-none alert-danger').addClass('alert-success').text('Settings saved successfully!'); setTimeout(() => $('#alertBox').addClass('d-none'), 3000); }, error: function() { $('#alertBox').removeClass('d-none alert-success').addClass('alert-danger').text('Failed to save settings.'); }, complete: function() { $('#saveBtn').prop('disabled', false).text('Save Settings'); } });
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
    const protectedRoutes = ['/admin', '/admin/settings', '/api/products', '/api/settings', '/api/mapping/search', '/api/products/map', '/api/sync-websites'];
    if (protectedRoutes.includes(url.pathname)) {
      const cookie = getCookie(request, 'admin_session');
      const secret = env.COOKIE_SECRET || 'dev-secret-key-change-me';
      const email = cookie ? await verifyCookie(cookie, secret) : null;

      if (!email) {
        if (url.pathname.startsWith('/api/')) {
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

    if (request.method === 'GET' && url.pathname === '/admin/settings') {
      return new Response(SETTINGS_HTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    if (request.method === 'GET' && url.pathname === '/api/settings') {
      try {
        const { results } = await env.tile_db.prepare("SELECT * FROM settings").all();
        const settingsObj: any = {};
        results.forEach((r: any) => settingsObj[r.key] = r.value);
        return new Response(JSON.stringify({ data: settingsObj }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch(e) {
        // If the table doesn't exist yet, return empty object
        return new Response(JSON.stringify({ data: {} }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/settings') {
      try {
        const body: any = await request.json();
        const statements = [];
        const stmt = env.tile_db.prepare("INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
        for (const [key, value] of Object.entries(body)) {
          statements.push(stmt.bind(key, value as string));
        }
        if (statements.length > 0) {
          await env.tile_db.batch(statements);
        }
        return new Response(JSON.stringify({ status: 'success' }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/mapping/search') {
      const site = url.searchParams.get('site');
      const keyword = url.searchParams.get('keyword')?.toLowerCase();
      if (!site || !keyword) return new Response(JSON.stringify({ data: [] }), { headers: { 'Content-Type': 'application/json' } });

      try {
        const settingKey = site === 'cht' ? 'cht_products_json_url' : 'gto_products_json_url';
        const setting = await env.tile_db.prepare("SELECT value FROM settings WHERE key = ?").bind(settingKey).first();
        if (!setting || !setting.value) return new Response(JSON.stringify({ error: 'JSON URL not configured in settings' }), { status: 400 });

        const jsonUrl = setting.value as string;
        const cacheKey = new Request(jsonUrl, request);
        const cache = caches.default;
        
        let response = await cache.match(cacheKey);
        if (!response) {
          response = await fetch(jsonUrl);
          if (response.ok) {
            const responseToCache = new Response(response.body, response);
            responseToCache.headers.append('Cache-Control', 's-maxage=3600'); // Cache for 1 hour
            ctx.waitUntil(cache.put(cacheKey, responseToCache));
          } else {
            throw new Error('Failed to fetch JSON from remote site');
          }
        }
        
        const products = await response.clone().json();
        const filtered = products.filter((p: any) => p.name.toLowerCase().includes(keyword)).slice(0, 10);
        return new Response(JSON.stringify({ data: filtered }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/products/map') {
      try {
        const body: any = await request.json();
        await env.tile_db.prepare(`
          UPDATE products 
          SET cht_product_id = ?1, cht_product_name = ?2, 
              gto_product_id = ?3, gto_product_name = ?4,
              updated_at = CURRENT_TIMESTAMP
          WHERE sku = ?5
        `).bind(
          body.cht_product_id, body.cht_product_name,
          body.gto_product_id, body.gto_product_name,
          body.sku
        ).run();
        return new Response(JSON.stringify({ status: 'success' }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/sync-websites') {
      try {
        // Fetch settings for endpoints and api keys
        const { results: settingsRows } = await env.tile_db.prepare("SELECT * FROM settings").all();
        const settings: any = {};
        settingsRows.forEach((r: any) => settings[r.key] = r.value);

        const resultsObj: any = { cht: null, gto: null };

        // Sync CHT
        if (settings.cht_endpoint && settings.cht_api_key) {
          // Automatically sum stock for duplicate IDs using SQL GROUP BY
          const { results: chtData } = await env.tile_db.prepare("SELECT cht_product_id as id, SUM(stock) as stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
          if (chtData.length > 0) {
            const res = await fetch(settings.cht_endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.cht_api_key}`
              },
              body: JSON.stringify(chtData)
            });
            resultsObj.cht = { status: res.status, ok: res.ok, updated: chtData.length };
          } else {
            resultsObj.cht = { ok: false, reason: 'No mapped products for CHT' };
          }
        }

        // Sync GTO
        if (settings.gto_endpoint && settings.gto_api_key) {
          const { results: gtoData } = await env.tile_db.prepare("SELECT gto_product_id as id, SUM(stock) as stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
          if (gtoData.length > 0) {
            const res = await fetch(settings.gto_endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.gto_api_key}`
              },
              body: JSON.stringify(gtoData)
            });
            resultsObj.gto = { status: res.status, ok: res.ok, updated: gtoData.length };
          } else {
            resultsObj.gto = { ok: false, reason: 'No mapped products for GTO' };
          }
        }

        return new Response(JSON.stringify({ status: 'success', details: resultsObj }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
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
          INSERT INTO products (sku, name, stock, rrp, mpb, pcs, brp, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
          ON CONFLICT(sku) DO UPDATE SET
            name = COALESCE(excluded.name, products.name),
            stock = COALESCE(excluded.stock, products.stock),
            rrp = COALESCE(excluded.rrp, products.rrp),
            mpb = COALESCE(excluded.mpb, products.mpb),
            pcs = COALESCE(excluded.pcs, products.pcs),
            brp = COALESCE(excluded.brp, products.brp),
            updated_at = CURRENT_TIMESTAMP
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