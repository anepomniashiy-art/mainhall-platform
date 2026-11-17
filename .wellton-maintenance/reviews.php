// WELLTON_REVIEWS_START — keep the original testimonials and their provenance.
// The old aggregate badges all linked to google.com, including Yelp/Trustpilot/
// Tripadvisor. Retain their branding without inventing company profiles or scores.
$wlDirectReviews=json_decode(<<<'WELLTON_DIRECT_REVIEWS'
__WELLTON_DIRECT_REVIEWS_JSON__
WELLTON_DIRECT_REVIEWS,true);
$wlDirectCards='';
foreach($wlDirectReviews as $review){
 $reviewText=$review['text'][$preview_language]??$review['text']['en'];
 $reviewDate=DateTimeImmutable::createFromFormat('!Y-m-d',$review['date']);
 $wlDirectCards.='<div class="revgridtext-item wl-direct-review" data-review-id="'.esc_attr($review['id']).'"><div class="itemheader"><div class="logo"><span class="wl-direct-review-label">'.v7e(v7l('Клиент Wellton','Wellton client','Wellton-Kunde','Klient Wellton')).'</span></div><div class="hdr"><div class="notebar"><span class="note">'.(int)$review['rating'].'</span>'.str_repeat('<div class="star"></div>',(int)$review['rating']).'</div><div class="date"><time datetime="'.esc_attr($review['date']).'">'.($reviewDate?$reviewDate->format('d/m/Y'):esc_html($review['date'])).'</time></div></div></div><div class="text"><p>'.esc_html($reviewText).'</p></div><div class="itemfooter"><div class="by"><span>'.esc_html($review['author']).'</span></div><div class="source">'.v7e(v7l('Отзыв клиента','Client testimonial','Kundenstimme','Opinia klienta')).'</div></div></div>';
}
foreach($x->query(wclass('revgridtext')) as $grid){
 $items=$x->query('.//*['.wc('swiper-wrapper').' or '.wc('notSlider').']',$grid)->item(0);
 if($items&&!$x->query('.//*[@data-review-id]',$items)->length)$items->insertBefore(wl_html($wlDirectCards),$items->firstChild);
}
foreach(iterator_to_array($x->query(wclass('revgrid'))) as $old){
 if($x->query('.//img[contains(@src,"brand-") or contains(@data-src,"brand-")]',$old)->length)$old->parentNode->removeChild($old);
}
$wlReviewPlatforms='<div class="wl-review-platforms" aria-label="'.v7e(v7l('Площадки отзывов','Review platforms','Bewertungsplattformen','Platformy opinii')).'">';
foreach(['yelp'=>'Yelp','trustpilot'=>'Trustpilot','google'=>'Google','tripadvisor'=>'Tripadvisor'] as $key=>$name){
 $brand='<img src="https://welltonproperty.com/wp-content/uploads/2024/09/brand-'.$key.'.png" alt="'.esc_attr($name).'" loading="lazy" decoding="async">';
 $wlReviewPlatforms.=$key==='google'
  ?'<a class="wl-review-platform" href="https://maps.app.goo.gl/55M1NU6CB4iJ1pq76" target="_blank" rel="noopener noreferrer" aria-label="'.v7e(v7l('Отзывы Wellton в Google','Wellton reviews on Google','Wellton-Bewertungen bei Google','Opinie o Wellton w Google')).'">'.$brand.'<span aria-hidden="true">↗</span></a>'
  :'<div class="wl-review-platform">'.$brand.'</div>';
}
$wlReviewPlatforms.='</div>';
foreach($x->query(wclass('revgridtext')) as $grid){
 if(!$x->query('../*['.wc('wl-review-platforms').']',$grid)->length)$grid->parentNode->insertBefore(wl_html($wlReviewPlatforms),$grid);
 if($preview_view==='reviews')$grid->setAttribute('id','client-reviews');
}
foreach($x->query(wclass('reviews')) as $reviewSection)$reviewSection->setAttribute('id','client-reviews');
foreach($x->query(wclass('revgridtext-item')) as $card){
 // Two original English entries accidentally include the rating before “I”.
 // Remove only that exact formatting artefact; preserve the testimonial itself.
 $firstText=$x->query('(.//*['.wc('text').']//text()[normalize-space()])[1]',$card)->item(0);
 if($firstText)$firstText->nodeValue=preg_replace('/^(\s*)5(?=I (?:bought|express)\b)/u','$1',$firstText->nodeValue);
 foreach($x->query('.//*['.wc('logo').']//img',$card) as $logo){
  if(strpos($logo->getAttribute('src').$logo->getAttribute('data-src'),'brand-google')!==false)$logo->setAttribute('alt','Google');
 }
 foreach($x->query('.//a[@target="_blank"]',$card) as $link)$link->setAttribute('rel','noopener noreferrer');
 foreach($x->query('.//*['.wc('notebar').']',$card) as $rating){
  $value=trim($x->query('.//*['.wc('note').']',$rating)->item(0)->textContent??'');
  if($value!==''){
   $rating->setAttribute('role','img');
   $rating->setAttribute('aria-label',$value.' '.v7l('из 5','out of 5','von 5','z 5'));
  }
  foreach($x->query('./*',$rating) as $part)$part->setAttribute('aria-hidden','true');
 }
}
// WELLTON_REVIEWS_END
