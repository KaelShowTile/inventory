export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/sync') {
      try {
        const data = await request.json();
        console.log("Received data from C# soft:", data);

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