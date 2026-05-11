//admin UI
const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tile Inventory Mapping Admin</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
    <style> body { background-color: #f8f9fa; } .container-fluid { padding: 20px; } tr th.sorting{max-width: 300px;}</style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container-fluid" style="padding: 3px 20px 0;">
            <a class="navbar-brand" style="margin-right:50px;margin-bottom: 3px;" href="/admin">ST Inventory Admin</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link active" href="/admin">Products</a></li>
                    <li class="nav-item"><a class="nav-link" href="/admin/settings">Settings</a></li>
                </ul>
                <ul class="navbar-nav">
                    <li class="nav-item"><a class="btn btn-danger" href="/logout">Logout</a></li>
                </ul>
            </div>
        </div>
    </nav>
    <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 30px !important; padding-bottom: 8px; border-bottom: 2px dashed #eee;">
            <h2 style="margin-bottom: 0;">SKU MAPPING</h2>
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
                    <th>Backorder</th>
                    <th>Force In Stock</th>
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
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="backorderCheck">
                        <label class="form-check-label" for="backorderCheck">Backorder is available</label>
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="forceInStockCheck">
                        <label class="form-check-label" for="forceInStockCheck">Force In Stock</label>
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
                    { 
                        data: 'backorder',
                        render: function(data) { return data ? '<input type="checkbox" disabled checked>' : '<input type="checkbox" disabled>'; }
                    },
                    { 
                        data: 'force_in_stock',
                        render: function(data) { return data ? '<input type="checkbox" disabled checked>' : '<input type="checkbox" disabled>'; }
                    },
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
                                   'data-gto-name="'+(row.gto_product_name || '')+'" ' +
                                   'data-backorder="'+(row.backorder ? 1 : 0)+'" ' +
                                   'data-force-in-stock="'+(row.force_in_stock ? 1 : 0)+'">Edit</button>' +
                                   '<button class="btn btn-sm btn-danger delete-btn ms-1" data-sku="'+row.sku+'">Delete</button>';
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
                $('#backorderCheck').prop('checked', $(this).data('backorder') == 1);
                $('#forceInStockCheck').prop('checked', $(this).data('force-in-stock') == 1);
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
                    gto_product_name: $('#gtoId').val() ? $('#gtoSearch').val() : null,
                    backorder: $('#backorderCheck').is(':checked'),
                    force_in_stock: $('#forceInStockCheck').is(':checked')
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

            // Delete Single Product
            $('#productsTable').on('click', '.delete-btn', function() {
                const sku = $(this).data('sku');
                if (confirm('Are you sure you want to delete SKU: ' + sku + '?')) {
                    const btn = $(this);
                    btn.prop('disabled', true).text('...');
                    $.ajax({
                        url: '/api/products',
                        type: 'DELETE',
                        contentType: 'application/json',
                        data: JSON.stringify({ sku: sku }),
                        success: function() {
                            table.ajax.reload(null, false);
                        },
                        error: function(err) {
                            alert('Error deleting product: ' + (err.responseJSON ? err.responseJSON.error : 'Unknown error'));
                            btn.prop('disabled', false).text('Delete');
                        }
                    });
                }
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
    <style> body { background-color: #f8f9fa; } .container-fluid { padding: 20px; } .settings-container { max-width: 800px; margin: 0 auto; } .form-label{font-size: 0.85rem; margin-bottom: 2px; color: #999; letter-spacing: 0.2px;} input.form-control{background-color: #eee;} input.form-control:focus{box-shadow: 0 0 0 1px rgba(13, 110, 253, .25);}</style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container-fluid" style="padding: 3px 20px 0;">
            <a class="navbar-brand" style="margin-right:50px;margin-bottom: 3px;" href="/admin">ST Inventory Admin</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="/admin">Products</a></li>
                    <li class="nav-item"><a class="nav-link active" href="/admin/settings">Settings</a></li>
                </ul>
                <ul class="navbar-nav">
                    <li class="nav-item"><a class="btn btn-danger" href="/logout">Logout</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="settings-container bg-white p-4 rounded shadow-sm">
        <h2 class="mb-4" style="margin-bottom: 30px !important; padding-bottom: 15px; border-bottom: 2px dashed #eee;">System Settings</h2>
        <div id="alertBox" class="alert d-none"></div>
        <form id="settingsForm">
            <h5 class="mt-4 pb-2">CHT Website API</h5>
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

            <h5 class="mt-4 pb-2">GTO Website API</h5>
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

        <h5 class="mt-5 border-bottom pb-2">Export / Import Products</h5>
        <div class="row mb-3 align-items-center">
            <div class="col-md-8">
                <p class="text-muted mb-0"><small>Export all products to CSV, or import a CSV to bulk update/add products. (Website inventory will NOT be synced automatically during import)</small></p>
            </div>
            <div class="col-md-4 text-end">
                <button type="button" class="btn btn-secondary me-2" id="exportCsvBtn">Export CSV</button>
                <button type="button" class="btn btn-primary" id="importCsvBtn">Import CSV</button>
                <input type="file" id="csvFileInput" accept=".csv" style="display: none;">
            </div>
        </div>

        <h5 class="mt-5 border-bottom pb-2 text-danger">Delete All Records?</h5>
        <div class="row mb-3 align-items-center">
            <div class="col-md-8">
                <p class="text-muted mb-0"><small>This will permanently remove all product records from the database. This action cannot be undone.</small></p>
            </div>
            <div class="col-md-4 text-end">
                <button type="button" class="btn btn-danger" id="deleteAllBtn">Delete All</button>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
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

            // Export CSV
            $('#exportCsvBtn').on('click', function() {
                const btn = $(this);
                btn.prop('disabled', true).text('Exporting...');
                $.get('/api/products', function(res) {
                    if(!res.data || res.data.length === 0) { alert('No products to export.'); btn.prop('disabled', false).text('Export CSV'); return; }
                    const fields = ['sku', 'name', 'stock', 'rrp', 'mpb', 'pcs', 'brp', 'updated_at', 'cht_product_id', 'cht_product_name', 'gto_product_id', 'gto_product_name'];
                    const csv = Papa.unparse({
                        fields: ['SKU', 'Name', 'Stock', 'RRP', 'MPB', 'PCS', 'BRP', 'Update Date', 'CHT Product ID', 'CHT Product Name', 'GTO Product ID', 'GTO Product Name'],
                        data: res.data.map(row => fields.map(f => row[f]))
                    });
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'products_export_' + new Date().toISOString().slice(0,10) + '.csv';
                    link.click();
                    btn.prop('disabled', false).text('Export CSV');
                });
            });

            // Import CSV
            $('#importCsvBtn').on('click', function() { $('#csvFileInput').click(); });
            $('#csvFileInput').on('change', function(e) {
                const file = e.target.files[0];
                if(!file) return;
                $('#importCsvBtn').prop('disabled', true).text('Parsing...');
                Papa.parse(file, {
                    header: true, skipEmptyLines: true,
                    complete: function(results) {
                        const data = results.data.map(row => ({
                            sku: row['SKU'], name: row['Name'],
                            stock: row['Stock'] ? parseInt(row['Stock']) : null,
                            rrp: row['RRP'] ? parseFloat(row['RRP']) : null,
                            mpb: row['MPB'] ? parseFloat(row['MPB']) : null,
                            pcs: row['PCS'] ? parseInt(row['PCS']) : null,
                            brp: row['BRP'] ? parseFloat(row['BRP']) : null,
                            cht_product_id: row['CHT Product ID'] ? parseInt(row['CHT Product ID']) : null,
                            gto_product_id: row['GTO Product ID'] ? parseInt(row['GTO Product ID']) : null
                        })).filter(item => item.sku); // SKU is mandatory

                        if(data.length === 0) { alert('No valid rows found in CSV.'); $('#importCsvBtn').prop('disabled', false).text('Import CSV'); $('#csvFileInput').val(''); return; }
                        $('#importCsvBtn').text('Importing ' + data.length + ' rows...');
                        
                        $.ajax({
                            url: '/api/products/import', type: 'POST', contentType: 'application/json', data: JSON.stringify(data),
                            success: function(res) {
                                $('#alertBox').removeClass('d-none alert-danger').addClass('alert-success').text('Successfully imported ' + res.imported + ' products! Note: Website inventory was NOT synced automatically. Go to Products page and click Sync if needed.');
                                window.scrollTo(0,0);
                            },
                            error: function(err) {
                                $('#alertBox').removeClass('d-none alert-success').addClass('alert-danger').text('Failed to import: ' + (err.responseJSON ? err.responseJSON.error : 'Unknown error'));
                                window.scrollTo(0,0);
                            },
                            complete: function() { $('#importCsvBtn').prop('disabled', false).text('Import CSV'); $('#csvFileInput').val(''); }
                        });
                    }
                });
            });

            // Delete All Products
            $('#deleteAllBtn').on('click', function() {
                if (confirm('Are you ABSOLUTELY sure you want to DELETE ALL product records? This action cannot be undone!')) {
                    const btn = $(this);
                    btn.prop('disabled', true).text('Deleting...');
                    $.ajax({
                        url: '/api/products/all',
                        type: 'DELETE',
                        success: function() {
                            $('#alertBox').removeClass('d-none alert-danger').addClass('alert-success').text('All product records deleted successfully!');
                            setTimeout(() => $('#alertBox').addClass('d-none'), 3000);
                        },
                        error: function(err) {
                            $('#alertBox').removeClass('d-none alert-success').addClass('alert-danger').text('Failed to delete records.');
                        },
                        complete: function() {
                            btn.prop('disabled', false).text('Delete All');
                        }
                    });
                }
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
    const protectedRoutes = ['/admin', '/admin/settings', '/api/products', '/api/products/import', '/api/products/all', '/api/settings', '/api/mapping/search', '/api/products/map', '/api/sync-websites'];
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

    if (request.method === 'GET' && url.pathname === '/logout') {
      return new Response('Redirecting...', {
        status: 302,
        headers: {
          'Location': '/login',
          'Set-Cookie': 'admin_session=; HttpOnly; Secure; Path=/; Max-Age=0'
        }
      });
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

    if (request.method === 'DELETE' && url.pathname === '/api/products') {
      try {
        const body: any = await request.json();
        if (!body.sku) return new Response(JSON.stringify({ error: 'SKU required' }), { status: 400 });

        // 1. Snapshot MAX stock BEFORE delete
        const { results: preCht } = await env.tile_db.prepare("SELECT cht_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
        const preChtMap = new Map(preCht.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));
        
        const { results: preGto } = await env.tile_db.prepare("SELECT gto_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
        const preGtoMap = new Map(preGto.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));

        // 2. Perform delete
        await env.tile_db.prepare("DELETE FROM products WHERE sku = ?").bind(body.sku).run();

        // 3. Snapshot MAX stock AFTER delete
        const { results: postCht } = await env.tile_db.prepare("SELECT cht_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
        const postChtMap = new Map(postCht.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));
        
        const { results: postGto } = await env.tile_db.prepare("SELECT gto_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
        const postGtoMap = new Map(postGto.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));

        // 4. Compare and find what actually changed
        const chtUpdates: any[] = [];
        const allChtIds = new Set([...preChtMap.keys(), ...postChtMap.keys()]);
        for (const id of allChtIds) {
            const oldVal = preChtMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            const newVal = postChtMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            if (oldVal.stock !== newVal.stock || oldVal.backorder !== newVal.backorder || oldVal.force_in_stock !== newVal.force_in_stock) {
                chtUpdates.push({ id, stock: newVal.stock, backorder: !!newVal.backorder, force_in_stock: !!newVal.force_in_stock });
            }
        }
        
        const gtoUpdates: any[] = [];
        const allGtoIds = new Set([...preGtoMap.keys(), ...postGtoMap.keys()]);
        for (const id of allGtoIds) {
            const oldVal = preGtoMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            const newVal = postGtoMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            if (oldVal.stock !== newVal.stock || oldVal.backorder !== newVal.backorder || oldVal.force_in_stock !== newVal.force_in_stock) {
                gtoUpdates.push({ id, stock: newVal.stock, backorder: !!newVal.backorder, force_in_stock: !!newVal.force_in_stock });
            }
        }

        // 5. Auto-push to websites if there are changes
        if (chtUpdates.length > 0 || gtoUpdates.length > 0) {
            const { results: settingsRows } = await env.tile_db.prepare("SELECT * FROM settings").all();
            const settings: any = {};
            settingsRows.forEach((r: any) => settings[r.key] = r.value);

            if (chtUpdates.length > 0 && settings.cht_endpoint && settings.cht_api_key) {
                ctx.waitUntil(fetch(settings.cht_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.cht_api_key}` }, body: JSON.stringify(chtUpdates) }).catch(e => console.error("Auto CHT Push Error:", e)));
            }
            if (gtoUpdates.length > 0 && settings.gto_endpoint && settings.gto_api_key) {
                ctx.waitUntil(fetch(settings.gto_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.gto_api_key}` }, body: JSON.stringify(gtoUpdates) }).catch(e => console.error("Auto GTO Push Error:", e)));
            }
        }

        return new Response(JSON.stringify({ status: 'success' }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'DELETE' && url.pathname === '/api/products/all') {
      try {
        await env.tile_db.prepare("DELETE FROM products").run();
        return new Response(JSON.stringify({ status: 'success' }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/products/import') {
      try {
        const items: any[] = await request.json();
        if (!Array.isArray(items) || items.length === 0) return new Response(JSON.stringify({ error: 'No data to import' }), { status: 400 });

        // Fetch JSONs to resolve real names based purely on ID
        const { results: settingsRows } = await env.tile_db.prepare("SELECT * FROM settings").all();
        const settings: any = {};
        settingsRows.forEach((r: any) => settings[r.key] = r.value);

        const resolveNames = async (siteKey: string) => {
          const jsonUrl = settings[siteKey];
          if (!jsonUrl) return new Map();
          try {
            const cacheKey = new Request(jsonUrl);
            let response = await caches.default.match(cacheKey);
            if (!response) {
              response = await fetch(jsonUrl);
              if (response.ok) {
                const responseToCache = new Response(response.body, response);
                responseToCache.headers.append('Cache-Control', 's-maxage=3600');
                ctx.waitUntil(caches.default.put(cacheKey, responseToCache));
              } else return new Map();
            }
            const products = await response.clone().json();
            return new Map(products.map((p: any) => [Number(p.id), p.name]));
          } catch(e) { return new Map(); }
        };

        const chtMap = await resolveNames('cht_products_json_url');
        const gtoMap = await resolveNames('gto_products_json_url');

        const stmt = env.tile_db.prepare(`
          INSERT INTO products (sku, name, stock, rrp, mpb, pcs, brp, cht_product_id, cht_product_name, gto_product_id, gto_product_name, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, CURRENT_TIMESTAMP)
          ON CONFLICT(sku) DO UPDATE SET
            name = excluded.name, stock = excluded.stock, rrp = excluded.rrp, mpb = excluded.mpb, pcs = excluded.pcs, brp = excluded.brp,
            cht_product_id = excluded.cht_product_id, cht_product_name = excluded.cht_product_name,
            gto_product_id = excluded.gto_product_id, gto_product_name = excluded.gto_product_name,
            updated_at = CURRENT_TIMESTAMP
        `);

        const batchStatements = items.map((p: any) => {
           const chtName = p.cht_product_id ? (chtMap.get(p.cht_product_id) || null) : null;
           const gtoName = p.gto_product_id ? (gtoMap.get(p.gto_product_id) || null) : null;
           return stmt.bind(p.sku, p.name || null, p.stock ?? null, p.rrp ?? null, p.mpb ?? null, p.pcs ?? null, p.brp ?? null, p.cht_product_id ?? null, chtName, p.gto_product_id ?? null, gtoName);
        });

        // Execute in chunks to respect database limits
        for (let i = 0; i < batchStatements.length; i += 100) {
          await env.tile_db.batch(batchStatements.slice(i, i + 100));
        }

        return new Response(JSON.stringify({ status: 'success', imported: items.length }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
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
        const cacheKey = new Request(jsonUrl);
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

        // 1. Snapshot MAX stock BEFORE map update
        const { results: preCht } = await env.tile_db.prepare("SELECT cht_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
        const preChtMap = new Map(preCht.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));
        
        const { results: preGto } = await env.tile_db.prepare("SELECT gto_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
        const preGtoMap = new Map(preGto.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));

        // 2. Perform map update
        await env.tile_db.prepare(`
          UPDATE products 
          SET cht_product_id = ?1, cht_product_name = ?2, 
              gto_product_id = ?3, gto_product_name = ?4,
              backorder = ?5, force_in_stock = ?6,
              updated_at = CURRENT_TIMESTAMP
          WHERE sku = ?7
        `).bind(
          body.cht_product_id, body.cht_product_name,
          body.gto_product_id, body.gto_product_name,
          body.backorder ? 1 : 0, body.force_in_stock ? 1 : 0,
          body.sku
        ).run();

        // 3. Snapshot MAX stock AFTER map update
        const { results: postCht } = await env.tile_db.prepare("SELECT cht_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
        const postChtMap = new Map(postCht.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));
        
        const { results: postGto } = await env.tile_db.prepare("SELECT gto_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
        const postGtoMap = new Map(postGto.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));

        // 4. Compare and find what actually changed
        const chtUpdates: any[] = [];
        const allChtIds = new Set([...preChtMap.keys(), ...postChtMap.keys()]);
        for (const id of allChtIds) {
            const oldVal = preChtMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            const newVal = postChtMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            if (oldVal.stock !== newVal.stock || oldVal.backorder !== newVal.backorder || oldVal.force_in_stock !== newVal.force_in_stock) {
                chtUpdates.push({ id, stock: newVal.stock, backorder: !!newVal.backorder, force_in_stock: !!newVal.force_in_stock });
            }
        }
        
        const gtoUpdates: any[] = [];
        const allGtoIds = new Set([...preGtoMap.keys(), ...postGtoMap.keys()]);
        for (const id of allGtoIds) {
            const oldVal = preGtoMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            const newVal = postGtoMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            if (oldVal.stock !== newVal.stock || oldVal.backorder !== newVal.backorder || oldVal.force_in_stock !== newVal.force_in_stock) {
                gtoUpdates.push({ id, stock: newVal.stock, backorder: !!newVal.backorder, force_in_stock: !!newVal.force_in_stock });
            }
        }

        // 5. Auto-push to websites if there are changes
        if (chtUpdates.length > 0 || gtoUpdates.length > 0) {
            const { results: settingsRows } = await env.tile_db.prepare("SELECT * FROM settings").all();
            const settings: any = {};
            settingsRows.forEach((r: any) => settings[r.key] = r.value);

            if (chtUpdates.length > 0 && settings.cht_endpoint && settings.cht_api_key) {
                ctx.waitUntil(fetch(settings.cht_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.cht_api_key}` }, body: JSON.stringify(chtUpdates) }).catch(e => console.error("Auto CHT Push Error:", e)));
            }
            if (gtoUpdates.length > 0 && settings.gto_endpoint && settings.gto_api_key) {
                ctx.waitUntil(fetch(settings.gto_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.gto_api_key}` }, body: JSON.stringify(gtoUpdates) }).catch(e => console.error("Auto GTO Push Error:", e)));
            }
        }

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
          // Use MAX instead of SUM to get the highest batch stock
          const { results: chtData } = await env.tile_db.prepare("SELECT cht_product_id as id, MAX(stock) as stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
          if (chtData.length > 0) {
            const payload = chtData.map((r: any) => ({ id: r.id, stock: r.stock, backorder: !!r.backorder, force_in_stock: !!r.force_in_stock }));
            const res = await fetch(settings.cht_endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.cht_api_key}`
              },
              body: JSON.stringify(payload)
            });
            resultsObj.cht = { status: res.status, ok: res.ok, updated: chtData.length };
          } else {
            resultsObj.cht = { ok: false, reason: 'No mapped products for CHT' };
          }
        }

        // Sync GTO
        if (settings.gto_endpoint && settings.gto_api_key) {
          const { results: gtoData } = await env.tile_db.prepare("SELECT gto_product_id as id, MAX(stock) as stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
          if (gtoData.length > 0) {
            const payload = gtoData.map((r: any) => ({ id: r.id, stock: r.stock, backorder: !!r.backorder, force_in_stock: !!r.force_in_stock }));
            const res = await fetch(settings.gto_endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.gto_api_key}`
              },
              body: JSON.stringify(payload)
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

        // 1. Snapshot MAX stock BEFORE update
        const { results: preCht } = await env.tile_db.prepare("SELECT cht_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
        const preChtMap = new Map(preCht.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));
        
        const { results: preGto } = await env.tile_db.prepare("SELECT gto_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
        const preGtoMap = new Map(preGto.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));

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

        // 2. Snapshot MAX stock AFTER update
        const { results: postCht } = await env.tile_db.prepare("SELECT cht_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE cht_product_id IS NOT NULL GROUP BY cht_product_id").all();
        const postChtMap = new Map(postCht.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));
        
        const { results: postGto } = await env.tile_db.prepare("SELECT gto_product_id as id, MAX(stock) as max_stock, MAX(backorder) as backorder, MAX(force_in_stock) as force_in_stock FROM products WHERE gto_product_id IS NOT NULL GROUP BY gto_product_id").all();
        const postGtoMap = new Map(postGto.map((r: any) => [r.id, { stock: r.max_stock, backorder: r.backorder, force_in_stock: r.force_in_stock }]));

        // 3. Compare and find what actually changed
        const chtUpdates: any[] = [];
        const allChtIds = new Set([...preChtMap.keys(), ...postChtMap.keys()]);
        for (const id of allChtIds) {
            const oldVal = preChtMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            const newVal = postChtMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            if (oldVal.stock !== newVal.stock || oldVal.backorder !== newVal.backorder || oldVal.force_in_stock !== newVal.force_in_stock) {
                chtUpdates.push({ id, stock: newVal.stock, backorder: !!newVal.backorder, force_in_stock: !!newVal.force_in_stock });
            }
        }
        
        const gtoUpdates: any[] = [];
        const allGtoIds = new Set([...preGtoMap.keys(), ...postGtoMap.keys()]);
        for (const id of allGtoIds) {
            const oldVal = preGtoMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            const newVal = postGtoMap.get(id) ?? { stock: 0, backorder: 0, force_in_stock: 0 };
            if (oldVal.stock !== newVal.stock || oldVal.backorder !== newVal.backorder || oldVal.force_in_stock !== newVal.force_in_stock) {
                gtoUpdates.push({ id, stock: newVal.stock, backorder: !!newVal.backorder, force_in_stock: !!newVal.force_in_stock });
            }
        }

        // 4. Auto-push to websites if there are changes
        let pushResults = { cht_pushed: chtUpdates.length, gto_pushed: gtoUpdates.length };
        if (chtUpdates.length > 0 || gtoUpdates.length > 0) {
            const { results: settingsRows } = await env.tile_db.prepare("SELECT * FROM settings").all();
            const settings: any = {};
            settingsRows.forEach((r: any) => settings[r.key] = r.value);

            // Use ctx.waitUntil so the worker responds to C# instantly while sending HTTP requests to WP in the background
            if (chtUpdates.length > 0 && settings.cht_endpoint && settings.cht_api_key) {
                ctx.waitUntil(fetch(settings.cht_endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.cht_api_key}` },
                    body: JSON.stringify(chtUpdates)
                }).catch(e => console.error("Auto CHT Push Error:", e)));
            }

            if (gtoUpdates.length > 0 && settings.gto_endpoint && settings.gto_api_key) {
                ctx.waitUntil(fetch(settings.gto_endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.gto_api_key}` },
                    body: JSON.stringify(gtoUpdates)
                }).catch(e => console.error("Auto GTO Push Error:", e)));
            }
        }

        return new Response(JSON.stringify({ 
          status: 'success', 
          message: 'Data successfully synced to the D1 database!',
          pushed_to_websites: pushResults
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Bad Request', details: e.message }), { status: 400 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};