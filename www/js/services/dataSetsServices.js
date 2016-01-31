/**
 * Created by joseph on 1/30/16.
 */
angular.module('dataCapture')
  .factory('dataSetsServices',function($http,$q,$localStorage,$indexedDB){

    var baseUrl = $localStorage.baseUrl;

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
        $http.get(baseUrl + '/api/dataSets/'+dataSetId+'.json?fields=name,id,organisationUnits,openFuturePeriods,periodType,formType,dataEntryForm,version')
          .success(function(results){

            defer.resolve(results);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      getAllDataSets:function(){

        var defer = $q.defer();
        $indexedDB.openStore('dataSets',function(dataSetData){
          dataSetData.getAll().then(function(data){
            defer.resolve(data);
          },function(){
            defer.reject('error');
          });
        });

        return defer.promise;
      },
      getDataSetsByOrgUnitId : function(orgUnitId,dataSets){

        var orgUnitDataSets = [];
        dataSets.forEach(function(dataSet){
          var orgUnits = dataSet.organisationUnits;
          orgUnits.forEach(function(orgUnit){
            if(orgUnit.id === orgUnitId){
              orgUnitDataSets.push(dataSet);
            }
          })
        });

        return orgUnitDataSets;
      },getDataSetById:function(dataSetId,dataSets){

        var defer = $q.defer();
        if(dataSetId && dataSets){

          dataSets.forEach(function(dataSet){
            if(dataSet.id == dataSetId){
              defer.resolve(dataSet);
            }
          })
        }else{
          defer.reject('error');
        }
        return defer.promise;
      }
    };

    return dataSetsServices;
  });
