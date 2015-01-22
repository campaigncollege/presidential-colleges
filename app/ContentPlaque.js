function ContentPlaque(div) {

	var _div = div;

	var _title = $("<div id='college-title'></div>");
	var _seal = $("<img id='college-seal'/>");
	var _prezInfo = $("<div id='prez-info'></div>");

	var _notes;

	var divCollegeInfo = $("<div id='college-info'></div>");

	$(divCollegeInfo).append(_seal);

	$(_div).append(_title);
	$(_div).append(divCollegeInfo);
	$(_div).append(_prezInfo);

	this.update = function(collegeID, collegeName, collegeSeal, presidents, index) {

		$(_title).html(collegeName);
		$(_seal).attr("src", collegeSeal);

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
			/*
			if (note) {
				if ($.trim(note) !== "") {
					$(li).append("<div class='note'>"+note+"</div>");
				}
			}
			*/
			$(ul).append(li);
		});

		var bogus = $("<div></div>");
		$(bogus).append(div);
		$(bogus).append("<div id='notes'>This is where the notes will go, and it will scroll!  Even if the content is very, very long.  I mean...really, REALLY long.  It.  Will.  Still. Scroll!  (The quick brown fox jumped over the lazy dog.)</div>")
		$(_prezInfo).html($(bogus).html());

		if (presidents.length > 1) {
			var slidey = $('.banner').unslider({
				speed: 500,               //  The speed to animate each slide (in milliseconds)
				delay: false,              //  The delay between slide animations (in milliseconds)
				complete: function() {},  //  A function that gets called after every slide animation
				keys: true,               //  Enable keyboard (left, right) arrow shortcuts
				dots: true,               //  Display dot navigation
			});
			var data = slidey.data("unslider");
			if (index) data.move(index, function(){});
			data.stop();
		} else {
			$(".banner li").css("float", "none");
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