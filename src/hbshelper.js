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

Handlebars.registerHelper('stringify', JSON.stringify);

/**
 * {{#compare}}...{{/compare}}
 *
 * @credit: OOCSS
 * @param left value
 * @param operator The operator, must be between quotes ">", "=", "<=", etc...
 * @param right value
 *
 * @example:
 *   {{#compare unicorns "<" ponies}}
 *     I knew it, unicorns are just low-quality ponies!
 *   {{/compare}}
 *
 *   {{#compare value ">=" 10}}
 *     The value is greater or equal than 10
 *     {{else}}
 *     The value is lower than 10
 *   {{/compare}}
 */
Handlebars.registerHelper('compare', function () {
    const argList = arguments, /* options */ {fn, inverse} = argList[argList.length - 1];
    const values = [].slice.call(argList, 0, -1);
    const result = function (left, operator, right) {
        if (arguments.length < 3) {
            /** compare x y */
            right = operator;
            operator = '===';
        }

        const fn = ({
            '==': (l, r) => l == r,
            '===': (l, r) => l === r,
            '!=': (l, r) => l != r,
            '!==': (l, r) => l !== r,
            '<': (l, r) => l < r,
            '>': (l, r) => l > r,
            '<=': (l, r) => l <= r,
            '>=': (l, r) => l >= r,
            'typeof': (l, r) => typeof l === r,
        })[operator];

        if (fn) {
            return fn(left, right);
        } else {
            throw new Error(`Handlebars Helper "compare" doesn't know the operator ${operator}`);
        }
    }.apply(null, values);
    return fn ? (result ? fn(this) : inverse(this)) : result;
});
