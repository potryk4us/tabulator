//Build Tabulator
var table = new Tabulator("#example-table", {
    height:311,
    layout:"fitColumns",
    autoColumns:true,
    placeholder:"Awaiting Data, Please Load File",
});

//trigger AJAX load on "Load Data via AJAX" button click
document.getElementById("file-load-trigger").addEventListener("click", function(){
    table.import("csv", ".csv");
});