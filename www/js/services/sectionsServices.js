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
        var field = "fields=dataSet,id,name,indicators[id,name,indicatorType[factor],denominatorDescription,numeratorDescription,numerator,denominator],dataElements[id,name,attributeValues[value],categoryCombo[id,name,categoryOptionCombos[id,name]],displayName,description,valueType,optionSet[name,options[name,id]]";
        $http.get(baseUrl + '/api/sections/'+sectionId+'.json?'+field)
          .success(function(results){
            defer.resolve(results);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      getAllDataEntryFormSection : function(){
        var defer = $q.defer();
        $indexedDB.openStore('sections',function(sectionsData){
          sectionsData.getAll().then(function(data){
            defer.resolve(data);
          },function(){
            defer.reject('error');
          });
        });
        return defer.promise;
      },
      deleteAllSections: function(){
        var defer = $q.defer();
        $indexedDB.openStore('sections', function (sections) {
          sections.clear().then(function () {
            //success
            defer.resolve();
          }, function () {
            //error
            defer.reject();
          })
        });
        return defer.promise;
      }
    };
    return sectionsServices;
  });

