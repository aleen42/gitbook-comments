module.exports = {
    set(key, value, expiration = 0/* millisecond */) {
        const _expires = () => {
            const date = new Date();
            expiration && date.setTime(date.getTime() + expiration);

            return expiration ? [`expires=${date.toUTCString()}`] : [];
        };

        document.cookie = [
            `${key}=${value}`,
            ..._expires(),
            'path=/',
        ].join(';');
    },
    get(key) {
        return document.cookie.split('; ').reduce((cookie, value) => {
            const parts = value.split('=');
            return parts[0] === key ? decodeURIComponent(parts[1]) : cookie
        }, '');
    },
    remove(key) {
        document.cookie = [`${key}=`, 'expires=Thu, 01 Jan 1970 00:00:00 GMT', 'path=/'].join(';');
    },
};
