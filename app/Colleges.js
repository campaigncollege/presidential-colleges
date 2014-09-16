Colleges.prototype = new Spreadsheet();

function Colleges()
{
	this.getCollegeByID = function(id)
	{
		return $.grep(this.getRecords(), function(n, i){
					return n[Colleges.FIELDNAME_COLLEGE_ID] == id;
				})[0];		
	}
	
}

Colleges.FIELDNAME_COLLEGE_ID = "id";
Colleges.FIELDNAME_COLLEGE_NAME = "college";
Colleges.FIELDNAME_COLLEGE_X = "x";
Colleges.FIELDNAME_COLLEGE_Y = "y";
Colleges.FIELDNAME_COLLEGE_IMAGE = "logo"
Colleges.FIELDNAME_COLLEGE_COUNT = "count";

