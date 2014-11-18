dojo.require("esri.arcgis.utils");
dojo.require("esri.map");

/******************************************************
***************** begin config section ****************
*******************************************************/

var BASEMAP_SERVICE_URL = "http://tiles.arcgis.com/tiles/nGt4QxSblgDfeJn9/arcgis/rest/services/DGCM_2Msmaller_BASE/MapServer";

var CSV_COLLEGES_URL = "data/colleges.csv";
var CSV_PRESIDENTS_URL = "data/presidents.csv";
var CSV_RELATIONSHIPS_URL = "data/relationships.csv";

/******************************************************
***************** end config section ******************
*******************************************************/

var COLOR_DIM = "#E7E7E7";
var COLOR_FULL = "#FFFFFF";

var LEFT_PANE_WIDTH_ONE_COLUMN = 175;
var LEFT_PANE_WIDTH_TWO_COLUMN = 327;
var LEFT_PANE_WIDTH_THREE_COLUMN = 485;

var ONE_COLUMN_THRESHOLD = 900;
var TWO_COLUMN_THRESHOLD = 960;

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

dojo.addOnLoad(function() {_dojoReady = true; init();});
jQuery(document).ready(function() {_jqueryReady = true; init();});

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
	
	_homeExtent = new esri.geometry.Extent({
		xmin:-12672646,
		ymin:2661230,
		xmax:-8861802,
		ymax:7372197,
		spatialReference:{wkid:102100}
	});						
		
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

	_map = new esri.Map("map",
						{
							slider: false
						});						
	_map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer(BASEMAP_SERVICE_URL));
	if(_map.loaded){
		finishInit();
	} else {
		dojo.connect(_map,"onLoad",function(){
			finishInit();
		});
	}

	_tableColleges = new Colleges();
	_tableColleges.doLoad(CSV_COLLEGES_URL, null, function(){finishInit();});
	
	_tablePresidents = new Presidents();
	_tablePresidents.doLoad(CSV_PRESIDENTS_URL, null, function(){finishInit();});
	
	_tableRelationships = new Relationships();
	_tableRelationships.doLoad(CSV_RELATIONSHIPS_URL, null, function(){finishInit();});
			
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
		
	_map.addLayer(createCollegesLayer());
	
	dojo.connect(_map.graphics, "onMouseOver", layer_onMouseOver);
	dojo.connect(_map.graphics, "onMouseOut", layer_onMouseOut);
	dojo.connect(_map.graphics, "onClick", layer_onClick);	
	
	// click action on the map where there's no graphic 
	// causes a deselect.

	dojo.connect(_map, 'onClick', function(event){
		if (event.graphic === null) {
			_selectedCollege = null;
			retract();
			clearMultiTips();
		}
	});
	
	createTileList($("#myList"));
	
	$("ul.tilelist li").mouseover(tile_onMouseOver);
	$("ul.tilelist li").mouseout(tile_onMouseOut);
	$("ul.tilelist li").click(tile_onClick);	
	
	handleWindowResize();
	
	setTimeout(function(){
		_map.setExtent(_homeExtent, true);
		setTimeout(function(){$("#whiteOut").fadeOut();},500);
	}, 500);
	
}


function layer_onMouseOver(event) 
{
	if (_isMobile) return;
	var graphic = event.graphic;
	_map.setMapCursor("pointer");
	$("#hoverInfo").html("<b>"+graphic.attributes[Colleges.FIELDNAME_COLLEGE_NAME]+
						"</b> ("+graphic.attributes[Colleges.FIELDNAME_COLLEGE_COUNT]+")");
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
	}
					
	postSelection($.inArray(president[Presidents.FIELDNAME_PRESIDENT_ID], _tableRelationships.getPresidentIDsForCollege(_selectedCollege.attributes[Colleges.FIELDNAME_COLLEGE_ID])));
	
}

function postSelection(index)
{
	
	retractNoCollege();
	
	var presidents = getPresidentsForCollege(_selectedCollege.attributes[Colleges.FIELDNAME_COLLEGE_ID]);
	
	$("#college-title").html(_selectedCollege.attributes[Colleges.FIELDNAME_COLLEGE_NAME]);
	$("#college-seal").attr("src", _selectedCollege.attributes[Colleges.FIELDNAME_COLLEGE_IMAGE]);
	
	constructSlidey(_selectedCollege.attributes[Colleges.FIELDNAME_COLLEGE_ID], index, function(){offsetCenter();});
	
	$("#map").multiTips({
		pointArray : [_selectedCollege],
		labelValue: _selectedCollege.attributes[Colleges.FIELDNAME_COLLEGE_NAME],
		mapVariable : _map,
		labelDirection : "top",
		backgroundColor : "#FFFFFF",
		textColor : "#000000",
		pointerColor: "#FFFFFF"
	});			

}

function selectLastCollege(presidentID)
{
	var lastRelationship = _tableRelationships.getLastRelationship(presidentID);
	if (!lastRelationship) return null;
	
	return $.grep(_map.graphics.graphics, function(n, i){
		if (!n.attributes) return false;
		return n.attributes[Colleges.FIELDNAME_COLLEGE_ID] == lastRelationship[Relationships.FIELDNAME_RELATIONSHIP_COLLEGE];
	})[0];

}

function createCollegesLayer()
{
	var layerIcons = new esri.layers.GraphicsLayer();

	var recs = sortRecsByCount(_tableColleges.getRecords());	
	$.each(recs, function(index, value) {
		var pt = new esri.geometry.Point(value[Colleges.FIELDNAME_COLLEGE_X], value[Colleges.FIELDNAME_COLLEGE_Y]);

		var sym = new esri.symbol.SimpleMarkerSymbol(
				esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 20+10*(parseInt(value[Colleges.FIELDNAME_COLLEGE_COUNT])),
				new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,255,255,0]), 2),
				new dojo.Color([0,255,255,0])
			);

		var iconSym = new esri.symbol.PictureMarkerSymbol(
					"resources/icons/green-circle.png", 
					28+10*parseInt(value[Colleges.FIELDNAME_COLLEGE_COUNT]), 
					28+10*parseInt(value[Colleges.FIELDNAME_COLLEGE_COUNT])
				);
		layerIcons.add(new esri.Graphic(pt, iconSym, value));
		_map.graphics.add(new esri.Graphic(pt, sym, value));
	});

	return layerIcons;	
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
	
	_map.resize();
	
}

function sortRecsByCount(recs) 
{
	var list = $.extend(true, [], recs);
	list.sort(function(a,b){return b.count - a.count;});
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
	 _map.centerAt(pt.offset(0, - (_map.extent.getHeight() / 4)));
}