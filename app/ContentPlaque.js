function ContentPlaque(div) {

	var _this = this;

	var _div = div;

	var _title = $("<div id='college-title'></div>");
	var _seal = $("<img id='college-seal'/>");
	var _description = $("<div id='college-description'></div>");
	var _prezInfo = $("<div id='prez-info'></div>");

	var _presidents;
	var _notes;

	var divCollegeInfo = $("<div id='college-info'></div>");

	$(divCollegeInfo).append(_seal);
	$(divCollegeInfo).append(_description);

	$(_div).append(_title);
	$(_div).append(divCollegeInfo);
	$(_div).append(_prezInfo);

	this.update = function(collegeID, collegeName, collegeDescription, collegeSeal, presidents, index) {

		$(_title).html(collegeName);
		$(_seal).attr("src", collegeSeal);
		if (presidents.length > 1) {
			collegeDescription = collegeDescription + "<br><br>" + ["One", "Two", "Three", "Four", "Five"][presidents.length-1] + " U.S. presidents have attended "+collegeName+"."
		}
		$(_description).html(collegeDescription);

		_presidents = presidents;

		var div = $("<div class='banner'></div>");
		var ul = $("<ul></ul>");
		var img;
		var li;
		var relationship;
		$(div).append(ul);

		_notes = [];

		$.each(presidents, function(index, value){
			img = $("<img/>");
			$(img).addClass("presidentialPortrait");
			$(img).attr("src", value[Presidents.FIELDNAME_PRESIDENT_URL]);
			li = $("<li></li>");
			$(li).append(img);
			$(li).append("<div style='font-weight:bold'>"+value[Presidents.FIELDNAME_PRESIDENT_NAME]+"</div>");
			relationship = _tableRelationships.getRelationship(value[Presidents.FIELDNAME_PRESIDENT_ID], collegeID);
			var note = relationship[Relationships.FIELDNAME_RELATIONSHIP_NOTE];
			_notes.push(note);
			$(ul).append(li);
		});

		var bogus = $("<div></div>");
		$(bogus).append(div);
		$(bogus).append("<div id='notes'></div>")
		$(_prezInfo).html($(bogus).html());

		if (!index) index = 0;

		if (presidents.length > 1) {
			var slidey = $('.banner').unslider({
				speed: 500,               //  The speed to animate each slide (in milliseconds)
				delay: false,              //  The delay between slide animations (in milliseconds)
				complete: function() {  //  A function that gets called after every slide animation
					var index = $('.banner').find('.dot.active').index();
					$("#notes").html(_notes[index]);
					$(_this).trigger("activatePresident", [_presidents[index]]);
				},
				keys: true,               //  Enable keyboard (left, right) arrow shortcuts
				dots: true,               //  Display dot navigation
			});
			var data = slidey.data("unslider");
			if (index > 0) {
				data.move(index);
			} else {
				$("#notes").html(_notes[index]);	
				$(this).trigger("activatePresident", [_presidents[index]]);
			}
		} else {
			$(".banner li").css("float", "none");
			$("#notes").html(_notes[0]);
			$(this).trigger("activatePresident", [_presidents[index]]);
		}

		

	}

	this.retract = function() {
		$(_div).animate({"bottom":-$("#info").outerHeight()});
	}

	this.show = function() {
		if ($(_div).css("bottom") != "20px") {
			$(_div).animate({"bottom":20});
		}
	}
	
}