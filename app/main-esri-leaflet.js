var COLOR_DIM = "#E7E7E7";
var COLOR_FULL = "#FFFFFF";

var LEFT_PANE_WIDTH_ONE_COLUMN = 175;
var LEFT_PANE_WIDTH_TWO_COLUMN = 327;
var LEFT_PANE_WIDTH_THREE_COLUMN = 485;

var ONE_COLUMN_THRESHOLD = 900;
var TWO_COLUMN_THRESHOLD = 960;

var CSV_COLLEGES_URL = "data/colleges.csv";
var CSV_PRESIDENTS_URL = "data/presidents.csv";
var CSV_RELATIONSHIPS_URL = "data/relationships.csv";

var _tableColleges;
var _tablePresidents;
var _tableRelationships;

var _map;

var _layerColleges;

var _count = 0;

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

	handleWindowResize();	

	_map = L.map('map').setView([37.9, -77], 4);
	L.esri.basemapLayer('Gray', {}).addTo(_map);		

	var marker;
	var count;
	var mSize;
	var recs = _tableColleges.getOrderedByCount();

	_layerColleges = new L.LayerGroup();
	
	$.each(recs, function(index, value){
		count = _tableRelationships.getPresidentIDsForCollege(value[Colleges.FIELDNAME_COLLEGE_ID]).length;
		mSize = 'small';
		if (count == 5) mSize = 'large';
		if (count == 2 || count == 3) mSize = 'medium';
		marker = L.marker(
			[value[Colleges.FIELDNAME_COLLEGE_Y], value[Colleges.FIELDNAME_COLLEGE_X]], 
			{
				zIndexOffset: 1000+index,
				title: value[Colleges.FIELDNAME_COLLEGE_NAME],
				id: value[Colleges.FIELDNAME_COLLEGE_ID],
				riseOnHover:true, 
				riseOffset:30
			}
		);
		marker.bindPopup("<b>"+value[Colleges.FIELDNAME_COLLEGE_NAME]+"</b>");
		marker.on('click', 
				function(e){
					_selectedCollege = _tableColleges.getCollegeByID(e.target.options.id);
					postSelection();
					
				}
		);	
		marker.addTo(_layerColleges);
	});

	_layerColleges.addTo(_map);
	
	createTileList($("#myList"));

	$("ul.tilelist li").mouseover(tile_onMouseOver);
	$("ul.tilelist li").mouseout(tile_onMouseOut);
	$("ul.tilelist li").click(tile_onClick);	

	$(this).resize(handleWindowResize);	
	$("#whiteOut").fadeOut();
	
}

/********************* EVENTS ******************************/

function tile_onMouseOver(e) {
	 $(this).css('background-color', COLOR_FULL);
}

function tile_onMouseOut(e) {
	$(this).css('background-color', COLOR_DIM);
}

function tile_onClick(e) {
		
	var president = _tablePresidents.getRecords()[$.inArray(this, $(".tilelist li"))];
	_selectedCollege = selectLastCollege(president[Presidents.FIELDNAME_PRESIDENT_ID]);
	
	if (!_selectedCollege) {
		retract();
		showNoCollege(president[Presidents.FIELDNAME_PRESIDENT_NAME]);
		return;		
	} else {
		postSelection($.inArray(president[Presidents.FIELDNAME_PRESIDENT_ID], _tableRelationships.getPresidentIDsForCollege(_selectedCollege[Colleges.FIELDNAME_COLLEGE_ID])));
	}

}

function handleWindowResize() {
	
	$("#paneLeft").height($("body").height());
			
	if ($("body").width() <= ONE_COLUMN_THRESHOLD) {
		$("#paneLeft").width(LEFT_PANE_WIDTH_ONE_COLUMN);
	} else if($("body").width() <= TWO_COLUMN_THRESHOLD || ($("body").width() <= 1024 && $("body").height() <= 768)) {
		$("#paneLeft").width(LEFT_PANE_WIDTH_TWO_COLUMN);
	} else {
		$("#paneLeft").width(LEFT_PANE_WIDTH_THREE_COLUMN);
	}

	$("#map").css("left", $("#paneLeft").outerWidth());
	$("#map").height($("body").height());
	$("#map").width($("body").width() - $("#paneLeft").outerWidth());			
		
	$(".tilelist").height($("#paneLeft").height() - 18);
	$(".tilelist").width($("#paneLeft").width() + 7);		

	$("#alt-info").css("left", ($("#map").outerWidth() - $("#alt-info").outerWidth())/2);	
	$("#no-college").css("left", ($("#map").outerWidth() - $("#no-college").outerWidth())/2);	
		
}

/************ CHANGED ***************/

function postSelection(index)
{
	
	retractNoCollege();
	
	constructSlidey(_selectedCollege[Colleges.FIELDNAME_COLLEGE_ID], index, function(){});
	
	$("#college-title").html(_selectedCollege[Colleges.FIELDNAME_COLLEGE_NAME]);
	$("#college-seal").attr("src", _selectedCollege[Colleges.FIELDNAME_COLLEGE_IMAGE]);

	var marker = $.grep(_layerColleges.getLayers(), function(n, i){return n.options.id == _selectedCollege[Colleges.FIELDNAME_COLLEGE_ID];})[0];	
	//setMarkerColorAll("#b9b9b9");
	//setMarkerColor(marker, '#00ff00');
	marker.openPopup();
	
	
	if (_count === 0) _map.setView(marker.getLatLng(),6);
	else _map.panTo(marker.getLatLng());
	
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

/********************** NEW *********************

function setMarkerColorAll(hex)
{					
	$.each(_layerColleges.getLayers(), function(index, value){
		var w = value.options.icon.options.iconSize[0];
		var sz = 'small';
		if (w == 30) sz = 'medium';
		if (w == 35) sz = 'large';
		value.setIcon(L.mapbox.marker.icon({'marker-size': sz,'marker-color': hex}));
	});
}

function setMarkerColor(marker, hex)
{										
	var width = marker.options.icon.options.iconSize[0];
	var mSize = 'small';
	if (width == 30) mSize = 'medium';
	if (width == 35) mSize = 'large';
	marker.setIcon(L.mapbox.marker.icon({'marker-size': mSize,'marker-color': hex}));
}
*/