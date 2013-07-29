var ws = null;
var wsUrl = 'ws://sbback1-simonmweber.rhcloud.com:8000/ws';

var retries = 0;
var maxRetries = 6;
var retryBackoffFactor = 1.5;
var retryDelayMillis = 2 * 1000;

kindToClass = {
    lostWsConnection: 'notice',
    gotWsConnection: 'notice',
    retryWsConnection: 'notice',
    noWs: 'notice',
    weDisconnected: 'notice',
    strangerDisconnected: 'notice',
    connected: 'notice',
    info: 'notice',
    weMessage: 'bot-message',
    gotMessage: 'stranger-message'
};

function appendLog(msgEvent) {
    var curConvEl = $('#log');
    var doScroll = false;
    var d = curConvEl[0];
    if (typeof d !== 'undefined') {
        doScroll = Math.abs(d.scrollTop - (d.scrollHeight - d.clientHeight)) < 10;
    }

    var el = $('<div/>');

    if (msgEvent.Kind == 'weDisconnected') {
        msgEvent.Value = '<we disconnected>';
    } else if (msgEvent.Kind == 'strangerDisconnected') {
        msgEvent.Value = '<stranger disconnected>';
    } else if (msgEvent.Kind == 'connected') {
        msgEvent.Value = '<stranger connected>';

    } else if (msgEvent.Kind == 'weMessage') {
        msgEvent.Value = 'bot: ' + msgEvent.Value;
    } else if (msgEvent.Kind == 'gotMessage') {
        msgEvent.Value = 'stranger: ' + msgEvent.Value;
    }

    el.addClass(kindToClass[msgEvent.Kind]);
    el.text(msgEvent.Value);

    el.appendTo(curConvEl);

    if (doScroll) {
        d.scrollTop = d.scrollHeight - d.clientHeight;
    }
}

function clearLog(){
    var curConvEl = $('#log');

    curConvEl.empty();
}

function makeWsConnection(url){
    var ws = new WebSocket(url);

    ws.onopen = function(evt) {
        appendLog({Kind: 'gotWsConnection', Value: '<connected to server>'});
    };
    ws.onclose = function(evt) {
        appendLog({Kind: 'lostWsConnection', Value: '<connection to server lost>'});

        if (retries < maxRetries){
            appendLog({Kind: 'retryWsConnection', Value: '<retrying connection in ' + (retryDelayMillis / 1000 ) + ' seconds>'});
            setTimeout(function(){
                makeWsConnection(url);
            }, retryDelayMillis);

            retries++;
            retryDelayMillis *= retryBackoffFactor;
        } else {
            appendLog({Kind: 'lostWsConnection', Value: '<could not connect to server>'});
        }
    };
    ws.onmessage = function(evt) {
        var msgEvent = JSON.parse(evt.data);
        appendLog(msgEvent);
    };

    return ws;
}

function main(){
    if (!("WebSocket" in window)) {
        appendLog({Kind: 'noWs', Value: '<your browser does not support websockets>'});
        return;
    }

    if(window.location.hash) {
        var hash = window.location.hash.substring(1);
        if (hash == 'localdev'){
            wsUrl = 'ws://localhost:8000/ws';
        }
    }

    makeWsConnection(wsUrl);
}

$(document).ready(function(){
    main();
});
