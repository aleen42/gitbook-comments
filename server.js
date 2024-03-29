const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const port = process.env['PORT'] || 8080;

const _parseParams = str => str.split('&').map(item => item.split('=')).reduce((obj, item) => {
    item[0] && (obj[item[0]] = item[1]);
    return obj;
}, {});

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    /** avoid CORS */
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.get('/redirect', (req, res) => {
    const {
        type = 'github',
        redirect,
        authorized,
    } = req.query || {};

    res.redirect(301, `${authorized}?${[
        `client_id=${process.env['CLIENT_ID']}`,
        `redirect_url=${encodeURIComponent('https://gitbook-comments.aleen42.com/auth')}`,
        `state=${encodeURIComponent(JSON.stringify({redirect, type}))}`,
    ].join('&')}`);
});

app.get('/auth', (req, res) => {
    const {
        code,
        state,
    } = req.query || {};

    const {redirect, type} = JSON.parse(decodeURIComponent(state));
    switch (type) {
    case 'github':
        axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env['CLIENT_ID'],
            client_secret: process.env['CLIENT_SECRET'],
            code,
        }).then(({data}) => {
            const {access_token: accessToken} = _parseParams(data);
            res.redirect(302, `${redirect}#access_token=${accessToken}`);
        });
        break;
    }
});

app.listen(port, () => {
    console.log(`auth service is listening on port ${port}!`);
});
