'use strict';

module.exports = function waitForNetworkIdle(
    page,
    timeout,
    maxInflightRequests = 0,
) {
    page.on('request', onRequestStarted);
    page.on('requestfinished', onRequestFinished);
    page.on('requestfailed', onRequestFinished);

    let inflight = 0;
    let fulfill;
    let promise = new Promise((x) => (fulfill = x));
    let timeoutId = setTimeout(onTimeoutDone, timeout);

    function onTimeoutDone() {
        page.removeListener('request', onRequestStarted);
        page.removeListener('requestfinished', onRequestFinished);
        page.removeListener('requestfailed', onRequestFinished);
        fulfill();
    }

    function onRequestStarted() {
        if (++inflight > maxInflightRequests) {
            clearTimeout(timeoutId);
        }
    }

    function onRequestFinished() {
        if (inflight === 0) {
            return;
        }

        if (--inflight === maxInflightRequests) {
            timeoutId = setTimeout(onTimeoutDone, timeout);
        }
    }

    return promise;
};
