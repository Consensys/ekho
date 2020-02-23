var sodium = require('sodium-native');
/*
{
    "identifier": "719f2c99-2d84-48a5-9bd8-1f0de3408c06",
    "oneuseKey": "fd3bLdFBGyY/t70g+K8X/tFlxxioSN1u63gjEYAXAmQ=",
    "signingKey": "U3/nok8FwTW45x4RgQ5JIj13lYLQZuOyc7Hcr9KsaO0=",
    "signature": "3A17Osp/npeSk5J3/toA0l4/pj0rM4sbxi1DE80MpGbTjtecxwzD9rhnDinGe1E3KJfbwsdum2T8VT8OaI5+Aw=="
  }

  {
  "identifier": "b68900ed-53eb-4c6b-8e96-7d422a7b579d",
  "oneuseKey": "vwIAiS9ozWYB/nFZUNja1ZZyO0zAOPskCbdOrLkhnzg=",
  "signingKey": "U3/nok8FwTW45x4RgQ5JIj13lYLQZuOyc7Hcr9KsaO0=",
  "signature": "K5RgzH60eb7yxI7a5+2D0PwAnIm/JMvdFM7p+xGE8ImwuMQbMQciqIekuqgrDdAHbw63lxUV1wfBCkgHxigkBQ=="
}

  */

// test code

var userPrivSigningKey = 'UL5YHimeWChKUSl/+uK42EzHDa855WDJhbwxzw5aoNRTf+eiTwXBNbjnHhGBDkkiPXeVgtBm47Jzsdyv0qxo7Q==';
var userPubSigningKey = 'U3/nok8FwTW45x4RgQ5JIj13lYLQZuOyc7Hcr9KsaO0=';

var oneUseKey = 'vwIAiS9ozWYB/nFZUNja1ZZyO0zAOPskCbdOrLkhnzg=';
var userOneTimeKeySignature = sodium.sodium_malloc(sodium.crypto_sign_BYTES);
var signature = 'K5RgzH60eb7yxI7a5+2D0PwAnIm/JMvdFM7p+xGE8ImwuMQbMQciqIekuqgrDdAHbw63lxUV1wfBCkgHxigkBQ==';

console.log('signature length: ', Buffer.from(signature, 'base64').length);
console.log('buffer length: ', sodium.crypto_sign_BYTES);

sodium.crypto_sign_detached(
  userOneTimeKeySignature,
  Buffer.from(oneUseKey, 'base64'),
  Buffer.from(userPrivSigningKey, 'base64'),
);

console.log('signature should be: ', userOneTimeKeySignature.toString('base64'));
console.log('signature actually is: ', signature.toString('base64'));

var bool = sodium.crypto_sign_verify_detached(
  Buffer.from(signature, 'base64'),
  Buffer.from(oneUseKey, 'base64'),
  Buffer.from(userPubSigningKey, 'base64'),
);
console.log('Contact One Use Key Validated (true/false): ', bool);
