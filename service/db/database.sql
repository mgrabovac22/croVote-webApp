SET foreign_key_checks = 0;

DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `post`;
DROP TABLE IF EXISTS `user_post`;
DROP TABLE IF EXISTS `choices`;
DROP TABLE IF EXISTS `user_type`;

CREATE TABLE `cro_voting`.`post`(
  `id` INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(1024) NOT NULL,
  `description` VARCHAR(2000) NOT NULL,
  `isActive` INTEGER,
  `isDeleted` DATETIME
);
CREATE TABLE `cro_voting`.`user_type`(
  `id` INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(45) NOT NULL
);
CREATE TABLE `cro_voting`.`choices`(
  `id` INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(1024) NOT NULL,
  `post_id` INTEGER NOT NULL,
  CONSTRAINT `fk_choices_post1`
    FOREIGN KEY(`post_id`)
    REFERENCES `post`(`id`)
);
CREATE TABLE `cro_voting`.`user`(
  `oib` VARCHAR(11) PRIMARY KEY NOT NULL,
  `id_user_type` INTEGER NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `surname` VARCHAR(45) NOT NULL,
  `address` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(13) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `TOTP_enabled` INTEGER NOT NULL,
  `TOTP_secret_key` VARCHAR(256) NOT NULL,
  `password` VARCHAR(256) NOT NULL,
  CONSTRAINT `fk_user_type`
    FOREIGN KEY(`id_user_type`)
    REFERENCES `user_type`(`id`)
);
CREATE TABLE `cro_voting`.`user_post`(
  `user_oib` VARCHAR(11) NOT NULL,
  `post_id` INTEGER NOT NULL,
  `voted_time` DATETIME,
  `choices_id` INTEGER,
  PRIMARY KEY(`post_id`,`user_oib`),
  CONSTRAINT `fk_user_post_user1`
    FOREIGN KEY(`user_oib`)
    REFERENCES `user`(`oib`),
  CONSTRAINT `fk_user_post_post1`
    FOREIGN KEY(`post_id`)
    REFERENCES `post`(`id`),
  CONSTRAINT `fk_user_post_choices1`
    FOREIGN KEY(`choices_id`)
    REFERENCES `choices`(`id`)
);

LOCK TABLES `user` WRITE, `post` WRITE, `user_type` WRITE, `user_post` WRITE, `choices` WRITE;

INSERT INTO user_type (id, name) VALUES (1, 'Admin'),(2, 'Voter');
INSERT INTO user (oib, id_user_type, name, surname, address, phone, email, TOTP_enabled, TOTP_secret_key, password)
VALUES ('12345678903', 2, 'Ana', 'Anić', 'Ulica 1, Zagreb', '0911234567', 'ana@me.com', 0, 'Not generated!', '$2b$10$jxyZd5pdKQolBvfnJJ7SB.PqPpzZe487G9Go.yZ/O1vKq0CzETZPG'),('00000000001', 1, 'Ivan', 'Ivić', 'Ulica 2, Split', '0922345678', 'peropetar12345678@gmail.com', 0, 'Not generated!', '$2b$10$jxyZd5pdKQolBvfnJJ7SB.PqPpzZe487G9Go.yZ/O1vKq0CzETZPG');
INSERT INTO post (id, name, description, isActive) VALUES (1, 'bd2015e5ca8843475c3f3b11:579abbf5a010ca608100cf6c410a93213ed993dae8143390622373d1517ce357:94a81331fbccd375ac463e4851b904b2', 'bffdc7d70a26d9f1aa4de48e:5fcda35cb2ddf8b395a43f5b692e1bf116814c0ebfaa368363:8e2ad1eeebba9e6b6ab870a00f742654', 1); 
INSERT INTO choices (id, name, post_id) VALUES 
(1, '74cb2c51d04434518a513693:217ce15d8fc91c2b3a55a651754d:ac8ef541c24111f137c06453f2e6d8ae', 1), 
(2, '65631919f0f2c517e243c515:fd0062bc14551fbc3b47405a5337:15a48b4c6ee410a4cd013b7ccabb53e4', 1), 
(3, 'ddb5c8b3efcb3ec8ac206cb5:baf805399000b83dc7dc2713adac:0ec45d8f7fa03ec14e51279892d92cff', 1), 
(4, '9ef5daed141265a02bd1927e:1e9f645404c5503da911849af2be2b88:2c13c261abd6423c684b6b3b2b658df8', 1), 
(5, '9b550a05485da488424b04e5:9bc70e8cc452deabdc2797ea9ca79f917cbbf7d1401e20294f:5837ecd320badb5c11118a218b72eff2', 1); 

INSERT INTO post (id, name, description, isActive) VALUES (2, 'fbcc8726338bb8f978d8606b:d6:f4db5c751c410854acaeb62ecc8760b9', '6671801f1937075cc3b787f0:82:3132dd35c9081b8612a2d09cf5ab2dfb', 1); 
INSERT INTO choices (id, name, post_id) VALUES 
(6, 'be95e146ea74eea33caca7df:b7:391378c94209ddc77af55eb29b636c58', 2), 
(7, '212790cfa705df71468c2ecd:6d:3f0668e9e39a2873afcadd47ead8aaa6', 2);

UNLOCK TABLES;

SELECT 
    u.oib,
    u.name AS user_name,
    u.surname AS user_surname,
    u.address,
    u.phone,
    u.email,
    ut.name AS user_type,
    p.name AS post_name,
    p.description AS post_description,
    c.name AS choice_name,
    up.voted_time
FROM 
    user u
JOIN 
    user_type ut ON u.id_user_type = ut.id
JOIN 
    user_post up ON u.oib = up.user_oib
JOIN 
    post p ON up.post_id = p.id
JOIN 
    choices c ON up.choices_id = c.id
ORDER BY 
    up.voted_time DESC;