const str = "Some ! [alt](http) more ![img](http://example.com/img.png) and ![img2](data:image/png;base64,123) end.";
console.log(str.replace(/!\[[^\]]*\]\([^)]*\)/g, ''));
