Colleges.prototype = new Spreadsheet();

function Colleges()
{
	this.getCollegeByID = function(id)
	{
		return $.grep(this.getRecords(), function(n, i){
					return n[Colleges.FIELDNAME_COLLEGE_ID] == id;
				})[0];		
	};
	
	this.getOrderedByCount = function()
	{		
		var recs = $.extend(true, [], this.getRecords());
		recs.sort(function(a,b){return b[Colleges.FIELDNAME_COLLEGE_COUNT] - a[Colleges.FIELDNAME_COLLEGE_COUNT];});
		return recs;	
	};

	this.getOrderedByName = function()
	{
		var recs = $.extend(true, [], this.getRecords());
		recs.sort(
			function(a,b){
				var val;
				if (a[Colleges.FIELDNAME_COLLEGE_NAME] < b[Colleges.FIELDNAME_COLLEGE_NAME]) {
					val = -1;
				} else if (a[Colleges.FIELDNAME_COLLEGE_NAME] > b[Colleges.FIELDNAME_COLLEGE_NAME]) {
					val = 1;
				} else {
					val = 0;
				}
				return val;
			}
		);
		return recs;	
	}
	
}

Colleges.FIELDNAME_COLLEGE_ID = "id";
Colleges.FIELDNAME_COLLEGE_NAME = "college";
Colleges.FIELDNAME_COLLEGE_X = "x";
Colleges.FIELDNAME_COLLEGE_Y = "y";
Colleges.FIELDNAME_COLLEGE_DESCRIPTION = "description";
Colleges.FIELDNAME_COLLEGE_IMAGE = "logo";
Colleges.FIELDNAME_COLLEGE_COUNT = "count";

