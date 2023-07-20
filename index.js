const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
console.log(process.env.MYVAL);

app.use(express.static(path.join(__dirname, 'web')));

app.listen(port, ()=> {
    console.log('🌍 Server listening');
})

