const Handlebars = require('handlebars');
const moment = require('moment');
const marked = require('marked');

Handlebars.registerHelper('moment', (date, type = 'date') => {
    switch (type) {
        case 'fromNow':
            return moment(date).fromNow();
        case 'date':
        default:
            return moment(date).toDate();
    }
});

Handlebars.registerHelper('markedown', content => marked(content));
