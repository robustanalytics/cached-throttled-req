# cached-throttled-req
flexible package for processing requests (e.g., web and api requests) with cache and throttle support

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
