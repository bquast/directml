export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || '';
  if (!slug) return new Response(JSON.stringify({ error: 'missing slug' }), { status: 400 });

  if (!env.DIRECTML_KV) {
    // if KV not bound, indicate missing
    return new Response(JSON.stringify({ content: null, note: 'kv not configured' }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  const key = `doc:${slug}`;
  const content = await env.DIRECTML_KV.get(key);
  return new Response(JSON.stringify({ content }), {
    headers: { 'content-type': 'application/json' }
  });
}