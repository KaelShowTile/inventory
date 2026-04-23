export default {
  async fetch(request, env, ctx) {
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

    if (request.method === 'POST' && new URL(request.url).pathname === '/sync') {
      try {
        const data = await request.json();
        console.log("Received data from your soft:", data);

        return new Response(JSON.stringify({ 
          status: 'success', 
          message: 'Your data is successfully passed to stock update app!',
          received_data: data
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response('Invalid JSON', { status: 400 });
      }
    }
    return new Response('Not Found', { status: 404 });
  }
};