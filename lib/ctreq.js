/**
 * flexible package for processing requests (e.g., web and api requests) with cache and throttle support
 */
var Promise = require('bluebird');
var fs = require('fs');
var md5 = require('md5');
var RateLimiter = require('limiter').RateLimiter;
var path = require('path');

/**
 * CTRequest initializor: checking and recording required parameters
 */
var CTRequest = function (config) {
  if (!(this instanceof CTRequest)) {
    return new CTRequest(config);
  }

  this._config(config);
}

/**
 * use promise to enforce rate limits
 */
CTRequest.prototype._rate = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.limiter.removeTokens(1, function(err, remainingRequests) {
      resolve();
    });
  });
}

/**
 * issue a request: if check_cache is selected, forgo the request when there is a hit in cache
 * if check_cache is not checked or if there is a miss, issue the request and cache the result
 */
CTRequest.prototype.issue = function (params, check_cache, no_cache_update) {
  var self = this;
  if (check_cache  && self.cache(params)) {
    return new Promise((resolve, reject) => resolve(self.cache(params)));
  }
  else {
    return new Promise(async function (resolve, reject) {
      if (self.limiter) await self._rate();
      self.config.handler
        .apply(null, params)
        .catch((err) => reject(err))
        .then(function (params, result) {
          if (!no_cache_update) {
            this._cache_put(params, result);
          }
          resolve(result);
        }.bind(self, params));
    });
  }
}

/**
 * bulk retrieve data for multiple requests specified by params_array
 */
CTRequest.prototype.bulkcache = function (params_array){
  return params_array.map(this.cache.bind(this));
}

/**
 * retrieve data for one request specified by params
 */
CTRequest.prototype.cache = function (params){
  if (this.config.ctype == 'file') {
    //get MD5 to file_name
    try {
      var cached_data = JSON.parse(fs.readFileSync(this._cache_file_name(params)).toString());
      var timestamp = Math.round(new Date() / 1000);
      if (
        (cached_data.cexpire > 0 && cached_data.timestamp + cached_data.cexpire < timestamp)
        || (this.config.cexpire > 0 && cached_data.timestamp + this.config.cexpire < timestamp)
      ) return false;
      else return cached_data.result;
    } catch (err) {
      return false;
    }
  }
  else {
    return false;
  }
}

/**
 * cache the result of a request
 */
CTRequest.prototype._cache_put = function (params, val){
  if (!this.config._cache) return;
  if (this.config.ctype == 'file') {
    try {
      fs.writeFileSync(this._cache_file_name(params), JSON.stringify({
        'scope'     : this.config.scope,
        'params'    : params,
        'timestamp' : Math.round(new Date() / 1000),
        'cexpire'   : this.config.cexpire,
        'result'    : val,
      }));
      return true;
    } catch (err) {
      return false;
    }
  }
  else return false;
}

/**
 * return cache file name based on request params
 */
CTRequest.prototype._cache_file_name = function (params){
  return path.join(this.config.cparams, md5(this.config.scope + JSON.stringify(params)) + '.json');
}

/**
 * Check the required params are present in `config`, and record `config`
 */
CTRequest.prototype._config = function (config) {
  // check required parameter `handler`, making sure it is not empty
  if (typeof config.handler !== 'function') {
    throw new TypeError('handler must be a function, got ' + typeof config.handler + ' instead.');
  }

  // check all supported cache types, set _cache to be true, and set expire to be -1 if unspecified
  if (config.ctype === 'file' || config.ctype === 'file') {
    config._cache = true;
    if (!config.cexpire) config.cexpire = -1;
  }
  else {
    config._cache = false;
  }

  // special default setting for file cache: directory set to be current
  if (config.ctype === 'file' && !config.cparams) {
    config.cparams = './';
  } else if (config.ctype === 'file' && config.cparams && !fs.existsSync(config.cparams)) {
    fs.mkdirSync(config.cparams);
  }

  if (config.ttype === 'RateLimiter' && typeof config.tparams !== 'undefined') {
    this.limiter = new RateLimiter(config.tparams[0], config.tparams[1]);
  }

  this.config = config;
}

// export
module.exports = CTRequest;
