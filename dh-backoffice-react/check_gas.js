const fetch = require('node-fetch');
const url = 'https://script.google.com/macros/s/AKfycbzLaT5ytHzrhF20NOSJFsEJ0oOckm2O_BfRGbxDa5KGRUKo4mPKMd0ZZoa3tOUgzdv2/exec?t=' + Date.now();
fetch(url).then(res => res.json()).then(data => console.log(data.data[0])).catch(err => console.error(err));
