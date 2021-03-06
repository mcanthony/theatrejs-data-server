var ConnectionToClient,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

module.exports = ConnectionToClient = (function() {
  function ConnectionToClient(session, socket) {
    var $emit;
    this.session = session;
    this.socket = socket;
    this._receiveClientRequest = bind(this._receiveClientRequest, this);
    this._handleDisconnect = bind(this._handleDisconnect, this);
    this.id = this.session.id;
    this._requestListeners = {};
    console.log("connection: " + this.id);
    $emit = this.socket.$emit;
    this.socket.$emit = (function(_this) {
      return function(msg, data, cb) {
        if (msg.substr(0, 15) === 'client-requests') {
          _this._receiveClientRequest(msg, data, cb);
          return;
        }
        return $emit.apply(_this.socket, arguments);
      };
    })(this);
    this.socket.on('disconnect', this._handleDisconnect);
  }

  ConnectionToClient.prototype._handleDisconnect = function() {
    console.log("disconnected: " + this.id);
    return this.session._disconnect();
  };

  ConnectionToClient.prototype._croodsAreRight = function(data) {
    var croods;
    if (typeof data !== 'object') {
      console.log('received data is not an object');
      return false;
    }
    croods = data.croods;
    if (croods == null) {
      console.log('received data doesn\'t have croods');
      return false;
    }
    if (!this.session._validatePassphrase(croods.passphrase)) {
      console.log("invalid passphrase: '" + croods.passphrase + "'");
      return false;
    }
    if (!this.session._validateNamespace(croods.namespace)) {
      console.log("invalid namespace: '" + croods.namespace + "'");
      return false;
    }
    return true;
  };

  ConnectionToClient.prototype._receiveClientRequest = function(msg, data, cb) {
    var listener, what;
    what = msg.substr(16, msg.length);
    console.log('got requested for', what);
    if (!this._croodsAreRight(data)) {
      cb('error:bad-croods');
      return;
    }
    listener = this._requestListeners[what];
    if (listener == null) {
      throw Error("No ask listener was found for '" + what + "'");
    }
    return listener(data.data, data.croods.namespace, cb, what);
  };

  ConnectionToClient.prototype.whenRequestedFor = function(what, cb) {
    if (this._requestListeners[what] != null) {
      throw Error("msg '" + what + "' already has a listener attached");
    }
    this._requestListeners[what] = cb;
    return this;
  };

  return ConnectionToClient;

})();
