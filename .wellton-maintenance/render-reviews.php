<?php
libxml_use_internal_errors(true);
$preview_language=$argv[3]??'en';$preview_view='reviews';
$doc=new DOMDocument('1.0','UTF-8');$doc->loadHTML('<?xml encoding="UTF-8">'.file_get_contents($argv[1]));$x=new DOMXPath($doc);
function wc($n){return "contains(concat(' ',normalize-space(@class),' '),' ".$n." ')";}
function wclass($n,$s=''){return '//*['.wc($n).']'.$s;}
function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES,'UTF-8');}
function esc_html($s){return htmlspecialchars($s,ENT_QUOTES,'UTF-8');}
function v7e($s){return esc_html($s);}
function v7l($ru,$en,$de,$pl){global $preview_language;return ['ru'=>$ru,'en'=>$en,'de'=>$de,'pl'=>$pl][$preview_language];}
function wl_html($html){global $doc;$tmp=new DOMDocument('1.0','UTF-8');$tmp->loadHTML('<?xml encoding="UTF-8"><div>'.$html.'</div>');$frag=$doc->createDocumentFragment();foreach(iterator_to_array($tmp->getElementsByTagName('div')->item(0)->childNodes) as $child)$frag->appendChild($doc->importNode($child,true));return $frag;}
require $argv[2];
echo $doc->saveHTML();
