(function (document, window) {
    'use strict';

    // Keep local previews, browser privacy signals, and non-production hosts out
    // of analytics entirely.
    var productionHosts = ['arv.in', 'www.arv.in'];
    var doNotTrack = navigator.doNotTrack === '1' ||
        navigator.doNotTrack === 'yes' ||
        window.doNotTrack === '1' ||
        navigator.msDoNotTrack === '1';
    var globalPrivacyControl = navigator.globalPrivacyControl === true;

    if (productionHosts.indexOf(window.location.hostname) === -1 || doNotTrack || globalPrivacyControl) {
        return;
    }

    // PostHog's recommended HTML loader. Commands are queued until the SDK is
    // available, so the page never blocks on analytics.
    var posthog = window.posthog || [];
    var methodNames;
    var methodIndex;
    var script;
    var firstScript;

    if (!posthog.__SV) {
        window.posthog = posthog;
        posthog._i = [];
        posthog.init = function (token, config, name) {
            function addMethod(target, methodName) {
                var parts = methodName.split('.');
                if (parts.length === 2) {
                    target = target[parts[0]];
                    methodName = parts[1];
                }
                target[methodName] = function () {
                    target.push([methodName].concat(Array.prototype.slice.call(arguments, 0)));
                };
            }

            script = document.createElement('script');
            script.type = 'text/javascript';
            script.crossOrigin = 'anonymous';
            script.async = true;
            script.src = config.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
            firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(script, firstScript);

            var instance = posthog;
            if (name !== undefined) {
                instance = posthog[name] = [];
            } else {
                name = 'posthog';
            }

            instance.people = instance.people || [];
            instance.toString = function (asPeople) {
                var value = 'posthog';
                if (name !== 'posthog') {
                    value += '.' + name;
                }
                if (!asPeople) {
                    value += ' (stub)';
                }
                return value;
            };
            instance.people.toString = function () {
                return instance.toString(true) + '.people (stub)';
            };

            methodNames = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' ');
            for (methodIndex = 0; methodIndex < methodNames.length; methodIndex++) {
                addMethod(instance, methodNames[methodIndex]);
            }

            posthog._i.push([token, config, name]);
        };
        posthog.__SV = 1;
    }

    function urlWithoutQueryOrHash(value) {
        if (!value) {
            return value;
        }

        try {
            var url = new URL(value, window.location.origin);
            return url.origin + url.pathname;
        } catch (error) {
            return undefined;
        }
    }

    function referrerOrigin(value) {
        if (!value) {
            return value;
        }

        try {
            return new URL(value).origin;
        } catch (error) {
            return undefined;
        }
    }

    posthog.init('phc_Ayd3TeFFLGpisoCBhCFqBqnB93g2bUhMgkEANqfef689', {
        api_host: 'https://us.i.posthog.com',
        ui_host: 'https://us.posthog.com',
        defaults: '2026-05-30',
        cookieless_mode: 'always',
        person_profiles: 'identified_only',
        autocapture: false,
        capture_pageview: true,
        capture_pageleave: true,
        capture_dead_clicks: false,
        capture_exceptions: false,
        capture_performance: false,
        disable_session_recording: true,
        disable_surveys: true,
        enable_heatmaps: false,
        advanced_disable_feature_flags: true,
        before_send: function (event) {
            if (!event || !event.properties) {
                return event;
            }

            event.properties.$current_url = urlWithoutQueryOrHash(event.properties.$current_url);
            event.properties.$referrer = referrerOrigin(event.properties.$referrer);
            event.properties.$initial_current_url = urlWithoutQueryOrHash(event.properties.$initial_current_url);
            event.properties.$initial_referrer = referrerOrigin(event.properties.$initial_referrer);
            return event;
        }
    });

    // Autocapture stays off. Only intentional exits and downloads are recorded,
    // without link text, query strings, fragments, or other page content.
    document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || !target.closest) {
            return;
        }

        var link = target.closest('a[href]');
        if (!link) {
            return;
        }

        var destination;
        try {
            destination = new URL(link.href, window.location.href);
        } catch (error) {
            return;
        }

        var isDownload = link.hasAttribute('download') || /\.(pdf|zip|docx?|xlsx?|pptx?)$/i.test(destination.pathname);
        var isExternal = destination.origin !== window.location.origin;
        var isNewContext = link.target === '_blank';

        if (!isDownload && !isExternal && !isNewContext) {
            return;
        }

        posthog.capture(isDownload ? 'file downloaded' : 'outbound link clicked', {
            destination_host: destination.host || undefined,
            destination_path: destination.protocol === 'http:' || destination.protocol === 'https:' ? destination.pathname : undefined,
            destination_protocol: destination.protocol.replace(':', ''),
            link_type: isDownload ? 'download' : (isExternal ? 'external' : 'project')
        });
    });
})(document, window);
