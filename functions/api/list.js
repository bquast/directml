export async function onRequestGet({ env }) {
  if (!env.DIRECTML_KV) {
    return new Response(JSON.stringify({ items: [], note: 'kv not configured' }), {
      headers: { 'content-type': 'application/json' }
    });
  }
  const out = [];
  let cursor;
  do {
    const { keys, list_complete, cursor: c } = await env.DIRECTML_KV.list({ prefix: 'doc:', cursor });
    out.push(...keys.map(k => k.name.replace(/^doc:/, '')));
    cursor = list_complete ? undefined : c;
  } while (cursor);
  return new Response(JSON.stringify({ items: out }), {
    headers: { 'content-type': 'application/json' }
  });
}