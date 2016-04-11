/**
 * Created by chingalo on 2/17/16.
 */
angular.module('dataCapture')
  .factory('dataValueSetServices',function($http,$q,$localStorage,sqlLiteServices,$indexedDB){
    var baseUrl = $localStorage.baseUrl;
    var dataValueSetServices = {
      getDataValueSet:function(dataSet,period,orgUnit){
        var defer = $q.defer();
        var parameter = 'dataSet='+dataSet+'&period='+period+'&orgUnit='+orgUnit;
        $http.get(baseUrl + '/api/dataValueSets.json?'+parameter)
          .success(function(results){
            defer.resolve(results);
          })
          .error(function(){
            defer.reject();
          });
        return defer.promise;
      },
      getDataValuesFromIndexDb : function(){
        var defer = $q.defer();
        sqlLiteServices.getAllData('dataValues').then(function(dataValues){
          defer.resolve(dataValues);
        },function(){
          //error get all data values from indexDB
          defer.reject();
        });
        return defer.promise;
      },
      completeOnDataSetRegistrations:function(parameter){
        var defer = $q.defer();
        $http.post(baseUrl+'/api/completeDataSetRegistrations?'+parameter,null)
          .then(function(){
            //success
            defer.resolve();
          },function(){
            //error
            defer.reject();
          });
        return defer.promise;
      },
      inCompleteOnDataSetRegistrations:function(parameter){
        var defer = $q.defer();
        $http.delete(baseUrl+'/api/completeDataSetRegistrations?'+parameter,null)
          .then(function(){
            //success
            defer.resolve();
          },function(){
            //error
            defer.reject();
          });
        return defer.promise;
      }

    };
    return dataValueSetServices;
  });
