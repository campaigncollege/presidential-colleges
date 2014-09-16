function createTileList(parent)
{
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
}

function getPresidentsForCollege(collegeID)
{
	return $.grep(_tablePresidents.getRecords(), function(n, i){
		return $.inArray(n[Presidents.FIELDNAME_PRESIDENT_ID], _tableRelationships.getPresidentIDsForCollege(collegeID)) > -1;
	});	
}

function retract() 
{
	$("#alt-info").animate({"bottom":-$("#alt-info").outerHeight()});
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
