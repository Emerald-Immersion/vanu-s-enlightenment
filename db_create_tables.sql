-- MariaDB dump 10.19  Distrib 10.6.3-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: vanus_enlightenment
-- ------------------------------------------------------
-- Server version	10.6.3-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `autostart`
--

DROP TABLE IF EXISTS `autostart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `autostart` (
  `autostart_ID` int(11) NOT NULL AUTO_INCREMENT,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `guild_ID` bigint(20) DEFAULT NULL,
  `args` mediumtext NOT NULL,
  `script_ID` int(11) NOT NULL,
  PRIMARY KEY (`autostart_ID`),
  KEY `script_ID` (`script_ID`),
  CONSTRAINT `script_ID` FOREIGN KEY (`script_ID`) REFERENCES `scripts` (`script_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `continent_population`
--

DROP TABLE IF EXISTS `continent_population`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `continent_population` (
  `pop_item_ID` int(11) NOT NULL AUTO_INCREMENT,
  `indar_vs` int(11) NOT NULL,
  `indar_nc` int(11) NOT NULL,
  `indar_tr` int(11) NOT NULL,
  `indar_ns` int(11) NOT NULL,
  `hossin_vs` int(11) NOT NULL,
  `hossin_nc` int(11) NOT NULL,
  `hossin_tr` int(11) NOT NULL,
  `hossin_ns` int(11) NOT NULL,
  `amerish_vs` int(11) NOT NULL,
  `amerish_nc` int(11) NOT NULL,
  `amerish_tr` int(11) NOT NULL,
  `amerish_ns` int(11) NOT NULL,
  `esamir_vs` int(11) NOT NULL,
  `esamir_nc` int(11) NOT NULL,
  `esamir_tr` int(11) NOT NULL,
  `esamir_ns` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `world_id` int(11) NOT NULL,
  `gather_time` int(11) NOT NULL,
  PRIMARY KEY (`pop_item_ID`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=6753 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guild_settings`
--

DROP TABLE IF EXISTS `guild_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guild_settings` (
  `guild_ID` varchar(255) NOT NULL,
  `prefix` varchar(10) NOT NULL DEFAULT '!',
  PRIMARY KEY (`guild_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `metagame_events`
--

DROP TABLE IF EXISTS `metagame_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metagame_events` (
  `experience_bonus` int(11) NOT NULL,
  `faction_nc` int(11) NOT NULL,
  `faction_tr` int(11) NOT NULL,
  `faction_vs` int(11) NOT NULL,
  `instance_id` int(11) NOT NULL,
  `metagame_event_id` int(11) NOT NULL,
  `metagame_event_state` int(11) NOT NULL,
  `metagame_event_state_name` varchar(255) NOT NULL,
  `world_id` int(11) NOT NULL,
  `zone_id` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `outfit_on`
--

DROP TABLE IF EXISTS `outfit_on`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `outfit_on` (
  `rank_ordinal_0` int(11) DEFAULT 0,
  `rank_ordinal_1` int(11) DEFAULT 0,
  `rank_ordinal_2` int(11) DEFAULT 0,
  `rank_ordinal_3` int(11) DEFAULT 0,
  `rank_ordinal_4` int(11) DEFAULT 0,
  `rank_ordinal_5` int(11) DEFAULT 0,
  `rank_ordinal_6` int(11) DEFAULT 0,
  `rank_ordinal_7` int(11) DEFAULT 0,
  `rank_ordinal_8` int(11) DEFAULT 0,
  `outfit_id` varchar(17) DEFAULT NULL,
  `outfit_on_id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`outfit_on_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scripts`
--

DROP TABLE IF EXISTS `scripts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scripts` (
  `script_name` varchar(255) NOT NULL,
  `script_ID` int(11) NOT NULL AUTO_INCREMENT,
  `script_interval` int(11) DEFAULT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`script_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-10-05 21:21:23
