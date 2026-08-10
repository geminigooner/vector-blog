const body = "Some text ![alt](http://example.com/img.png) more text";
const bodyMarkdown = (body || '').replace(/!\[.*?\]\([^)]*\)/g, '').slice(0, 8000);
console.log(bodyMarkdown);
