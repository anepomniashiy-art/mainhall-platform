<?php
// WELLTON_REVIEWS_START — keep the original testimonials and their provenance.
// The old aggregate badges all linked to google.com, including Yelp/Trustpilot/
// Tripadvisor. Retain their branding without inventing company profiles or scores.
$wlDirectReviews=json_decode(<<<'WELLTON_DIRECT_REVIEWS'
[
  {
    "id": "helen-2026-10-25",
    "author": "Helen",
    "date": "2026-10-25",
    "rating": 5,
    "source": "client_provided",
    "received_on": "2026-11-17",
    "original_text": "Ребята помогли нам выбрать то, что мы и хотели. Иначально у нас был совершенно другой запрос. Но нам грамотно объяснили и все показали и мы в итоге поняли, что нам на самом деле надо и влюбились в этот дом. Мы купили квартиру с 3 спальнями в Esentepe в шикарном проекте и просто счастливы! По слелке вопросов нет - все бузупречно. Буду вас всегда рекомендовать!",
    "text": {
      "ru": "Ребята помогли нам выбрать то, что мы и хотели. Изначально у нас был совершенно другой запрос. Но нам грамотно объяснили и всё показали, и мы в итоге поняли, что нам на самом деле надо, и влюбились в этот дом. Мы купили квартиру с 3 спальнями в Эсентепе в шикарном проекте и просто счастливы! По сделке вопросов нет — всё безупречно. Буду вас всегда рекомендовать!",
      "en": "The team helped us choose exactly what we wanted. Initially, we were looking for something completely different. But they explained everything clearly and showed us all the options, and we finally understood what we really needed and fell in love with this home. We bought a 3-bedroom apartment in Esentepe in a wonderful development and we are simply delighted! No issues with the purchase — everything was impeccable. I will always recommend you!",
      "de": "Das Team hat uns geholfen, genau das zu finden, was wir wollten. Anfangs hatten wir ganz andere Vorstellungen. Doch uns wurde alles kompetent erklärt und gezeigt. So haben wir schließlich verstanden, was wir wirklich brauchen, und uns in dieses Zuhause verliebt. Wir haben eine Wohnung mit 3 Schlafzimmern in einer wunderschönen Anlage in Esentepe gekauft und sind einfach glücklich! Beim Kauf gab es keine Probleme — alles war einwandfrei. Ich werde euch immer weiterempfehlen!",
      "pl": "Zespół pomógł nam wybrać dokładnie to, czego chcieliśmy. Początkowo szukaliśmy czegoś zupełnie innego. Ale wszystko nam fachowo wyjaśniono i pokazano. W końcu zrozumieliśmy, czego naprawdę potrzebujemy, i zakochaliśmy się w tym domu. Kupiliśmy apartament z 3 sypialniami w Esentepe, we wspaniałej inwestycji, i jesteśmy po prostu szczęśliwi! Do przebiegu zakupu nie mamy żadnych zastrzeżeń — wszystko było bez zarzutu. Zawsze będę was polecać!"
    }
  },
  {
    "id": "rachel-2025-08-07",
    "author": "Рэйчел",
    "date": "2025-08-07",
    "rating": 5,
    "source": "client_provided",
    "received_on": "2026-11-17",
    "original_text": "Команда Wellton с менеджером Мариной провели сделку и помогли нам купить виллу нашей мечты. Сделка была выстроена профессоноально. Мы не переживали вообще. Так ребята и помогли нам подключить электричество и воду, хотя это не входило в их обязанности и проконтролировали ремонт. Мы очень довольны, рекомендуем!",
    "text": {
      "ru": "Команда Wellton с менеджером Мариной провела сделку и помогла нам купить виллу нашей мечты. Сделка была выстроена профессионально. Мы не переживали вообще. Также ребята помогли нам подключить электричество и воду, хотя это не входило в их обязанности, и проконтролировали ремонт. Мы очень довольны, рекомендуем!",
      "en": "The Wellton team, together with our manager Marina, handled the purchase and helped us buy the villa of our dreams. The whole process was organised professionally. We had no worries at all. The team also helped us connect the electricity and water, even though this was outside their responsibilities, and supervised the renovation. We are very happy and highly recommend them!",
      "de": "Das Wellton-Team hat gemeinsam mit unserer Ansprechpartnerin Marina den Kauf abgewickelt und uns geholfen, unsere Traumvilla zu kaufen. Der gesamte Ablauf war professionell organisiert. Wir hatten überhaupt keine Sorgen. Das Team hat uns auch beim Strom- und Wasseranschluss geholfen, obwohl das nicht zu seinen Aufgaben gehörte, und die Renovierung betreut. Wir sind sehr zufrieden und empfehlen Wellton gerne weiter!",
      "pl": "Zespół Wellton wraz z naszą opiekunką Mariną przeprowadził transakcję i pomógł nam kupić willę naszych marzeń. Cały proces był profesjonalnie zorganizowany. W ogóle się nie martwiliśmy. Zespół pomógł nam również podłączyć prąd i wodę, choć nie należało to do jego obowiązków, oraz dopilnował remontu. Jesteśmy bardzo zadowoleni, polecamy!"
    }
  },
  {
    "id": "alexander-2025-01-09",
    "author": "Александр",
    "date": "2025-01-09",
    "rating": 5,
    "source": "client_provided",
    "received_on": "2026-11-17",
    "original_text": "Сбасибо з апрофессиональную работу! Привет вам из Санкт Петербурга! Скоро увидимся! Вы лучшие! Рекомендую!",
    "text": {
      "ru": "Спасибо за профессиональную работу! Привет вам из Санкт-Петербурга! Скоро увидимся! Вы лучшие! Рекомендую!",
      "en": "Thank you for your professional work! Greetings from Saint Petersburg! See you soon! You are the best! Highly recommended!",
      "de": "Vielen Dank für eure professionelle Arbeit! Grüße aus Sankt Petersburg! Bis bald! Ihr seid die Besten! Sehr zu empfehlen!",
      "pl": "Dziękuję za profesjonalną pracę! Pozdrowienia z Petersburga! Do zobaczenia wkrótce! Jesteście najlepsi! Polecam!"
    }
  }
]

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
