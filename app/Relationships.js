Relationships.prototype = new Spreadsheet();

function Relationships()
{
	
	this.getLastRelationship = function(presidentID)
	{

		var lastRelationship = null;
				
		var relationships = $.grep(
			this.getRecords(), 
			function(n, i){
				return n[Relationships.FIELDNAME_RELATIONSHIP_PRESIDENT] == presidentID;
			}
		);
				
		if (relationships.length > 0) {
			lastRelationship = $.grep(relationships, function(n, i){return n[Relationships.FIELDNAME_RELATIONSHIP_CODE] == 1})[0];
		}
	
		return lastRelationship;	
		
	}
	
	this.getRelationship = function(presidentID, collegeID)
	{
		return  $.grep(
			this.getRecords(), 
			function(n, i){
				return n[Relationships.FIELDNAME_RELATIONSHIP_COLLEGE] == collegeID && 
					   n[Relationships.FIELDNAME_RELATIONSHIP_PRESIDENT] == presidentID;
			}
		)[0];
	}
	

	this.getPresidentIDsForCollege = function(collegeID)
	{
		return $.map(
					$.grep(this.getRecords(), function(n, i){
						return n[Relationships.FIELDNAME_RELATIONSHIP_COLLEGE] == collegeID;
					}), 
					function(val, i){return val[Relationships.FIELDNAME_RELATIONSHIP_PRESIDENT]}
					);	
	}	
	
}

Relationships.FIELDNAME_RELATIONSHIP_COLLEGE = "college";
Relationships.FIELDNAME_RELATIONSHIP_PRESIDENT = "president";
Relationships.FIELDNAME_RELATIONSHIP_NOTE = "note";
Relationships.FIELDNAME_RELATIONSHIP_CODE = "code";

