function Spreadsheet() {
	
	var _recs;

	var _fetchTime;
	var _parseTime;
	var _loadTime;
	
	this.doLoad= function(url, onFetch, onParse) 
	{
		var time1 = new Date();
			
		$.ajax({
		  type: 'GET',
		  url: url,
		  cache: false,
		  success: function(text) {	
			  onFetch();
			  setTimeout(function(){
				_fetchTime = (new Date() - time1) / 1000;
				var before = new Date();
				var serviceTornadoes = new CSVService();
				serviceTornadoes.process(text);
				_recs = new RecordParser().getRecs(serviceTornadoes.getLines());
				_parseTime = (new Date() - before) / 1000;
				_loadTime = (new Date() - time1) / 1000;
				onParse();
			  }, 100);
		  }
		});	
	}	

	this.getFetchTime = function()
	{
		return _fetchTime;
	}
	
	this.getParseTime = function()
	{
		return _parseTime;
	}
	
	this.getLoadTime = function()
	{
		return _loadTime;
	}
	
	this.getRecords = function()
	{
		return _recs;
	}
	
}