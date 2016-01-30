/**
 * Created by joseph on 1/30/16.
 */
angular.module('dataCapture')
  .factory('dataSetsServices',function($http,$q,$localStorage,$indexedDB){

    var baseUrl = $localStorage.baseUrl;
    console.log(baseUrl);

    var dataSetsServices = {

      getAllDataSetsFromServer :function(){

        var defer = $q.defer();
        $http.get(baseUrl + '/api/dataSets.json?paging=false')
          .success(function(results){

            defer.resolve(results.dataSets);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      getIndividualDataSetFromServer : function(dataSetId){

        var defer = $q.defer();
        $http.get(baseUrl + '/api/dataSets/'+dataSetId+'.json')
          .success(function(results){

            defer.resolve(results);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      getAllData:function(callback){

    },
      getDataSetById:function(){

      }

    };

    return dataSetsServices;
  });
