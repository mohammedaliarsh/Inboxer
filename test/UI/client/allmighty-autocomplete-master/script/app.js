var app = angular.module('app', ['autocomplete']);

// the service that retrieves some movie title from an url
app.factory('MovieRetriever', function ($http, $q, $timeout) {
    // var MovieRetriever = new Object();
    // var clientId = 1,
    //     userId = 1
    // MovieRetriever.getmovies = function (i) {
    //     var moviedata = $q.defer();
    //     var movies;
    //
    //     var movies=["kamesh","kamesh2"]
    //
    //     $timeout(function () {
    //         moviedata.resolve(movies);
    //     }, 1000);
    //
    //     return moviedata.promise
    // }
    //
    // return MovieRetriever;
});

app.controller('MyCtrl', function ($scope, MovieRetriever, $timeout, $http) {
    $scope.movies = [];
    $scope.clId = 1;
    $scope.uId = 10;
    $scope.apiKey = "rkeTJ7rEuZ";
    var apiUrl = 'http://192.168.1.169:3000';
    // $scope.movies = MovieRetriever.getmovies("...");
    // $scope.movies.then(function (data) {
    //     $scope.movies = data;
    // });

    $scope.getmovies = function () {
        return $scope.movies;
    }

    $scope.doSomething = function (typedthings) {
        var data = $.param({
            clId: $scope.clId,
            term: typedthings,
            apiKey: $scope.apiKey,
            uId: $scope.uId
        });
        var config = {
            headers: {
                'Content-Type': 'application/json'
            }
        }
        $http.post('/completeSearch/getSuggestions', data, config)
            .success(function (data, status, headers, config) {
                console.log(data)
            })
            .error(function (data, status, header, config) {
                console.log("########ERROR", data)
            });
        // $timeout(function () {
        //     $scope.movies = ["kamesh", "kamesh2"]
        // }, 10);
        console.log("Do something like reload data with this: " + typedthings);
        // $scope.newmovies = MovieRetriever.getmovies(typedthings);
        // $scope.newmovies.then(function (data) {
        //     $scope.movies = data;
        // });
    }

    $scope.doSomethingElse = function (suggestion) {
        console.log("Suggestion selected: " + suggestion);
    }

});
