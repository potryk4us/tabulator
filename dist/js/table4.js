var table = new Tabulator("#example-table", {
    height:"311px",
    layout:"fitColumns",
    ajaxURL:"/data.json",
    //progressiveLoad:"scroll",
    paginationSize:20,
    placeholder:"No Data Set",
    columns:[
        {title:"Name", field:"name", sorter:"string", width:200},
        {title:"Age", field:"age", sorter:"number"},
        {title:"Gender", field:"gender", sorter:"string"},
        {title:"Height", field:"height", sorter:"number"},
        {title:"Favourite Color", field:"col", sorter:"string"},
        {title:"Date Of Birth", field:"dob", sorter:"date", hozAlign:"center"},
        {title:"Cheese", field:"cheese", formatter:"tickCross", sorter:"boolean"},
    ],
});