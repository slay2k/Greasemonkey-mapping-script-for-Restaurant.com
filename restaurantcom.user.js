// ==UserScript==
// @name           Restaurant.com Mapper
// @namespace      http://www.flippity.com/
// @description    Helps visualize your restaurant.com certificates
// @include        https://www.restaurant.com/view-my-certificates.asp?*
// ==/UserScript==

var $, r_addresses = {};

// jQuery
(function(){
  if (typeof unsafeWindow.jQuery == 'undefined') {
    var head = document.getElementsByTagName('head')[0] || document.documentElement;

    var jq = document.createElement('script');
    jq.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js';
    jq.type = 'text/javascript';
    head.insertBefore(jq, head.firstChild);
  }
  lock_n_load();
})();

// Spin until jQuery loads, then execute trigger
function lock_n_load() {
  if (typeof unsafeWindow.jQuery == 'undefined') {
    window.setTimeout(lock_n_load, 100);
  } else {
    $ = unsafeWindow.jQuery.noConflict(true);
    jQueryReady();
  }
}

function jQueryReady() {
  var table = $('tr.bodytxt10');
  var spaces = table.find('td:eq(0)');
  var links = table.find('td:eq(2) > a');
  var names = table.find('td:eq(6)');
  var locations = table.find('td:eq(8)');

  for(var i = 0; i < links.length; i++) {
    var name = names.eq(i).html();
    var loc = locations.eq(i).html();

    locations.eq(i).html('<a href="http://maps.google.com/maps?q=' + name + ' near ' + loc + '">' + loc + '</a>');
    spaces.eq(i).html("&nbsp;<b>" + i + "</b>&nbsp");

    GM_xmlhttpRequest({
      method: "GET",
      url: links.eq(i).attr("href") + '&mapperID=' + i,
      onload: function(response) {
	var id = response.finalUrl.match(/&mapperID=(\d+)/);
	id = id ? id[1] : 'R';

	var addr = $('td.bodytxt10:eq(0)', response.responseText);
	addr = addr.find('a')
            .remove()
	  .end()
	  .find('br')
            .remove()
	  .end()
	  .html()
	  .trim();

	r_addresses[id] = addr; // addr.replace(/[\s]+/g, "+");

	if (parseInt(id) == links.length - 1) {
	  drawMap();
	}
      }
    });
  }
}

function drawMap() {
  var img = document.createElement('img');

  var mrkrs = [];
  for (var key in r_addresses) {
    mrkrs.push('markers=size:mid|color:0xFFFF00|label:' + key + '|' + r_addresses[key]);
  }

  // Auto-centering won't work if cities are too far apart, in which case you can specify the center (and change zoom levels) below
  img.src = 'http://maps.google.com/maps/api/staticmap?center=&size=710x350&zoom=12&' + mrkrs.join('&') + '&sensor=false';
  img.style.display = "block";
  img.style.margin = "0 auto";

  $('table:eq(7)').before(img);
}
