export async function onRequestPost({ request, env }) {
  try {
    const { slug, content } = await request.json();
    if (!slug || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });
    }
    if (!env.DIRECTML_KV) {
      // still succeed so the UI stays simple if KV not bound
      return new Response(JSON.stringify({ ok: true, note: 'kv not configured' }), { status: 200 });
    }
    const key = `doc:${slug}`;
    await env.DIRECTML_KV.put(key, content);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'bad request' }), { status: 400 });
  }
}