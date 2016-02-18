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
      }

    };
    return dataValueSetServices;
  });
