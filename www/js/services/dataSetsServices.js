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
        $http.get(baseUrl + '/api/dataSets/'+dataSetId+'.json?fields=id,created,name,timelyDays,formType,version,periodType,openFuturePeriods,expiryDays,dataEntryForm,dataElements[id,name,displayName,created,valueType,lastUpdated,optionSet[name,options],categoryCombo[:all]],organisationUnits[id,name],sections[id,name],indicators,categoryCombo[id,name,displayName,categoryOptionCombos[id,name]]')
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
            defer.reject();
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
          defer.reject();
        }
        return defer.promise;
      },
      saveDataSetDataValue:function(data){
        $indexedDB.openStore('dataValues',function(dataValuesData){
          dataValuesData.upsert(data).then(function(){
            //success
            console.log('update or add data values' + data.id);
          },function(){
            //error
          });
        })
      },
      getDataValueById : function(id){
        var defer = $q.defer();
        $indexedDB.openStore('dataValues',function(dataValuesData){
            dataValuesData.getAll().then(function(dataValues){
              var data = null;
              dataValues.forEach(function(dataValue){
                if(dataValue.id == id){
                  data = dataValue;
                }
              });
              defer.resolve(data);
            },function(){
              //error get all data values from indexDB
              defer.reject();
            });
        });
        return defer.promise;
      },
      getSavedDataValuesFromIndexDbForSync : function(){
        var defer = $q.defer();
        $indexedDB.openStore('dataValues',function(dataValuesData){
          dataValuesData.getAll().then(function(dataValues){
            var data = [];
            dataValues.forEach(function(dataValue){
              if(! dataValue.sync){
                data.push(dataValue)
              }
            });
            //success
            defer.resolve(data);
          },function(){
            //error get all data values from indexDB
            defer.reject();
          });
        });
        return defer.promise;
      },
      uploadDataValuesToTheServer : function(formattedDataValues,dataValues){
        var base = $localStorage.baseUrl;
        var i = -1;
        formattedDataValues.forEach(function(data){
          i ++;
          $http.post(base+'/api/dataValues?'+data,null)
            .then(function(){
              dataValues[i].sync = true;
              $indexedDB.openStore('dataValues',function(dataValuesData){
                dataValuesData.upsert(dataValues[i]).then(function(){
                  //success
                },function(){
                  //error
                });
              });
            },function(){
              //error on uploading data set values
            });
        })
      }


    };

    return dataSetsServices;
  });
