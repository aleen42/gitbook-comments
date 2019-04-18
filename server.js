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
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/gitbook-comments/redirect', (req, res) => {
    const {
        redirect,
        authorized,
    } = req.query || {};

    res.redirect(301, `${authorized}?${[
        `client_id=${process.env['CLIENT_ID']}`,
        `redirect_url=${encodeURIComponent('https://gitbook-comments.herokuapp.com/gitbook-comments/auth')}`,
        `state=${encodeURIComponent(redirect)}`
    ].join('&')}`);
});

app.get('/gitbook-comments/auth', (req, res) => {
    const {
        code,
        state,
    } = req.query || {};

    res.redirect(301, `${decodeURIComponent(state)}?code=${code}`);
});

app.post('/gitbook-comments/auth', (req, res) => {
    const {
        type = 'github',
        code,
        redirect_url = '',
    } = req.body || {};

    switch (type) {
        case 'github':
            axios.post('https://github.com/login/oauth/access_token', {
                client_id: process.env['CLIENT_ID'],
                client_secret: process.env['CLIENT_SECRET'],
                code,
            }).then(({data}) => res.json(_parseParams(data))).catch(error => res.status(500).json({error: error.message}));
            break;
    }
});

app.listen(port, () => {
    console.log(`auth service is listening on port ${port}!`);
});
