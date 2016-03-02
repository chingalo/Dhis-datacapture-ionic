/**
 * Created by chingalo on 3/2/16.
 */
angular.module('dataCapture')
  .factory('constantsServices',function($http,$q,$localStorage,$indexedDB){

    var constantsServices = {
      getAllConstantsFromServer : function(baseUrl){
        var defer = $q.defer();
        var fields = "fields=id,value";
        $http.get(baseUrl + '/api/constants.json?paging=false&'+fields)
          .success(function(results){
            defer.resolve(results.constants);
          })
          .error(function(){
            defer.reject('');
          });
        return defer.promise;
      },
      saveConstantIntoIndexDb : function(constant){
        $indexedDB.openStore('constants', function (constantData) {
          constantData.upsert(constant).then(function () {
            //success
          }, function () {
            //error
          });
        })
      },
      deleteAllConstants : function(){
        var defer = $q.defer();
        $indexedDB.openStore('constants', function (reports) {
          reports.clear().then(function () {
            //success
            defer.resolve();
          }, function () {
            //error
            defer.reject();
          })
        });
        return defer.promise;
      },
    };
    return constantsServices;
  });
