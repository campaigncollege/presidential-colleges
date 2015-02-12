var COLOR_DIM = "#E7E7E7";
var COLOR_FULL = "#FFFFFF";

var LEFT_PANE_WIDTH_ONE_COLUMN = 185;
var LEFT_PANE_WIDTH_TWO_COLUMN = 338;
var LEFT_PANE_WIDTH_THREE_COLUMN = 493;

var ONE_COLUMN_THRESHOLD = 900;
var TWO_COLUMN_THRESHOLD = 960;

var THRESHOLD_WIDTH_MOBILE = 500;

var CSV_COLLEGES_URL = "data/colleges.csv";
var CSV_PRESIDENTS_URL = "data/presidents.csv";
var CSV_RELATIONSHIPS_URL = "data/relationships.csv";

var _tableColleges;
var _tablePresidents;
var _tableRelationships;

var _map;
var _contentPlaque;

var _layerColleges;
var _layerTransferRoute;

var _count = 0;

var _isMobile;

jQuery(document).ready(function(){init();});

function init() {
	
	_tableColleges = new Colleges();
	_tableColleges.doLoad(CSV_COLLEGES_URL, null, function(){finishInit();});
	
	_tablePresidents = new Presidents();
	_tablePresidents.doLoad(CSV_PRESIDENTS_URL, null, function(){finishInit();});
	
	_tableRelationships = new Relationships();
	_tableRelationships.doLoad(CSV_RELATIONSHIPS_URL, null, function(){finishInit();});
					
}

function finishInit() {
	
	if (!_tableColleges) {
		return;
	} else {
		if (!_tableColleges.getRecords()) return;
	}
	if (!_tablePresidents) {
		return;
	} else {
		if (!_tablePresidents.getRecords()) return;
	}
	if (!_tableRelationships) {
		return;
	} else {
		if (!_tableRelationships.getRecords()) return;
	}

	_contentPlaque = new ContentPlaque("#info");
	$(_contentPlaque).on("activatePresident", onActivatePresident);

	handleWindowResize();	

	_map = L.map('map',{attributionControl:false}).setView([37.9, -95], 4);
	L.esri.basemapLayer('Gray', {}).addTo(_map);
	_layerTransferRoute = new L.LayerGroup().addTo(_map);
	_layerColleges = new L.LayerGroup().addTo(_map);
	_map.on('click', function(e){_selectedCollege = null; retract();_layerTransferRoute.clearLayers()})
	_map.addControl(L.control.attribution({position:'bottomleft'}));

	$(".esri-leaflet-logo").hide();


	var marker;
	var count;
	var recs = _tableColleges.getOrderedByCount();

	// quick and dirty: create a big icon
	L.Icon.Big = L.Icon.Default.extend({
	    options: {
	    	iconSize: [35, 57],
	    	iconAnchor: [17, 57],
	    	popupAnchor: [0, -45],
	    	shadowSize:[70, 89],
	    	shadowAnchor:[20, 89]	    	
		}
	});	

	L.Icon.Medium = L.Icon.Default.extend({
	    options: {
	    	iconSize: [30, 49],
	    	iconAnchor: [15, 49],
	    	popupAnchor: [-1, -40],
	    	shadowSize: [60, 75],
	    	shadowAnchor:[20, 75]
		}
	});	
	
	$.each(recs, function(index, value){
		count = _tableRelationships.getPresidentIDsForCollege(value[Colleges.FIELDNAME_COLLEGE_ID]).length;
		marker = L.marker(
			[value[Colleges.FIELDNAME_COLLEGE_Y], value[Colleges.FIELDNAME_COLLEGE_X]], 
			{
				zIndexOffset: 1000+index,
				title: value[Colleges.FIELDNAME_COLLEGE_NAME],
				id: value[Colleges.FIELDNAME_COLLEGE_ID],
				riseOnHover:true, 
				riseOffset:30,
			}
		);
		if (count == 5) {
			marker.setIcon(new L.Icon.Big());
		} else if (count == 2 || count == 3) {
			marker.setIcon(new L.Icon.Medium());	
		} else {
			// nothing
		}
		marker.bindPopup("<b>"+value[Colleges.FIELDNAME_COLLEGE_NAME]+"</b>", {closeButton: false});
		marker.on('click', 
				function(e){
					_selectedCollege = _tableColleges.getCollegeByID(e.target.options.id);
					postSelection();
					
				}
		);	
		marker.addTo(_layerColleges);
	});
	
	createPresidentTileList($("#myList"));

	$(this).resize(handleWindowResize);

	$("#tabPresidents").addClass("selected");
	$(".tab").click(
		function(e){
			_selectedCollege = null; 
			retract();
			_layerTransferRoute.clearLayers();
			_map.closePopup();
			$(".tab").removeClass("selected");
			$(e.target).addClass("selected");
			if ($(e.target).html() == "Colleges") {
				createCollegeTileList($("#myList"));
			} else {
				createPresidentTileList($("#myList"));				
			}
		}
	);


	var _page = {
		title: encodeURIComponent($('meta[property="og:title"]').attr('content')),
		summary: encodeURIComponent($('meta[property="og:description"]').attr('content')),
		url: encodeURIComponent($('meta[property="og:url"]').attr('content')),
		thumbnail: encodeURIComponent($('meta[property="og:image"]').attr('content')),
		twitterText: encodeURIComponent($('meta[name="twitter:title"]').attr('content')),
		twitterHandle: encodeURIComponent($('meta[name="twitter:site"]').attr('content').replace('@',''))
	};

	var _shareOptions = {
		title: _page.title,
		summary: _page.summary,
		url: _page.url,
		thumbnail: _page.thumbnail,
		twitterText: _page.twitterText,
		twitterHandle: _page.twitterHandle,
		hashtags: 'storymap'
	};

	$('.social-button').click(function(){
		if ($(this).hasClass('icon-facebook')) {
			var facebookOptions = '&p[title]=' + _shareOptions.title
				+ '&p[summary]=' + _shareOptions.summary
				+ '&p[url]=' + _shareOptions.url
				+ '&p[image]=' + _shareOptions.thumbnail;

			window.open(
				'http://www.facebook.com/sharer.php?s=100' + facebookOptions,
				'',
				'toolbar=0,status=0,width=626,height=436'
			);
		}
		else if($(this).hasClass('icon-twitter')) {
			var twitterOptions = 'text=' + _shareOptions.twitterText
				+ '&url=' + _shareOptions.url
				+ '&via=' + _shareOptions.twitterHandle
				+ '&hashtags=' + _shareOptions.hashtags;

			window.open(
				'https://twitter.com/intent/tweet?' + twitterOptions,
				'Tweet',
				'toolbar=0,status=0,width=626,height=436'
			);
		}
	});	

	$("#whiteOut").fadeOut();
	
}

/********************* EVENTS ******************************/

function tile_onMouseOver(e) {
	 $(this).css('background-color', COLOR_FULL);
}

function tile_onMouseOut(e) {
	$(this).css('background-color', COLOR_DIM);
}

function tilePresident_onClick(e) {
		
	var president = _tablePresidents.getRecords()[$.inArray(this, $(".tilelist li"))];
	_selectedCollege = selectLastCollege(president[Presidents.FIELDNAME_PRESIDENT_ID]);
	
	if (!_selectedCollege) {
		retract();
		showNoCollege(president[Presidents.FIELDNAME_PRESIDENT_NAME]);
		_map.closePopup();
		return;		
	} else {
		postSelection($.inArray(president[Presidents.FIELDNAME_PRESIDENT_ID], _tableRelationships.getPresidentIDsForCollege(_selectedCollege[Colleges.FIELDNAME_COLLEGE_ID])));
	}

}

function tileCollege_onClick(e) {
	_selectedCollege = _tableColleges.getOrderedByName()[$.inArray(this, $(".tilelist li"))];
	postSelection();
}

function onActivatePresident(event, president)
{
	_layerTransferRoute.clearLayers();
	var colleges = getCollegesForPresident(president[Presidents.FIELDNAME_PRESIDENT_ID]);
	var latLngs = [];
	$.each(colleges, function(index, value){
		latLngs.push(L.latLng(value[Colleges.FIELDNAME_COLLEGE_Y], value[Colleges.FIELDNAME_COLLEGE_X]));
	});
	_layerTransferRoute.addLayer(L.polyline(latLngs, {opacity:0.3,dashArray:"10,10"}));
}

function changeMode()
{
	//console.log("adjusting for mobile = ", _isMobile);
}


function handleWindowResize() {

	var modeMobile = $("body").width() < THRESHOLD_WIDTH_MOBILE;

	if (modeMobile != _isMobile) {
		_isMobile = modeMobile;
		changeMode();
	}

	/*

	if (_isMobile) {
		$('#paneLeft').width($('body').width());
	} else {

	*/

		if($("body").width() <= TWO_COLUMN_THRESHOLD || ($("body").width() <= 1024 && $("body").height() <= 768)) {
			$("#paneLeft").width(LEFT_PANE_WIDTH_TWO_COLUMN);
			formatIntroSlim();
		} else {
			$("#paneLeft").width(LEFT_PANE_WIDTH_THREE_COLUMN);
			formatIntroFat();
		}

	/*

	}

	*/

	$("#paneRight").css("left", $("#paneLeft").outerWidth());
	$("#paneRight").height($("body").height());
	$("#paneRight").width($("body").width() - $("#paneLeft").outerWidth());			
		
	$("#wrapper").height($("#paneLeft").height() - $("#intro").outerHeight() - 8);
	$(".tilelist").width($("#paneLeft").width()-10);		

	_contentPlaque.reposition();
	$("#no-college").css("left", ($("#paneRight").outerWidth() - $("#no-college").outerWidth())/2);	
		
}

function formatIntroSlim()
{
	var text = $("#intro-text");
	$(text).remove();
	$(text).width("100%");
	//$(text).css("padding-left", 15);


	$("#intro").css("padding-left", 15);
	$("#intro").css("padding-right", 15);
	$("#intro").css("box-sizing", "border-box");

	$("#intro img").css("max-height", 200);
	$("#intro img").width("initial");
	$("#intro img").css("margin-left", $("#intro").width()/2 - $("#intro img").width()/2);
	$("#intro").prepend(text);
}

function formatIntroFat()
{
	var text = $("#intro-text");
	$(text).remove();
	$(text).width("50%");
	//$(text).css("padding-left", 0);

	$("#intro").css("padding-left", 0);
	$("#intro").css("padding-right", 0);
	$("#intro").css("box-sizing", "none");

	$("#intro img").css("max-height", "none");
	$("#intro img").width("50%");
	$("#intro img").css("margin-left", 0);
	$("#intro").append(text);
}

/************ CHANGED ***************/

function postSelection(index)
{
	
	_layerTransferRoute.clearLayers();
	retractNoCollege();
	
	_contentPlaque.update(
		_selectedCollege[Colleges.FIELDNAME_COLLEGE_ID],
		_selectedCollege[Colleges.FIELDNAME_COLLEGE_NAME],
		_selectedCollege[Colleges.FIELDNAME_COLLEGE_DESCRIPTION],
		_selectedCollege[Colleges.FIELDNAME_COLLEGE_IMAGE],
		getPresidentsForCollege(_selectedCollege[Colleges.FIELDNAME_COLLEGE_ID]),
		index
		);
	handleWindowResize();
	_contentPlaque.show();

	var marker = $.grep(_layerColleges.getLayers(), function(n, i){return n.options.id == _selectedCollege[Colleges.FIELDNAME_COLLEGE_ID];})[0];	
	marker.openPopup();
	
	
	if (_count === 0) {
		_map.setView(marker.getLatLng(),6);
		setTimeout(offsetCenter, 500);
	} else {
		offsetCenter();		
	}	

	
	
	_count++;
	
}

function selectLastCollege(presidentID)
{
	var lastRelationship = _tableRelationships.getLastRelationship(presidentID);
	var lastCollege = null;
	
	if (lastRelationship) {
		lastCollege = _tableColleges.getCollegeByID(lastRelationship[Relationships.FIELDNAME_RELATIONSHIP_COLLEGE]);
	}
	
	return lastCollege;
}

function offsetCenter()
{
	if (!_selectedCollege) {
		return;
	}

	//todo:  _map.invalidateSize(); ???
	
	var width = _map.getBounds().getEast() - _map.getBounds().getWest();
	var pt = L.latLng(_selectedCollege[Colleges.FIELDNAME_COLLEGE_Y], parseInt(_selectedCollege[Colleges.FIELDNAME_COLLEGE_X]) + width*0.2);
	_map.panTo(pt);
}


