const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  'allow read: if resource.data.status == "published" || isOwner();',
  'allow read: if true;'
);
fs.writeFileSync('firestore.rules', rules);
