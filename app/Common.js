function createPresidentTileList(parent)
{

	$(parent).empty();

	var img,tile,footer,num,title;
	
	$.each(_tablePresidents.getRecords(), function(index, value) {

		tile = $('<li>');
		
		footer = $('<div class="footer"></div>');
		num = $('<div class="num" style="background-color:black">'+value[Presidents.FIELDNAME_PRESIDENT_ID]+'</div>');
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
	
	$.each(_tableColleges.getRecords(), function(index, value) {

		tile = $('<li>');
		
		footer = $('<div class="footer"></div>');
		title = $('<div class="blurb">'+value[Colleges.FIELDNAME_COLLEGE_NAME]+'</div>');	
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
	return $.grep(_tableColleges.getRecords(), function(n, i){
		return $.inArray(n[Colleges.FIELDNAME_COLLEGE_ID], _tableRelationships.getCollegeIDsForPresident(presidentID)) > -1;
	});	
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