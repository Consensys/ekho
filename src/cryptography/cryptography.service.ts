import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptographyService {
    public sandbox() {
        var sodium = require('sodium-native')

        var nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES);
        var key = sodium.sodium_malloc(sodium.crypto_secretbox_KEYBYTES);
        var message = Buffer.from('Hello, world');
        var cipherText = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES);

        sodium.randombytes_buf(nonce);
        sodium.randombytes_buf(key);

        sodium.crypto_secretbox_easy(cipherText, message, nonce, key);

        console.log('Encrypted message: ', cipherText);

        var plainText = Buffer.alloc(cipherText.length - sodium.crypto_secretbox_MACBYTES);

        if (!sodium.crypto_secretbox_open_easy(plainText, cipherText, nonce, key)) {
            console.log('Decryption failed!');
        } else {
            console.log('Decrypted message: ', plainText, '(' + plainText.toString() + ')');
        }

        //---------------------------------------------------------------------//
        //Signing Key (Alice) Creation
        var alicePublicSigningKey = sodium.sodium_malloc(sodium.crypto_sign_PUBLICKEYBYTES);
        var aliceSecretSigningKey = sodium.sodium_malloc(sodium.crypto_sign_SECRETKEYBYTES);

        sodium.crypto_sign_keypair(alicePublicSigningKey, aliceSecretSigningKey);

        console.log('Alice Public Signing Key: ', alicePublicSigningKey.toString('base64'));
        console.log('Alice Secret Signing Key: ', aliceSecretSigningKey.toString('base64'));

        //---------------------------------------------------------------------//
        //Signing Key (Bob) Creation
        var bobPublicSigningKey = sodium.sodium_malloc(sodium.crypto_sign_PUBLICKEYBYTES);
        var bobSecretSigningKey = sodium.sodium_malloc(sodium.crypto_sign_SECRETKEYBYTES);

        sodium.crypto_sign_keypair(bobPublicSigningKey, bobSecretSigningKey);

        console.log('Bob Public Signing Key: ', bobPublicSigningKey.toString('base64'));
        console.log('Bob Secret Signing Key: ', bobSecretSigningKey.toString('base64'));

        //---------------------------------------------------------------------//
        //Sign a Message - creates just the signature (use crypto_sign if you also need the message)
        var messageToSign = Buffer.from('Hello world 12345678');
        var signature = sodium.sodium_malloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(signature, messageToSign, aliceSecretSigningKey);

        console.log('Message to sign: ', messageToSign.toString());
        console.log('Signature: ', signature.toString('base64') + 'length(' + signature.toString('base64').length + ')');

        //---------------------------------------------------------------------//
        //Verify the signed message (TRUE)
        var bool = sodium.crypto_sign_verify_detached(signature, messageToSign, alicePublicSigningKey);

        console.log('Message signed by Alice (Y/N): should be TRUE ', bool.toString());

        //---------------------------------------------------------------------//
        //Verify with the wrong public key (FALSE)
        var bool = sodium.crypto_sign_verify_detached(signature, messageToSign, bobPublicSigningKey);

        console.log('Message signed by Alice (Y/N): should be FALSE', bool.toString());

        //---------------------------------------------------------------------//
        //Hashing
        var outputHash = sodium.sodium_malloc(sodium.crypto_generichash_BYTES)

        sodium.crypto_generichash(outputHash, messageToSign)

        console.log('Hashed message: ', outputHash.toString('base64'));

        //---------------------------------------------------------------------//
        //ECDH - Create a one-use key for Alice

        var alicePublicOneUseKey = sodium.sodium_malloc(sodium.crypto_scalarmult_BYTES);
        var aliceSecretOneUseKey = sodium.sodium_malloc(sodium.crypto_scalarmult_SCALARBYTES);

        sodium.crypto_scalarmult_base(alicePublicOneUseKey, aliceSecretOneUseKey);

        console.log('Alice One Use Public Key: ', alicePublicOneUseKey.toString('base64'));
        console.log('Alice One Use Secret Key: ', aliceSecretOneUseKey.toString('base64'));

        //---------------------------------------------------------------------//
        //ECDH - Create a one-use key for Bob
        var bobPublicOneUseKey = sodium.sodium_malloc(sodium.crypto_scalarmult_BYTES);
        var bobSecretOneUseKey = sodium.sodium_malloc(sodium.crypto_scalarmult_SCALARBYTES);

        sodium.crypto_scalarmult_base(bobPublicOneUseKey, bobSecretOneUseKey);

        console.log('Bob One Use Public Key: ', bobPublicOneUseKey.toString('base64'));
        console.log('Bob One Use Secret Key: ', bobSecretOneUseKey.toString('base64'));

        //---------------------------------------------------------------------//
        //do ECDH for Alice, using Bob's public key
        var aliceSharedSecret = sodium.sodium_malloc(sodium.crypto_scalarmult_BYTES);

        sodium.crypto_scalarmult(aliceSharedSecret, aliceSecretOneUseKey, bobPublicOneUseKey);

        console.log('Shared Secret (Alice): ', aliceSharedSecret.toString('base64'));

        //---------------------------------------------------------------------//
        //do ECDH for Bob, using Alice's public key
        var bobSharedSecret = sodium.sodium_malloc(sodium.crypto_scalarmult_BYTES);

        sodium.crypto_scalarmult(bobSharedSecret, bobSecretOneUseKey, alicePublicOneUseKey);

        console.log('Shared Secret (Bob): ', bobSharedSecret.toString('base64'));

        //---------------------------------------------------------------------//
        //Let's get some of these buffer sizes exposed

        console.log('type of kdf keybytes: ', typeof sodium.crypto_kdf_KEYBYTES); //32 bytes
        console.log('ECDH Shared Secret Size: ', sodium.crypto_scalarmult_BYTES);
        console.log('KDF key size: ', sodium.crypto_kdf_KEYBYTES);
        console.log('Hash output size: ', outputHash.toString().length);
        console.log('Encryption key size: ', sodium.crypto_stream_KEYBYTES);

        //---------------------------------------------------------------------//
        // Encrypt and sign (Alice)
        // Let's encrypt a SHA256 hash with a Shared Secret and generate a signature
        // This will be message nonce 0 from Alice, where the key has been generated from the 32 byte Shared Secret

        var originalMessage = 'Hello world, this is Alice';

        // First we hash the message
        var sha256MessageHash = sodium.sodium_malloc(sodium.crypto_hash_sha256_BYTES);

        sodium.crypto_hash_sha256(sha256MessageHash, Buffer.from(originalMessage));

        console.log('Original Message: ', originalMessage);
        console.log('Original Message SHA256 Hash: ', sha256MessageHash.toString('base64'));
        console.log('Original messahe SHA256 Hash length: ', sha256MessageHash.length);

        // Then we encrypt the message
        var messageNonce = sodium.sodium_malloc(sodium.crypto_stream_NONCEBYTES);
        var messageKey = aliceSharedSecret;
        var encryptedMessage = sodium.sodium_malloc(sha256MessageHash.length);

        sodium.crypto_stream_chacha20_xor(encryptedMessage, Buffer.from(sha256MessageHash), messageNonce, messageKey);

        console.log('Encrypted message: ', encryptedMessage.toString('base64'));

        // Then we decrypt the message
        var decryptedMessage = sodium.sodium_malloc(encryptedMessage.length);

        sodium.crypto_stream_chacha20_xor(decryptedMessage, encryptedMessage, messageNonce, messageKey);

        console.log('Decrypted message: ', decryptedMessage.toString('base64'));

        // Sign the encrypted message
        var messageSignature = sodium.sodium_malloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(messageSignature, encryptedMessage, aliceSecretSigningKey);

        console.log('Message to sign: ', encryptedMessage.toString('base64'));
        console.log('Signature: ', messageSignature.toString('base64') + ' length(' + messageSignature.length + ')');

        //Verify the signed message (TRUE)
        var bool = sodium.crypto_sign_verify_detached(messageSignature, encryptedMessage, alicePublicSigningKey);

        console.log('Message signed by Alice (Y/N): should be TRUE ', bool.toString());
    }
}
