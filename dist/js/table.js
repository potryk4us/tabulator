//define some CSV data
var csvData = `"Name", "Location", "Age"
"Oli", "London", "23"
"Jim", "Mancheser", "53"`;

//define table
var table = new Tabulator("#example-table", {
    data:csvData,
    importFormat:"csv",
    autoColumns:true,
	importReader: "text",
});

