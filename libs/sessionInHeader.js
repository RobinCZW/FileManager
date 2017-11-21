"use strict";

var assert = require('assert');
var signature = require('cookie-signature');

function HandleSessionId( opts ){
  var cookieName = opts.name || 'connect.sid';
  var cookieSecret = opts.secret;

  assert( cookieSecret, 'HandleSessionId( opts ) => ');

  return function handleSessionId( req, res, next ){
    var sessionId = req.query.sessionId, parts;
    var cookieStr = req.headers.cookie;

    if (sessionId) {
      sessionId = new Buffer(sessionId, 'base64').toString();

      var sessionIdPart  =  cookieName + '=' + encodeURIComponent( 's:' + sessionId );

      if( cookieStr ){

        // Overwrite session id
        parts = cookieStr.split('; ');
        var sidStr = parts.filter( function(v){ return v.indexOf(cookieName) !== -1; })[0];
        if( sidStr ){
          parts[ parts.indexOf( sidStr ) ] = sessionIdPart;
        } else {
          parts.push( sessionIdPart );
        }
      } else {
        parts = [ sessionIdPart ];
      }

      req.headers.cookie = parts.join('; ');
    }
    req.getClientSessionId = function () {
      var signedCookie = signature.sign( this.sessionID,  cookieSecret );
      return new Buffer(signedCookie).toString('base64');
    };
    next();
  };
}
module.exports = HandleSessionId;