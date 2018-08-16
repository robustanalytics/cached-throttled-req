# cached-throttled-req
This is a nodeJs package for request scheduling with caching and throttling support.  One motivating application is web/api requests, for which a programmer often needs to:
- throttle the frequency of requests to comply with requirements of the web/api service provider, and
- cache the results returned for the requests, either indefinitely or for a certain time interval, in order to reduce the number of requests sent over the web.
This package satisfies both requirements in an easy-to-use fashion.  It provides generic support to any request that can be packaged as a [promise](http://bluebirdjs.com/docs/why-promises.html), and allows optional configurations of cache (e.g., expiration time) and throttling (e.g., number of requests per second).  The initial version of this package stores cache as files and uses [limiter](https://github.com/jhurliman/node-rate-limiter) to support throttling.  We expect to add support for other caching (e.g., redis, memcached) and throttling (e.g., bottleneck) mechanisms in the future.

# Usage:
```js
var req = new CTRequest({
  handler:              foo(),            // required: promise to process the request
  scope:                '123-acd-!@#'     // optional: a unique string for cache scoping
  ctype:                'file',           // optional: cache service used, supported: 'file'
  cparams:              ...,              // optional: params used by the cache service
  cexpire:              3600,             // optional: number of seconds before cache expires (default to never expire)
  ttype:                'RateLimiter',    // optional: throttle service used, supported: 'RateLimiter'
  tparams:              [150, 'hour'],    // optional: params used by the throttle service
})

req.issue(                                // issue a request using promise
  [ param1, param2 ],                     // required: parameters to be passed on to the request
  check_cache,                            // optional: whether to forgo issuing when there is a matching cache  
)
.catch(function (err) {
  ...
})
.then(function (result) {
  ...
})

var result = req.cache(                   // retrieval of request results from cache
  [ param1, param2 ]                      // required: this array must match the array parameter of req.issue()
)

var result = req.bulkcache(               // bulk retrieval of request results from cache
  [
    [ param1, param2 ],
    [ param1, param2 ],
    ...
  ]
)
```

# Example for Using Twitter API:
```js
/**
 *  setup CTRequest for Twitter API
 */
var Twit = require('twit')

var T = new Twit({
  consumer_key:         '...',
  consumer_secret:      '...',
  access_token:         '...',
  access_token_secret:  '...',
  timeout_ms:           60*1000,
  strictSSL:            true,
})

var req = new CTRequest({
  handler:              T.get.bind(T, 'search/tweets'),   // function to process the request, must have promise support
  scope:                'twitter-search-api',             // unique id to avoid duplicate cache file names
  ctype:                'file',                           // cache service used, supported: 'file'
  cparams:              './cache/',                       // params used by the cache service
  ttype:                'RateLimiter',                    // throttle service used, supported: 'RateLimiter'
  tparams:              [150, 'hour'],                    // params used by the throttle service
})

//  issue a request
req.issue([{ q: 'nyc since:2013-08-01', count: 100 }], true)
.catch(function (err) {
  console.log('caught error', err.stack)
})
.then(function (result) {
  console.log('data', result.data);
});
```
