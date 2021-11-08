[[Cryptography]]
[[Encryption]]


> Homomorphic encryption is a form of encryption that permits users to perform computations on its encrypted data without first decrypting it. These resulting computations are left in an encrypted form which, when decrypted, result in an identical output to that produced had the operations been performed on the unencrypted data. Homomorphic encryption can be used for privacy-preserving outsourced storage and computation. This allows data to be encrypted and out-sourced to commercial cloud environments for processing, all while encrypted. 


---

# Homomorphic Encryption
https://www.microsoft.com/en-us/research/project/homomorphic-encryption/


> Homomorphic Encryption (HE) refers to a special type of encryption technique that allows for computations to be done on encrypted data, without requiring access to a secret (decryption) key. The results of the computations are encrypted, and can be revealed only by the owner of the secret key.

## Motivation
> While traditional encryption schemes can be used to privately outsource data storage to the cloud, the data cannot be used for computations without first decrypting it. This results in a huge loss of utility. For example, a secure cloud service may require a user to download their encrypted data, decrypt it locally, and perform necessary computations, instead of simply returning an encrypted result to the user.

> Homomorphic encryption solves this problem, as it allows the cloud service to perform the computations while protecting the customer’s data with a state-of-the-art cryptographic security guarantee. The cloud only ever sees encrypted data, and only the customer can reveal the result of the computation.