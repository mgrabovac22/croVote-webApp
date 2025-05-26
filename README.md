# cro-vote-webapp

## Secure Online Voting System project specifications

Develop a secure online voting system that ensures confidentiality, integrity, and availability of votes while protecting against hacking, fraud, and manipulation.
A practical component for developing a secure online voting system can be achieved by creating a prototype system that implements various security measures to ensure the
confidentiality, integrity, and availability of votes. Here are the specific details on how this can be achieved:

- **Authentication and Authorization:** The system should ensure that only authorized users can access the voting system. For this, the system can use various authentication mechanisms such as username and password, two-factor authentication, or biometric authentication. To implement these authentication mechanisms, freely available tools such as OpenID Connect, OAuth 2.0, and JSON Web Tokens (JWT) can be used.

- **Encryption:** To ensure the confidentiality of votes, the system should encrypt the votes before storing them in the database. For this, the system can use various encryption techniques such as Advanced Encryption Standard (AES) and Secure Hash Algorithm (SHA). Freely available tools such as OpenSSL can be used to implement these encryption techniques.

- **Verification:** To ensure the integrity of votes, the system should verify that the votes have not been tampered with during transmission or storage. For this, the system can use various verification techniques such as digital signatures and hash functions. Freely available tools such as GnuPG and HashCalc can be used to implement these verification techniques.

- **Audit Trail:** The system should maintain an audit trail of all voting activity to ensure transparency and accountability. For this, the system can log all voting activity, including voter ID, time-stamp, and vote details. Freely available tools such as Log4j and ELK Stack can be used to implement the audit trail.

- **Security Testing:** Finally, the system should be tested for security vulnerabilities using various security testing techniques such as penetration testing, vulnerability scanning, and code review. Freely available tools such as OWASP ZAP, Nessus, and SonarQube can be used to perform these security tests.

By combining these tools and techniques, a practical component for developing a secure online voting system can be achieved. The prototype system can be tested in a virtual environment using tools such as VirtualBox or VMware. The system can also be deployed on a cloud platform such as AWS or Google Cloud Platform to test its scalability and reliability

## Functional requirements

Label | Name | Short description | Responsible team member
------ | ----- | ----------- | -------------------
F01    | Authentication and Authorization| User will be able to register after which he will be able to login using previously decided credentials. This requirement also includes logout. |
F02    | Encription | System will use algorithms like SHA and AES to encrypt private data like votes  |
F03    | Verfication | System will verify if the votes have been tampered with during transmission or storage. System will use techniques like use of digital signatures and hash function to enable this functional requirement. | 
F04    | Audit trail | System will maintain an audit trail of all voting activity to make it transparent. System will be able to log all voting details and it's activity. |
F05    | Security Testing | System will be using different security testing techniques like penetration testing, vulnerability scanning and code review to ensure system doesn't kave security vulnerabilities. | 

