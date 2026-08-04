fetch('http://localhost:3000/api/embed-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'hello' })
}).then(r => r.json()).then(d => console.log('Len:', d?.values?.length)).catch(console.error);
