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

app.controller('MyCtrl2', function ($scope, MovieRetriever, $timeout, $http) {
        $scope.movies = [];
        $scope.clId = 2;
        $scope.uId = 12;
        $scope.apiKey = "";
        var apiUrl;
        var maxSug = 6;
        // $scope.movies = MovieRetriever.getmovies("...");
        // $scope.movies.then(function (data) {
        //     $scope.movies = data;
        //some test
        // });
        $scope.targets = [];
        $scope.saveText = "save targets"

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


        var getConfig = function () {
            $http({
                method: 'POST',
                url: '/completeSearch/getConfig',
                data: {}
            }).then(
                function successCallBack(response) {
                    $scope.config = response.data;
                    apiUrl = $scope.config.url;
                },
                function errorCallBack(res) {
                    console.log("#######ERROR", res)
                }
            );
        }
        getConfig();
        $scope.getmovies = function () {
            return $scope.movies;
        };

        var getSugFromMaster = function (prefix, callback) {
            $http({
                method: 'POST',
                url: apiUrl + '/completeSearch/getMasterTerms',
                data: {term: prefix}
            }).then(
                function successCallBack(response) {
                    if (response.data == 401) {
                        callback([])
                        return;
                    }
                    var termsMaster = response.data;
                    // var termsMaster = [
                    //     {id: 1, term: "software"},
                    //     {id: 2, term: "tech"},
                    //     {id: 3, term: "cyber security"},
                    //     {id: 4, term: "entertainment"},
                    //     {id: 5, term: "movies"},
                    //     {id: 6, term: "movie songs"},
                    //     {id: 7, term: "tollywood"},
                    //     {id: 8, term: "sports"},
                    //     {id: 9, term: "cricket"},
                    //     {id: 10, term: "tennis"},
                    //     {id: 11, term: "selenium"},
                    // ];
                    var res = [];
                    for (var i = 0; i < termsMaster.length; i++) {
                        res.push(termsMaster[i]);
                    }
                    callback(res)
                },
                function errorCallBack(res) {
                    console.log("#######ERROR", res)
                }
            );
        };

        var isExisted = function (array, term) {
            var ret = false
            for (var i = 0; i < array.length; i++) {
                if (array[i] == term) {
                    ret = true;
                }
            }
            return ret;
        }
        var isExistedInArrayOfObj = function (arraOfObj, key, term) {
            var ret = false
            for (var i = 0; i < arraOfObj.length; i++) {
                if (arraOfObj[i][key] == term) {
                    ret = true;
                }
            }
            return ret;
        }
        $scope.typing = function (typedthings) {
            console.log("typed", typedthings)
            $scope.termIds = {}
            var data = {
                clId: $scope.clId,
                apiKey: $scope.apiKey,
                past: $scope.targets,
                term: typedthings,
                uId: $scope.uId
            };
            $http({
                method: 'POST',
                url: apiUrl + '/completeSearch/getSimilarity',
                data: data
            }).then(
                function successCallBack(res) {
                    $scope.movies = []
                    if (res.data == 401) {
                        return;
                    }
                    for (var i = 0; i < res.data.length; i++) {
                        var isExistedInTargets = isExistedInArrayOfObj($scope.targets, "term", res.data[i].term)
                        if (!isExistedInTargets) {
                            $scope.termIds[res.data[i].term] = res.data[i].id;
                            $scope.movies.push(res.data[i].term);
                        }
                    }
                    console.log("searchSug--", $scope.movies);
                    if ($scope.movies.length < maxSug) {
                        getSugFromMaster(typedthings, function (masterSug) {
                            for (var i = 0; i < masterSug.length; i++) {
                                var isExistedInMovies = isExisted($scope.movies, masterSug[i].term);
                                var isExistedInTargets = isExistedInArrayOfObj($scope.targets, "term", masterSug[i].term)
                                if ((!isExistedInMovies) && (!isExistedInTargets)) {
                                    $scope.termIds[masterSug[i].term] = masterSug[i].id;
                                    $scope.movies.push(masterSug[i].term);
                                }
                            }
                            console.log("finalSug--", $scope.movies);
                        })
                    }
                    else
                        console.log("finalSug--", $scope.movies);
                },
                function errorCallBack(res) {
                    console.log("#######ERROR", res)
                }
            );
        }

        $scope.selectedSuggestion = function (suggestion) {
            console.log("selected Suggestion", suggestion, $scope.termIds[suggestion]);
            $scope.targets.push({
                tId: $scope.termIds[suggestion],
                term: suggestion
            })
            $scope.result = "";
            $scope.movies = [];
        }

        $scope.targetsFinalyzed = function () {
            console.log("targets finalyzed", $scope.targets);
            for (var i = 0; i < $scope.targets.length; i++) {
                $scope.targets[i].desc = "desc_" + $scope.targets[i].term;
            }
            var data = {
                clId: $scope.clId,
                apiKey: $scope.apiKey,
                term: $scope.targets,
                uId: $scope.uId
            };
            $http({
                method: 'POST',
                url: apiUrl + '/completeSearch/updateSimilarTerms',
                data: data
            }).then(
                function successCallBack(res) {
                    console.log(res.data)
                    $scope.targets = [];
                    $scope.movies = [];
                },
                function errorCallBack(res) {
                    console.log("#######ERROR", res)
                }
            );
        }

    }
);
