var assert = require('assert');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
var expect = chai.expect;
var Twit = require('twit');

var CTRequest = require('../lib/ctreq');

var backbone_handler = function (param) {
  return new Promise(function (resolve, reject) {
    resolve({'output':param});
  });
}

describe('#ctreq with skeleton framework', function() {
  var req = new CTRequest({
    'handler' : backbone_handler,
  });

  it('respond with matching records', function() {
    return req.issue(['tms_01']).should.eventually.deep.equal({'output':'tms_01'});
  });
});

describe('#ctreq with file cache', function() {
  var req = new CTRequest({
    'handler' : backbone_handler,
    'ctype'   : 'file',
    'cparams' : './cache/',
  });

  it('respond with matching records', async function() {
    await req.issue(['tms_02']);
    return req.cache(['tms_02']).should.deep.equal({'output':'tms_02'});
  });
});

describe('#ctreq with rate limit', function() {
  var req = new CTRequest({
    'handler' : backbone_handler,
    'ttype'   : 'RateLimiter',
    'tparams' : [1, 3000],
  });

  it('respond with matching records', async function() {
    return req.issue(['tms_03']).should.eventually.deep.equal({'output':'tms_03'})
      && req.issue(['tms_04']).should.eventually.deep.equal({'output':'tms_04'});
  }).timeout(5000);
});

describe('#ctreq with Twitter API', function() {
  expect(process.env.TWITTER_API_KEY).to.be.a('string');
  expect(process.env.TWITTER_API_SECRET).to.be.a('string');
  expect(process.env.TWITTER_API_TOKEN).to.be.a('string');
  expect(process.env.TWITTER_API_TOKEN_SECRET).to.be.a('string');

  var T = new Twit({
    consumer_key:			    process.env.TWITTER_API_KEY,
  	consumer_secret:		  process.env.TWITTER_API_SECRET,
  	access_token:		      process.env.TWITTER_API_TOKEN,
  	access_token_secret:	process.env.TWITTER_API_TOKEN_SECRET,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,     // optional - requires SSL certificates to be valid.
  })

  var req = new CTRequest({
    'handler' : T.get.bind(T, 'search/tweets'),
    'scope'   : 'twitter search api',
    'ctype'   : 'file',
    'cparams' : './cache/',
    'ttype'   : 'RateLimiter',
    'tparams' : [1, 3000],
  });

  it('respond with matching records', async function() {
    return req.issue([{ q: 'banana since:2011-07-11', count: 100 }], true).should.eventually.have.property('data');
  });

  it('respond with matching bulk records', async function() {
    await req.issue([{ q: 'apple since:2011-07-11', count: 100 }], true);
    await req.issue([{ q: 'banana since:2011-07-11', count: 100 }], true);
    return req.bulkcache([
      [{ q: 'apple since:2011-07-11', count: 100 }],
      [{ q: 'banana since:2011-07-11', count: 100 }],
    ]).should.have.length(2);
  });
});
