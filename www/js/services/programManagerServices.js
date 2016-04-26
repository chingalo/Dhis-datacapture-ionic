/**
 * Created by chingalo on 4/26/16.
 */
angular.module('dataCapture')

  .factory('programManagerServices', function ($q,$http,sqlLiteServices) {

    var programManagerServices = {
      getAllProgramsFromServer : function(baseUrl){
        var defer = $q.defer();
        var fields = "fields=id,name,categoryCombo[id,name],organisationUnits[id,name],userRoles[id],programIndicators[id],programStages[name,programStageDataElements[id,displayInReports,compulsory,sortOrder,dataElement[id,name,displayName,description,formName,attributeValues[value,attribute[name]],valueType,optionSet[name,options[name,id]],categoryCombo[id,name,categoryOptionCombos[id,name]]]]]";
        $http.get(baseUrl + '/api/programs.json?paging=false&'+fields)
          .success(function(results){
            defer.resolve(results.programs);
          })
          .error(function(){
            defer.reject();
          });
        return defer.promise;
      },
      getAllPrograms : function(){
        var defer = $q.defer();
        sqlLiteServices.getAllData('programs').
        then(function(programs){
          defer.resolve(programs);
        },function(){
          defer.reject();
        });
        return defer.promise;
      }
    };
    return programManagerServices;

  });
