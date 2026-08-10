const regex = /a/g;
const str = 'aba';
const matches = [...str.matchAll(regex)];
console.log(regex.lastIndex);
const newStr = str.replace(regex, 'c');
console.log(newStr);
