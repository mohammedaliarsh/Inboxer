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
    $scope.clId = 2;
    $scope.uId = 12;
    $scope.apiKey = "H1MpkQSNu-";
    var apiUrl = 'http://192.168.1.169:3000';
    // $scope.movies = MovieRetriever.getmovies("...");
    // $scope.movies.then(function (data) {
    //     $scope.movies = data;
    // });


    function sortWithPrefix(list, prefix) {
        var l1 = []
        var l2 = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].startsWith(prefix)) {
                l1.push(list[i])
            }
            else {
                l2.push(list[i])
            }
        }
    }


    var arr = ["Bell chance", "chicken run", "childen of lesser god"]

    $scope.getmovies = function () {
        return $scope.movies;
    }

    $scope.doSomething = function (typedthings) {
        $scope.termIds = {}
        var data = {
            clId: $scope.clId,
            term: typedthings,
            apiKey: $scope.apiKey,
            uId: $scope.uId
        };
        $http({
            method: 'POST',
            url: apiUrl + '/completeSearch/getSuggestions',
            data: data
        }).then(
            function successCallBack(res) {
                $scope.movies = []
                for (var i = 0; i < res.data.length; i++) {
                    $scope.termIds[res.data[i].term] = res.data[i].id;
                    $scope.movies.push(res.data[i].term)
                }
                console.log(res.data)
            },
            function errorCallBack(res) {
                console.log("#######ERROR", res)
            }
        );
    }

    $scope.doSomethingElse = function (suggestion) {
        console.log("clicked", suggestion, $scope.termIds[suggestion])
        var data = {
            clId: $scope.clId,
            term: suggestion,
            id: $scope.termIds[suggestion],
            apiKey: $scope.apiKey,
            uId: $scope.uId
        };
        $http({
            method: 'POST',
            url: apiUrl + '/completeSearch/updateUserSearched',
            data: data
        }).then(
            function successCallBack(res) {
                console.log(res.data)
            },
            function errorCallBack(res) {
                console.log("#######ERROR", res)
            }
        );
    }

});
