/**
 * Created by joseph on 2/2/16.
 */
angular.module('dataCapture')
  .factory('sectionsServices',function($http,$q,$localStorage,$indexedDB){

    var baseUrl = $localStorage.baseUrl;

    var sectionsServices = {
      getAllSectionsFromServer : function(){
        var defer = $q.defer();
        $http.get(baseUrl + '/api/sections.json?paging=false&fields=id')
          .success(function(results){

            defer.resolve(results.sections);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      getIndividualSectionFromServer : function(sectionId){

        var defer = $q.defer();
        $http.get(baseUrl + '/api/sections/'+sectionId+'.json?paging=false&fields=dataSet,id,name,indicators,dataElements[id,valueType,name,created,lastUpdated,optionSet[name,options]]')
          .success(function(results){

            defer.resolve(results);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      }
    };

    return sectionsServices;
  });

