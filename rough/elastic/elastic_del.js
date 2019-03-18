var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: "192.168.1.169" + ':' + "9200",
    // log: 'trace'
});




// for delete a specific index
//give your index in index_name;



// client.indices.delete({
//     index: 'index_name'
// }, function(err, res) {
//
//     if (err) {
//         console.error(err.message);
//     } else {
//         console.log('Indexes have been deleted!');
//     }
// });



//for deleting all

client.indices.delete({
    index: '_all'
}, function(err, res) {

    if (err) {
        console.error(err.message);
    } else {
        console.log('Indexes have been deleted!');
    }
});