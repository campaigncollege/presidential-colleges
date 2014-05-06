dojo.require("esri.arcgis.utils");
dojo.require("esri.map");

/******************************************************
***************** begin config section ****************
*******************************************************/

var TITLE = "This is the title."
var BYLINE = "This is the byline"
var WEBMAP_ID = "caca75ada5f14f1dad84a560db831a50";
var GEOMETRY_SERVICE_URL = "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";

var CSV_COLLEGES_URL = "data/colleges.csv";
var CSV_PRESIDENTS_URL = "data/presidents.csv";
var CSV_RELATIONSHIPS_URL = "data/relationships.csv"

/******************************************************
***************** end config section ******************
*******************************************************/

var _map;

var _dojoReady = false;
var _jqueryReady = false;

var _homeExtent; // set this in init() if desired; otherwise, it will 
				 // be the default extent of the web map;

var _isMobile = Helper.isMobile();
var _isIE = (navigator.appVersion.indexOf("MSIE") > -1);
var _isEmbed = false;

var _tableColleges;
var _tablePresidents;
var _tableRelationships;

var _selectedPresident;
var _selectedCollege;

/*

might need this if you're using icons.

var _lutBallIconSpecs = {
	tiny:new IconSpecs(24,24,12,12),
	medium:new IconSpecs(30,30,15,15),
	large:new IconSpecs(30,30,15,15)
}
*/

dojo.addOnLoad(function() {_dojoReady = true;init()});
jQuery(document).ready(function() {_jqueryReady = true;init()});

function init() {
	
	if (!_jqueryReady) return;
	if (!_dojoReady) return;
	
	// determine whether we're in embed mode
	
	var queryString = esri.urlToObject(document.location.href).query;
	if (queryString) {
		if (queryString.embed) {
			if (queryString.embed.toUpperCase() == "TRUE") {
				_isEmbed = true;
			}
		}
	}
	
	// jQuery event assignment
	
	$(this).resize(handleWindowResize);
	
	$("#zoomIn").click(function(e) {
        _map.setLevel(_map.getLevel()+1);
    });
	$("#zoomOut").click(function(e) {
        _map.setLevel(_map.getLevel()-1);
    });
	$("#zoomExtent").click(function(e) {
        _map.setExtent(_homeExtent);
    });
	
	$("#title").append(TITLE);
	$("#subtitle").append(BYLINE);	


	_map = new esri.Map("map",
						{
							basemap:"gray",
							slider: false,
							extent: new esri.geometry.Extent({xmin:-13854058,ymin:2382389,xmax:-7592337,ymax:6530779,spatialReference:{wkid:102100}})							
						});						
	if(_map.loaded){
		finishInit();
	} else {
		dojo.connect(_map,"onLoad",function(){
			finishInit();
		});
	}

	_tableColleges = new Spreadsheet();
	_tableColleges.doLoad(CSV_COLLEGES_URL, null, function(){finishInit()});
	
	_tablePresidents = new Spreadsheet();
	_tablePresidents.doLoad(CSV_PRESIDENTS_URL, null, function(){finishInit()});
	
	_tableRelationships = new Spreadsheet();
	_tableRelationships.doLoad(CSV_RELATIONSHIPS_URL, null, function(){finishInit()});
			
}

function finishInit() {
	
	if (!_map) {
		return;
	} else {
		if (!_map.loaded) return;
	}
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
	
	// if _homeExtent hasn't been set, then default to the initial extent
	// of the web map.  On the other hand, if it HAS been set AND we're using
	// the embed option, we need to reset the extent (because the map dimensions
	// have been changed on the fly).

	if (!_homeExtent) {
		_homeExtent = _map.extent;
	} else {
		if (_isEmbed) {
			setTimeout(function(){
				_map.setExtent(_homeExtent)
			},500);
		}	
	}

	var sr = new esri.SpatialReference(4326);	
	$.each(_tableColleges.getRecords(), function(index, value) {
		var pt = new esri.geometry.Point(value.x, value.y, sr);
		var sym = new esri.symbol.SimpleMarkerSymbol(
				esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 10*(parseInt(value.count)),
				new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,255]), 2),
				new dojo.Color([0,0,255,0.5])
			);
		var graphic = new esri.Graphic(pt, sym, value);		
		_map.graphics.add(graphic);
	});
	
	
	dojo.connect(_map.graphics, "onMouseOver", layer_onMouseOver);
	dojo.connect(_map.graphics, "onMouseOut", layer_onMouseOut);
	dojo.connect(_map.graphics, "onClick", layer_onClick);	
	
	// click action on the map where there's no graphic 
	// causes a deselect.

	dojo.connect(_map, 'onClick', function(event){
		if (event.graphic == null) {
			_map.infoWindow.hide();
		}
	});		
	
	handleWindowResize();
	$("#whiteOut").fadeOut();
	
}


function layer_onMouseOver(event) 
{
	if (_isMobile) return;
	var graphic = event.graphic;
	_map.setMapCursor("pointer");
	if (!_isIE) moveGraphicToFront(graphic);	
	$("#hoverInfo").html("<b>"+graphic.attributes.college+"</b> ("+graphic.attributes.count+")");
	var pt = _map.toScreen(graphic.geometry);
	hoverInfoPos(pt.x,pt.y);	
}


function layer_onMouseOut(event) 
{
	var graphic = event.graphic;
	_map.setMapCursor("default");
	$("#hoverInfo").hide();
}


function layer_onClick(event) 
{
	$("#hoverInfo").hide();
	_selectedCollege = event.graphic;
	postSelection();
}

function postSelection()
{
	_map.infoWindow.setTitle(_selectedCollege.attributes.college);
	_map.infoWindow.show(_selectedCollege.geometry);
}

function moveGraphicToFront(graphic)
{
	var dojoShape = graphic.getDojoShape();
	if (dojoShape) dojoShape.moveToFront();
}

function hoverInfoPos(x,y){
	if (x <= ($("#map").width())-230){
		$("#hoverInfo").css("left",x+15);
	}
	else{
		$("#hoverInfo").css("left",x-25-($("#hoverInfo").width()));
	}
	if (y >= ($("#hoverInfo").height())+50){
		$("#hoverInfo").css("top",y-35-($("#hoverInfo").height()));
	}
	else{
		$("#hoverInfo").css("top",y-15+($("#hoverInfo").height()));
	}
	$("#hoverInfo").show();
}

function handleWindowResize() {
}


