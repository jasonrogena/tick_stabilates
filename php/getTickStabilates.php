<?php
class DataHandler {
   
   private $settings;//stores all settings to be used in this class
   
   /**
    * This is the constructor
    */
   public function __construct() {
      $this->getSettings();
      $this->connectToDatabase();
      
      $query = "SELECT * FROM `tick_stabilates` ORDER BY `date_prepared` ASC";
      $stabilateArray = $this->runMysqlQuery($query, true);
      
      $query = "SELECT * FROM `tick_parasites` ORDER BY RAND()";
      $parasiteArray = $this->runMysqlQuery($query, true);
      
      $query = "SELECT * FROM `tick_frozen_material` ORDER BY `material_name` ASC";
      $frozenMaterialArray = $this->runMysqlQuery($query, true);
      
      $jsonArray=array();
      $jsonArray['stabilates'] = $stabilateArray;
      $jsonArray['parasites'] = $parasiteArray;
      $jsonArray['frozenMaterial'] = $frozenMaterialArray;
      $this->sendJsonData($jsonArray);
   }
   
   /**
    * This method initializes the $settings variable
    * 
    * Settings are parsed from various ini files, including:
    *  -- mysql_creds.ini, preferably stored outside the project's root dir for security reasons.
    *     Please specify the location of mysql_creds.ini using the 'mysql_creds' variable in settings.ini
    *     mysql_creds.ini contains the variables: 'username', 'password' and 'host'
    *  -- settings.ini in the project's root dir.
    *     settings.ini contains the variables: 'db_name' and 'mysql_creds'
    */
   private function getSettings() {
      if(file_exists("../settings.ini")) {
         $settings = parse_ini_file("../settings.ini");
         $mysqlCreds = parse_ini_file($settings['mysql_creds']);
         $settings['mysql_creds'] = $mysqlCreds;
         $this->settings = $settings;
      }
      else {
         return null;
      }
   }
   
   /**
    * This method connects to the mysql database using credentials stored in the $settings variable
    */
   private function connectToDatabase() {
      if($this->settings != null) {
         $mysqlCreds = $this->settings['mysql_creds'];
         mysql_connect($mysqlCreds['host'], $mysqlCreds['username'], $mysqlCreds['password']) or die( mysql_error());
         mysql_select_db($this->settings['db_name']) or die(mysql_error());
      }
   }

   /**
    * This method runs the provided MySQL query
    * 
    * @param $query - String of the actual query to be run
    * @param $getResult - Boolean value indicating wether you are expecting a result
    * 
    * @return array - function returns a two dimensional associative array
    */
   private function runMySQLQuery($query, $getResult) {
      $result = mysql_query($query) or die (mysql_error());
      
      if($getResult == true) {
         $resultArray = array();
         $count = 0;
         while($fetchedRow = mysql_fetch_assoc($result)) {
            $resultArray[$count] = $fetchedRow;
            $count++;
         }
         return $resultArray;
      }
   }
   
   /**
    * This method returns a JsonObject to whatever called this php file
    * 
    * @param $jsonArray - an array of the data you want to be encoded into a Json object before being sent
    */
   private function sendJsonData($jsonArray) {
      $jsonObject = json_encode($jsonArray) or die ("Error encoding json");
      echo $jsonObject;
   }
}

$obj = new DataHandler;
?>