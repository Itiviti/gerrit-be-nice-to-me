( function( $ ) {

//
var xGerritAuth;
var gerrit_rpc_base = "/gerrit_ui/rpc/";
var current_change_id;
var gerrit_request_id = 1;

function colorComment( $commentPanel ) {
	var author = $commentPanel.find( '.commentPanelAuthorCell' ).text();
	var username = $('.menuBarUserName').text()
	var heading = $commentPanel.find( '.commentPanelMessage p' ).eq( 0 ).text(),
		color = '#aaa';
	if (author === username) {
		color = 'blue';
	} else if ( heading.match( /Code\-Review\-2$/ ) || heading.match( /Verified\-2$/ ) ) {
		color = '#C90505';
	} else if ( heading.match( /Code\-Review\-1$/ ) || heading.match( /Verified\-1$/ ) ) {
		color = 'red';
	} else if ( heading.match( /Code\-Review\+1$/ ) ) {
		color = 'yellow';
	} else if ( heading.match( /Code\-Review\+2$/ ) ) {
		color = 'green';
	}
	$commentPanel.css( {
		'border-left': 'solid 10px ' + color,
		'border-top-left-radius': 0,
		'border-bottom-left-radius': 0
	} );
}

function postJSON(_url, data, func) {
	$.ajax({type: "POST",
			url: _url,
			dataType: "json",
			data: data,
			headers: {"Content-Type":"application/json; charset=UTF-8",
					  "Accept":"application/json; application/jsonrequest; text/html",
					  "X-Gerrit-Auth": xGerritAuth
					 }
			})
	.done(func)
	.fail(function(a){func("badvalue")});
}

function gerritJsonRPC(service, func, params, cb) {
	gerrit_request_id +=1;
	var url = document.location.origin+gerrit_rpc_base+service;
	var jsonData = '{"jsonrpc":"2.0","method":"'+func+'","params":'+JSON.stringify(params)+',"id":'+gerrit_request_id+',"xsrfKey":"'+ xGerritAuth+'"}';
	postJSON(url, jsonData, cb);
}

function getDetail(id, psid, cb) {
	gerritJsonRPC("ChangeDetailService", "patchSetDetail2",[null,{"changeId":{"id":id},"patchSetId":psid},null], function(r){
		cb(r.result);
	});
}

function parseChangeId(href) {
	var orig = href.substring(8)
	orig = orig.substring(orig.indexOf('/'))
	if (orig.indexOf('/c/') != -1)
		orig = orig.substring(orig.indexOf('/c/')+3)
	else if (orig.indexOf('/changes/') != -1)
		orig = orig.substring(orig.indexOf('/changes/')+9)
	else 
		orig = orig.substring(1)
	if (orig.indexOf('/') != -1)
		orig = orig.substring(0, orig.indexOf('/'))
	return orig;
}

function listener( ev ) {
	var $t = $( ev.target ), $owner, author, action;
	if ( $t.hasClass( 'commentPanel' ) ) { // force open comment panel
		author = $t.find( '.commentPanelAuthorCell' ).text();
		action = $t.find( '.commentPanelSummary' ).text();
		if ( author === 'builder builder' || author === 'Review Bot' ||
			action.indexOf( 'Uploaded patch set' ) === 0  ||
			action.match( /was rebased$/ ) ) {
			 // make jenkins comments less prominent
			$t.find( '.commentPanelHeader' ).css( 'opacity', 0.6 );
		} else if (action.match( /…$/)) {
			$t.find( '.commentPanelSummary' ).hide();
			$t.find( '.commentPanelContent' ).show();
		}
		colorComment( $t );
	} else if ( $t.hasClass( 'gwt-InlineHyperlink' ) && $t.text() === 'Permalink') {
		current_change_id = parseChangeId($t.attr('href'));
	} else if ( $t.hasClass( 'gwt-DisclosurePanel' ) ) {
		var psText = $t.find( 'tr' ).eq( 0 ).find( 'td' ).eq( 2 ).text().replace('Patch Set ','')
	    getDetail(current_change_id, psText, function(r){
			var parent = r.info.parents[0].id.id;
			var comments = 0;
			r.patches.forEach(function(a) {
				comments += a.nbrComments;
			});
			if (comments > 0)
				$( '<span/>' ).text( ' (' + comments + ')').appendTo( $t.find( 'tr' ).eq( 0 ).find( 'td' ).eq( 2 ) );
			$( '<span/>' ).text( ' / ' + parent ).appendTo( $t.find( '.patchSetRevision' ).eq( 0 ) );
		})
	}
}

document.addEventListener( 'DOMNodeInserted', listener, false );

$.get(document.location.origin.toString())
.done(function(res) {
	xGerritAuth = res.split("xGerritAuth")
	if (xGerritAuth.length>1)
		xGerritAuth = xGerritAuth[1].split('=')[1].split('"')[1]
	else
		xGerritAuth=""
});

} )( jQuery );
