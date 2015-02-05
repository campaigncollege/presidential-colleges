function createPresidentTileList(parent)
{

	$(parent).empty();

	var img,tile,footer,num,title;
	
	$.each(_tablePresidents.getRecords(), function(index, value) {

		tile = $('<li>');
		
		footer = $('<div class="footer"></div>');
		num = $('<div class="num">'+value[Presidents.FIELDNAME_PRESIDENT_ID]+'</div>');
		title = $('<div class="blurb">'+value[Presidents.FIELDNAME_PRESIDENT_NAME]+'</div>');	
		$(footer).append(num);		
		$(footer).append(title);
		$(tile).append(footer);			

		img = $('<img src="'+value[Presidents.FIELDNAME_PRESIDENT_URL]+'">');
		$(tile).append(img);
		
		$(parent).append(tile);
		
	});

	$("ul.tilelist li").mouseover(tile_onMouseOver);
	$("ul.tilelist li").mouseout(tile_onMouseOut);
	$("ul.tilelist li").click(tilePresident_onClick);

}

function createCollegeTileList(parent)
{


	$(parent).empty();

	var img,tile,footer,title;
	
	$.each(_tableColleges.getOrderedByName(), function(index, value) {

		tile = $('<li>');
		
		footer = $('<div class="footer"></div>');
		title = $('<div class="blurb" style="margin-top:10px">'+value[Colleges.FIELDNAME_COLLEGE_NAME]+'</div>');	
		$(footer).append(title);
		$(tile).append(footer);			

		img = $('<img src="'+value[Colleges.FIELDNAME_COLLEGE_IMAGE]+'">');
		$(tile).append(img);
		
		$(parent).append(tile);
		
	});

	$("ul.tilelist li").mouseover(tile_onMouseOver);
	$("ul.tilelist li").mouseout(tile_onMouseOut);
	$("ul.tilelist li").click(tileCollege_onClick);

}

function getPresidentsForCollege(collegeID)
{
	return $.grep(_tablePresidents.getRecords(), function(n, i){
		return $.inArray(n[Presidents.FIELDNAME_PRESIDENT_ID], _tableRelationships.getPresidentIDsForCollege(collegeID)) > -1;
	});	
}

function getCollegesForPresident(presidentID)
{

	var colleges = $.grep(_tableColleges.getRecords(), function(n, i){
		return $.inArray(n[Colleges.FIELDNAME_COLLEGE_ID], _tableRelationships.getCollegeIDsForPresident(presidentID)) > -1;
	});	

	// this part is tedious -- sorting for code.  this will tell us -- for presidents who attended more than
	// on college -- the sequence of colleges.

	colleges.sort(function(a, b) {

		var relationShipA = $.grep(
			_tableRelationships.getRecords(), 
			function(n,i){
				return n[Relationships.FIELDNAME_RELATIONSHIP_PRESIDENT] == presidentID && n[Relationships.FIELDNAME_RELATIONSHIP_COLLEGE] == a[Colleges.FIELDNAME_COLLEGE_ID];
			}
		)[0];

		var codeA = relationShipA[Relationships.FIELDNAME_RELATIONSHIP_CODE];

		var relationShipB = $.grep(
			_tableRelationships.getRecords(), 
			function(n,i){
				return n[Relationships.FIELDNAME_RELATIONSHIP_PRESIDENT] == presidentID && n[Relationships.FIELDNAME_RELATIONSHIP_COLLEGE] == b[Colleges.FIELDNAME_COLLEGE_ID];
			}
		)[0];

		var codeB = relationShipB[Relationships.FIELDNAME_RELATIONSHIP_CODE];

		return codeA > codeB;

	});

	return colleges;

}

function retract() 
{
	_contentPlaque.retract();
}

function showNoCollege(name)
{
	$("#no-college").html("<span style='font-weight:bold'>"+name+"</span> did not attend a college or university.");
	$("#no-college").animate({"bottom": 20});
}

function retractNoCollege()
{
	$("#no-college").animate({"bottom":-$("#no-college").outerHeight()});
}