fetch('http://localhost:3000/api/embed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ artifact: { id: "test", title: "test", type: "Essay", authorIntent: "test", bodyMarkdown: "test" } })
}).then(r => r.json()).then(console.log).catch(console.error);
