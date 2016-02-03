/**
 * Created by joseph on 1/30/16.
 */
angular.module('dataCapture')
  .factory('dataSetsServices',function($http,$q,$localStorage,$indexedDB){

    var dataSetsServices = {

      getAllDataSetsFromServer :function(baseUrl){

        var defer = $q.defer();
        $http.get(baseUrl + '/api/dataSets.json?paging=false&fields=id')
          .success(function(results){

            defer.resolve(results.dataSets);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      getIndividualDataSetFromServer : function(dataSetId,baseUrl){

        var defer = $q.defer();
        $http.get(baseUrl + '/api/dataSets/'+dataSetId+'.json?fields=id,created,categoryCombo,name,timelyDays,formType,version,periodType,openFuturePeriods,expiryDays,dataEntryForm,dataElements[id,name,displayName,created,valueType,lastUpdated,optionSet[name,options]],organisationUnits[id,name],sections[id,name],indicators')
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
      },saveDataSetDataValue:function(data){
        $indexedDB.openStore('dataValues',function(dataValuesData){
          dataValuesData.upsert(data).then(function(){
            //success
            console.log('id : ' +data.id +' Inserted value : ' + data.dataValue.value);
          },function(){
            //error
          });
        })
      }
    };

    return dataSetsServices;
  });
