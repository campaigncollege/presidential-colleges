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
	$("#info").animate({"bottom":-$("#info").outerHeight()});
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

function constructSlidey(collegeID, index, callBack)
{

	var presidents = getPresidentsForCollege(collegeID);

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
		relationship = _tableRelationships.getRelationship(value[Presidents.FIELDNAME_PRESIDENT_ID], collegeID);
		var note = relationship[Relationships.FIELDNAME_RELATIONSHIP_NOTE];
		if (note) {
			if ($.trim(note) !== "") {
				$(li).append("<div class='note'>"+note+"</div>");
			}
		}

		$(ul).append(li);
	});
	var bogus = $("<div></div>");
	$(bogus).append(div);
	
	$("#prez-info").html($(bogus).html());
	if ($("#info").css("bottom") != "0px") {
		$("#info").animate({"bottom":0}, function(){
			callBack();
		});
	} else {
		setTimeout(callBack, 200);
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