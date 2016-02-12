/**
 * Created by joseph on 2/2/16.
 */
angular.module('dataCapture')
  .factory('sectionsServices',function($http,$q,$localStorage,$indexedDB){


    var sectionsServices = {
      getAllSectionsFromServer : function(baseUrl){
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
      getIndividualSectionFromServer : function(sectionId,baseUrl){

        var defer = $q.defer();
        $http.get(baseUrl + '/api/sections/'+sectionId+'.json?paging=false&fields=dataSet,id,name,indicators[:all],dataElements[id,name,categoryCombo[:all],displayName,created,valueType,lastUpdated,optionSet[name,options[name,id]]')
          .success(function(results){

            defer.resolve(results);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },getAllDataEntryFormSection : function(){
        var defer = $q.defer();
        $indexedDB.openStore('sections',function(sectionsData){
          sectionsData.getAll().then(function(data){
            defer.resolve(data);
          },function(){
            defer.reject('error');
          });
        });

        return defer.promise;
      }
    };

    return sectionsServices;
  });

