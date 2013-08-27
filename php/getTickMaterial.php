<?php
$time = new DateTime('now', new DateTimeZone('EAT'));
$timeEAT=$time->format('Y-m-d H:i:s');
if(file_exists("settings.ini"))
{
	$settings=array();
	$settings=parse_ini_file("settings.ini");
	$username=$settings["username"];
	$password=$settings["password"];
	$database=$settings["db_name"];
	$host=$settings["host"];
	$connect=mysql_connect($host,$username,$password) or die("101");
	mysql_select_db($database) or die(mysql_error());
	
	$query="SELECT * FROM `tick_stabilates` ORDER BY `date_prepared` ASC";
	$result=mysql_query($query) or die(mysql_error());
	$stabilateArray=array();
	$count=0;
	while($fetchedRow=mysql_fetch_assoc($result))
	{
		$stabilateArray[$count]=$fetchedRow;
		$count++;
	}
	
	//$query="SELECT * FROM `tick_parasites` ORDER BY `parasite_name` ASC";
	$query="SELECT * FROM `tick_parasites` ORDER BY RAND()";
	$result=mysql_query($query) or die(mysql_error());
	$parasiteArray=array();
	$count=0;
	while($fetchedRow=mysql_fetch_assoc($result))
	{
		$parasiteArray[$count]=$fetchedRow;
		$count++;
	}
	
	$query="SELECT * FROM `tick_frozen_material` ORDER BY `material_name` ASC";
	$result=mysql_query($query) or die(mysql_error());
	$frozenMaterialArray=array();
	$count=0;
	while($fetchedRow=mysql_fetch_assoc($result))
	{
		$frozenMaterialArray[$count]=$fetchedRow;
		$count++;
	}
	
	$jsonArray=array();
	$jsonArray['stabilates']=$stabilateArray;
	$jsonArray['parasites']=$parasiteArray;
	$jsonArray['frozenMaterial']=$frozenMaterialArray;
	echo json_encode($jsonArray);
}
?>
