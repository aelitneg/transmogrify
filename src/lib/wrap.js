'use strict';

/*
 * Much of this wrap code was borrowed from awaitjs-express, but with some modifications to allow wrapping sync
 * functions.
 * https://github.com/vkarpov15/awaitjs-express/blob/master/index.js
 */
function _once(fn) {
    let called = false;
    return function () {
        if (called) {
            return;
        }
        called = true;
        fn.apply(null, arguments);
    };
}

module.exports = function wrap(fn) {
    if (!fn) {
        throw new Error(
            'Middleware function is undefined!  This means you probably renamed a controller method, or added ' +
                'the controller method to an express route before saving the controller.',
        );
    }

    if (fn.length === 4) {
        return function wrappedErrorHandler(error, req, res, next) {
            next = _once(next);
            const results = fn(error, req, res, next);
            if (results && results.then && results.catch) {
                results.then(next).catch(next);
            }
        };
    }

    return function wrappedMiddleware(req, res, next) {
        next = _once(next);
        const results = fn(req, res, next);
        if (results && results.then && results.catch) {
            results
                .then(() => (res.headersSent ? null : next()))
                .catch((err) => (res.headersSent ? null : next(err)));
        }
    };
};
