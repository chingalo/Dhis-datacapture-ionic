/**
 * Created by chingalo on 2/17/16.
 */
angular.module('dataCapture')
  .factory('dataValueSetServices',function($http,$q,$localStorage,$indexedDB){
    var baseUrl = $localStorage.baseUrl;
    var dataValueSetServices = {
      getDataValueSet:function(dataSet,period,orgUnit){
        var defer = $q.defer();
        var parameter = 'dataSet='+dataSet+'&period='+period+'&orgUnit='+orgUnit;
        $http.get(baseUrl + '/api/dataValueSets.json?'+parameter)
          .success(function(results){
            defer.resolve(results.dataValues);
          })
          .error(function(){
            defer.reject();
          });
        return defer.promise;
      },
      getDataValuesFromIndexDb : function(){
        var defer = $q.defer();
        $indexedDB.openStore('dataValues',function(dataValuesData){
          dataValuesData.getAll().then(function(dataValues){
            defer.resolve(dataValues);
          },function(){
            //error get all data values from indexDB
            defer.reject();
          });
        });
        return defer.promise;
      },
      completeOnDataSetRegistrations:function(parameter){

      }

    };
    return dataValueSetServices;
  });
