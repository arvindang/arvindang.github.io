// biome-ignore lint/complexity/useArrowFunction: Preserve ES5 syntax in this shared, unbundled privacy gate.
(function (document, window) {
    'use strict';

    // Public Web Analytics token for arv.in, not a Cloudflare API credential.
    // Leave empty until the site has been registered in Cloudflare.
    var siteToken = '';
    var productionHosts = ['arv.in', 'www.arv.in'];
    var navigator = window.navigator;
    var doNotTrack = navigator.doNotTrack === '1' ||
        navigator.doNotTrack === 'yes' ||
        window.doNotTrack === '1' ||
        navigator.msDoNotTrack === '1';
    var globalPrivacyControl = navigator.globalPrivacyControl === true;

    // Check privacy signals before making any analytics request. File previews
    // and other hosts stay unmeasured, even when they contain this loader.
    if (!siteToken || productionHosts.indexOf(window.location.hostname) === -1 || doNotTrack || globalPrivacyControl) {
        return;
    }

    if (document.querySelector('script[data-cf-beacon]')) {
        return;
    }

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    // These are document-based sites. Scroll, hash, and history changes should
    // not be counted as additional page views.
    script.setAttribute('data-cf-beacon', JSON.stringify({ token: siteToken, spa: false }));
    document.head.appendChild(script);
})(document, window);
