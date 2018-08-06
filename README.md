# cached-throttled-req
flexible package for processing requests (e.g., web and api requests) with cache and throttle support

# Usage:
```js
var req = new CTRequest({
  handler:              foo(),            // function to process the request
  ctype:                'file',           // cache service used, supported: 'file'
  cparams:              ...,              // params used by the cache service
  ttype:                'RateLimiter',    // throttle service used, supported: 'RateLimiter'
  tparams:              [150, 'hour'],    // params used by the throttle service
})

req.issue(                                // issue a request using promise
  [ param1, param2 ],                     // parameters to be passed on to the request
.catch(function (err) {
  ...
})
.then(function (result) {
  ...
})

var result = req.cache(                   // retrieval of request results from cache
  [ param1, param2 ]
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
//
//  setup CTRequest for Twitter API
//
var Twit = require('twit')

var T = new Twit({
  consumer_key:         '...',
  consumer_secret:      '...',
  access_token:         '...',
  access_token_secret:  '...',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})

var req = new CTRequest({
  handler:              T.get.bind(null, 'search/tweets') // function to process the request, must have promise support
  ctype:                'file',                           // cache service used, supported: 'file'
  cparams:              './cache',                        // params used by the cache service
  ttype:                'RateLimiter',                    // throttle service used, supported: 'RateLimiter'
  tparams:              [150, 'hour'],                    // params used by the throttle service
})

//
//  issue a request
//
req.issue([{ q: 'nyc since:2013-08-01', count: 100 }])
.catch(function (err) {
  console.log('caught error', err.stack)
})
.then(function (result) {
  console.log('data', result.data);
})
```
