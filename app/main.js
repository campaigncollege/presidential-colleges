dojo.require("esri.arcgis.utils");
dojo.require("esri.map");

/******************************************************
***************** begin config section ****************
*******************************************************/

var TITLE = "This is the title."
var BYLINE = "This is the byline"
var WEBMAP_ID = "caca75ada5f14f1dad84a560db831a50";
var GEOMETRY_SERVICE_URL = "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";
var BASEMAP_SERVICE_URL = "http://tiles.arcgis.com/tiles/nGt4QxSblgDfeJn9/arcgis/rest/services/DGCM_2Msmaller_BASE/MapServer";

var CSV_COLLEGES_URL = "data/colleges.csv";
var CSV_PRESIDENTS_URL = "data/presidents.csv";
var CSV_RELATIONSHIPS_URL = "data/relationships.csv"

var FIELDNAME_COLLEGE_ID = "id";
var FIELDNAME_COLLEGE_NAME = "college";
var FIELDNAME_COLLEGE_X = "x";
var FIELDNAME_COLLEGE_Y = "y";
var FIELDNAME_COLLEGE_COUNT = "count";

var FIELDNAME_PRESIDENT_ID = "id";
var FIELDNAME_PRESIDENT_NAME = "president";
var FIELDNAME_PRESIDENT_URL = "field1";

var FIELDNAME_RELATIONSHIP_COLLEGE = "college";
var FIELDNAME_RELATIONSHIP_PRESIDENT = "president";
var FIELDNAME_RELATIONSHIP_NOTE = "note";

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

var _bSmall;
var _bLandscape;

dojo.addOnLoad(function() {_dojoReady = true;init()});
jQuery(document).ready(function() {_jqueryReady = true;init()});

function init() {
	
	if (!_jqueryReady) return;
	if (!_dojoReady) return;
	
	// initialize responsiveness-related variables
	
	_bSmall = $("body").width() < 600 || $("body").height() < 500;
	_bLandscape = $("body").width() > $("body").height();
	
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
							slider: false,
							extent: new esri.geometry.Extent({
								xmin:-13854058,
								ymin:2382389,
								xmax:-7592337,
								ymax:6530779,
								spatialReference:{wkid:102100}
							})							
						});						
	_map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer(BASEMAP_SERVICE_URL));
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
	
	var layerIcons = new esri.layers.GraphicsLayer();

	var sr = new esri.SpatialReference(4326);
	var recs = sortRecsByCount(_tableColleges.getRecords());	
	$.each(recs, function(index, value) {
		var pt = new esri.geometry.Point(value[FIELDNAME_COLLEGE_X], value[FIELDNAME_COLLEGE_Y], sr);

		var sym = new esri.symbol.SimpleMarkerSymbol(
				esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 20+10*(parseInt(value[FIELDNAME_COLLEGE_COUNT])),
				new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,255,255,0]), 2),
				new dojo.Color([0,255,255,0])
			);

		var iconSym = new esri.symbol.PictureMarkerSymbol(
					"resources/icons/green-circle.png", 
					28+10*parseInt(value[FIELDNAME_COLLEGE_COUNT]), 
					28+10*parseInt(value[FIELDNAME_COLLEGE_COUNT])
				);
		layerIcons.add(new esri.Graphic(pt, iconSym, value));
		_map.graphics.add(new esri.Graphic(pt, sym, value));
	});
	
	_map.addLayer(layerIcons);
	
	dojo.connect(_map.graphics, "onMouseOver", layer_onMouseOver);
	dojo.connect(_map.graphics, "onMouseOut", layer_onMouseOut);
	dojo.connect(_map.graphics, "onClick", layer_onClick);	
	
	// click action on the map where there's no graphic 
	// causes a deselect.

	dojo.connect(_map, 'onClick', function(event){
		if (event.graphic == null) {
			_selectedCollege = null;
			if (_bSmall) {
				retract();
				clearMultiTips();
			} else {
				_map.infoWindow.hide();
			}
		}
	});		
	
	setDimensions();
	$("#whiteOut").fadeOut();
	
}


function layer_onMouseOver(event) 
{
	if (_isMobile) return;
	var graphic = event.graphic;
	_map.setMapCursor("pointer");
	$("#hoverInfo").html("<b>"+graphic.attributes[FIELDNAME_COLLEGE_NAME]+
						"</b> ("+graphic.attributes[FIELDNAME_COLLEGE_COUNT]+")");
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
	// find all presidents associated with this college
	var ids = $.map(
					$.grep(_tableRelationships.getRecords(), function(n, i){
						return n[FIELDNAME_RELATIONSHIP_COLLEGE] == _selectedCollege.attributes[FIELDNAME_COLLEGE_ID];
					}), 
					function(val, i){return val[FIELDNAME_RELATIONSHIP_PRESIDENT]}
				);
	var presidents = $.grep(_tablePresidents.getRecords(), function(n, i){
		return $.inArray(n[FIELDNAME_PRESIDENT_ID], ids) > -1;
	});
	var div = $("<div class='banner'></div>");
	var ul = $("<ul></ul>");
	var img;
	var li;
	var relationship;
	$(div).append(ul);
	$.each(presidents, function(index, value){
		img = $("<img/>");
		$(img).addClass("presidentialPortrait");
		$(img).attr("src", value[FIELDNAME_PRESIDENT_URL]);
		li = $("<li></li>");
		$(li).append(img);
		$(li).append("<div style='font-weight:bold'>"+value[FIELDNAME_PRESIDENT_NAME]+"</div>");
		relationships = $.grep(
			_tableRelationships.getRecords(), 
			function(n, i){
				return n[FIELDNAME_RELATIONSHIP_COLLEGE] == _selectedCollege.attributes[FIELDNAME_COLLEGE_ID] && 
					   n[FIELDNAME_RELATIONSHIP_PRESIDENT] == value[FIELDNAME_PRESIDENT_ID];
			}
		);
		if (relationships.length > 0) {
			var note = relationships[0][FIELDNAME_RELATIONSHIP_NOTE];
			if (note) {
				if ($.trim(note) != "") {
					$(li).append("<div class='note'>"+note+"</div>");
				}
			}
		}
		$(ul).append(li);
	});
	var bogus = $("<div></div>");
	$(bogus).append(div);

	if (_bSmall) {
		$("#map").multiTips({
			pointArray : [_selectedCollege],
			labelValue: _selectedCollege.attributes[FIELDNAME_COLLEGE_NAME],
			mapVariable : _map,
			labelDirection : "top",
			backgroundColor : "#FFFFFF",
			textColor : "#000000",
			pointerColor: "#FFFFFF"
		});			
		$("#alt-info").html($(bogus).html());
		if ($("#alt-info").css("bottom") != "0px") {
			$("#alt-info").animate({"bottom":0}, function(){
				offsetCenter();
			});
		}
	} else {
		_map.infoWindow.setContent($(bogus).html());
		_map.infoWindow.setTitle(_selectedCollege.attributes[FIELDNAME_COLLEGE_NAME]);
		_map.infoWindow.show(_selectedCollege.geometry);	
	}
	
	if (presidents.length > 1) {
		var slidey = $('.banner').unslider({
			speed: 500,               //  The speed to animate each slide (in milliseconds)
			delay: 3000,              //  The delay between slide animations (in milliseconds)
			complete: function() {},  //  A function that gets called after every slide animation
			keys: true,               //  Enable keyboard (left, right) arrow shortcuts
			dots: true,               //  Display dot navigation
		});
		var data = slidey.data("unslider");
		data.stop();
	}


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
	
	
	var bSmall = _bSmall;
	var bLandscape = _bLandscape;
	
	_bSmall = $("body").width() < 600 || $("body").height() < 500;
	_bLandscape = $("body").width() > $("body").height();
	
	if ((bSmall != _bSmall) && _selectedCollege) {
		if (_bSmall) {
			_map.infoWindow.hide();
			_map.infoWindow.setContent("");
			setDimensions();
		} else {
			retract();
			$("#alt-info").empty();
			clearMultiTips();
		}
		postSelection();
	}
	
	if ((bLandscape != _bLandscape) && _bSmall) {
		setDimensions();
		if (_selectedCollege) setTimeout(function(){offsetCenter()}, 1000);
	}
	
}

function setDimensions()
{
	if (_bLandscape) {
		$("#alt-info").width(240);
		$("#alt-info").height($("body").height()-20);
	} else {
		$("#alt-info").width(300);
		$("#alt-info").height(250);				
	}	
}

function retract() 
{
	$("#alt-info").animate({"bottom":-$("#alt-info").outerHeight()});
}

sortRecsByCount = function(recs) 
{
	var list = $.extend(true, [], recs);
	list.sort(function(a,b){return b.count - a.count});
	return list;
}

function clearMultiTips()
{
	$("#map").multiTips({
		pointArray : [],
		labelValue: "",
		mapVariable : _map,
		labelDirection : "top",
		backgroundColor : "#FFFFFF",
		textColor : "#000000",
		pointerColor: "#FFFFFF"
	});	
}

function offsetCenter()
{
	var pt = esri.geometry.geographicToWebMercator(_selectedCollege.geometry);
	if (_bLandscape) _map.centerAt(pt.offset(-(_map.extent.getWidth() / 4), 0));
	else _map.centerAt(pt.offset(0, - (_map.extent.getHeight() / 4)));	
}