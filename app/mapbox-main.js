var COLOR_DIM = "#E7E7E7";
var COLOR_FULL = "#FFFFFF";

var LEFT_PANE_WIDTH_ONE_COLUMN = 175;
var LEFT_PANE_WIDTH_TWO_COLUMN = 327;
var LEFT_PANE_WIDTH_THREE_COLUMN = 485;

var ONE_COLUMN_THRESHOLD = 900;
var TWO_COLUMN_THRESHOLD = 960;

var CSV_COLLEGES_URL = "data/colleges.csv";
var CSV_PRESIDENTS_URL = "data/presidents.csv";
var CSV_RELATIONSHIPS_URL = "data/relationships.csv"

jQuery(document).ready(function(){init()});

function init() {
	
	_tableColleges = new Colleges();
	_tableColleges.doLoad(CSV_COLLEGES_URL, null, function(){finishInit()});
	
	_tablePresidents = new Presidents();
	_tablePresidents.doLoad(CSV_PRESIDENTS_URL, null, function(){finishInit()});
	
	_tableRelationships = new Relationships();
	_tableRelationships.doLoad(CSV_RELATIONSHIPS_URL, null, function(){finishInit()});
		
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
		
	createTileList($("#myList"));

	$("ul.tilelist li").mouseover(tile_onMouseOver);
	$("ul.tilelist li").mouseout(tile_onMouseOut);
	$("ul.tilelist li").click(tile_onClick);	

	$(this).resize(handleWindowResize);	
	handleWindowResize();	
	$("#whiteOut").fadeOut()
	
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
	
	var presidents = getPresidentsForCollege(_selectedCollege[Colleges.FIELDNAME_COLLEGE_ID])
	
	$("#college-title").html(_selectedCollege[Colleges.FIELDNAME_COLLEGE_NAME]);
	$("#college-seal").attr("src", _selectedCollege[Colleges.FIELDNAME_COLLEGE_IMAGE]);
	
	var div = $("<div class='banner'></div>");
	var ul = $("<ul></ul>");
	var img;
	var li;
	var relationship;
	$(div).append(ul);
	$.each(presidents, function(index, value){
		img = $("<img/>");
		$(img).addClass("presidentialPortrait");
		$(img).attr("src", value[Presidents.FIELDNAME_PRESIDENT_URL]);
		li = $("<li></li>");
		$(li).append(img);
		$(li).append("<div style='font-weight:bold'>"+value[Presidents.FIELDNAME_PRESIDENT_NAME]+"</div>");
		relationship = _tableRelationships.getRelationship(value[Presidents.FIELDNAME_PRESIDENT_ID], _selectedCollege[Colleges.FIELDNAME_COLLEGE_ID]);
		var note = relationship[Relationships.FIELDNAME_RELATIONSHIP_NOTE];
		if (note) {
			if ($.trim(note) != "") {
				$(li).append("<div class='note'>"+note+"</div>");
			}
		}

		$(ul).append(li);
	});
	var bogus = $("<div></div>");
	$(bogus).append(div);
	/*
	$("#map").multiTips({
		pointArray : [_selectedCollege],
		labelValue: _selectedCollege.attributes[Colleges.FIELDNAME_COLLEGE_NAME],
		mapVariable : _map,
		labelDirection : "top",
		backgroundColor : "#FFFFFF",
		textColor : "#000000",
		pointerColor: "#FFFFFF"
	});
	*/			
	$("#prez-info").html($(bogus).html());
	if ($("#alt-info").css("bottom") != "0px") {
		$("#alt-info").animate({"bottom":0}, function(){
			//offsetCenter();
		});
	} else {
		//offsetCenter();
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
		if (index) data.move(index, function(){});
		data.stop();
	}

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




