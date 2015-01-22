var COLOR_DIM = "#E7E7E7";
var COLOR_FULL = "#FFFFFF";

var LEFT_PANE_WIDTH_ONE_COLUMN = 175;
var LEFT_PANE_WIDTH_TWO_COLUMN = 327;
var LEFT_PANE_WIDTH_THREE_COLUMN = 485;

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

	_map = L.map('map').setView([37.9, -95], 4);
	L.esri.basemapLayer('Gray', {}).addTo(_map);
	_layerTransferRoute = new L.LayerGroup().addTo(_map);
	_layerColleges = new L.LayerGroup().addTo(_map);
	_map.on('click', function(e){_selectedCollege = null; retract();_layerTransferRoute.clearLayers()})

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
	_selectedCollege = _tableColleges.getRecords()[$.inArray(this, $(".tilelist li"))];
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
	_layerTransferRoute.addLayer(L.polyline(latLngs));
}

function changeMode()
{
	console.log("adjusting for mobile = ", _isMobile);
}


function handleWindowResize() {

	var modeMobile = $("body").width() < THRESHOLD_WIDTH_MOBILE;
	if (modeMobile != _isMobile) {
		_isMobile = modeMobile;
		changeMode();
	}

	$("#paneLeft").height($("body").height());

	if (_isMobile) {
		$('#paneLeft').width($('body').width());
	} else {
		if ($("body").width() <= ONE_COLUMN_THRESHOLD) {
			$("#paneLeft").width(LEFT_PANE_WIDTH_ONE_COLUMN);
		} else if($("body").width() <= TWO_COLUMN_THRESHOLD || ($("body").width() <= 1024 && $("body").height() <= 768)) {
			$("#paneLeft").width(LEFT_PANE_WIDTH_TWO_COLUMN);
		} else {
			$("#paneLeft").width(LEFT_PANE_WIDTH_THREE_COLUMN);
		}
	}

	$("#paneRight").css("left", $("#paneLeft").outerWidth());
	$("#paneRight").height($("body").height());
	$("#paneRight").width($("body").width() - $("#paneLeft").outerWidth());			
		
	$(".tilelist").height($("#paneLeft").height() - 18 - $(".tab").outerHeight());
	$(".tilelist").width($("#paneLeft").width() + 7);		

	$("#info").css("left", ($("#paneRight").outerWidth() - $("#info").outerWidth())/2);	
	$("#no-college").css("left", ($("#paneRight").outerWidth() - $("#no-college").outerWidth())/2);	
		
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
	
	var height = _map.getBounds().getNorth() - _map.getBounds().getSouth();
	var pt = L.latLng(_selectedCollege[Colleges.FIELDNAME_COLLEGE_Y] - height*0.2, _selectedCollege[Colleges.FIELDNAME_COLLEGE_X]);
	_map.panTo(pt);
}


