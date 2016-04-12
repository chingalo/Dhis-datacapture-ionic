/**
 * Created by joseph on 1/30/16.
 */
angular.module('dataCapture')
  .factory('dataSetsServices', function ($http, $q, $localStorage, sqlLiteServices, $indexedDB) {

    var dataSetsServices = {

      getAllDataSetsFromServer: function (baseUrl) {
        var defer = $q.defer();
        var field = "fields=id,name,timelyDays,formType,version,periodType,openFuturePeriods,expiryDays,dataElements[id,name,displayName,description,formName,attributeValues[value,attribute[name]],valueType,optionSet[name,options[name,id]],categoryCombo[id,name,categoryOptionCombos[id,name]]],organisationUnits[id,name],sections[id,name],indicators[id,name,indicatorType[factor],denominatorDescription,numeratorDescription,numerator,denominator],categoryCombo[id,name,displayName,categoryOptionCombos[id,name]]";
        $http.get(baseUrl + '/api/dataSets.json?paging=false&' + field)
          .success(function (results) {
            defer.resolve(results.dataSets);
          })
          .error(function () {
            defer.reject('error');
          });
        return defer.promise;
      },
      getAllDataSets: function () {
        var defer = $q.defer();
        sqlLiteServices.getAllData('dataSets').then(function (data) {
          defer.resolve(data);
        }, function () {
          defer.reject();
        });
        return defer.promise;
      },
      deleteAllDataSets: function () {
        var defer = $q.defer();
        sqlLiteServices.dropTable('dataSets').then(function () {
          //success
          defer.resolve();
        }, function () {
          //error
          defer.reject();
        });
        return defer.promise;
      },
      getDataSetsByOrgUnitId: function (orgUnitId, dataSets) {
        var orgUnitDataSets = [];
        dataSets.forEach(function (dataSet) {
          var orgUnits = dataSet.organisationUnits;
          orgUnits.forEach(function (orgUnit) {
            if (orgUnit.id === orgUnitId) {
              orgUnitDataSets.push(dataSet);
            }
          })
        });
        return orgUnitDataSets;
      },
        getDataSetById:function(dataSetId,dataSets){
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
      saveDataSetDataValue: function (data) {

        var status = 0;
        if(data.sync){
          status = 1;
        }
        sqlLiteServices.insertDataValues('dataValues',data.id,data,status)
          .then(function (data) {
            //success saving data values
            alert('Saving :' + JSON.stringify(data));

          }, function (erro) {
            //error
            alert('Saving error :' + JSON.stringify(erro));
          });
      },
      deleteAllDataValues: function () {
        var defer = $q.defer();
        sqlLiteServices.dropTable('dataValues').then(function () {
          //success
          defer.resolve();

        }, function () {
          //error
          defer.reject();
        });
        return defer.promise;
      },
      getDataValueById: function (id) {
        var defer = $q.defer();
        var result = null;
        sqlLiteServices.getAllDataByAttribute('dataValues','id',id).then(function (dataValue) {
          result = dataValue;
          alert('inside service ' + id + '\nData values : ' +JSON.stringify(dataValue));
          if(dataValue.length > 0){
            result = dataValue[0]
          }
          defer.resolve(result);
        }, function (err) {
          //error get all data values from indexDB
          defer.reject();
        });
      },
      getSavedDataValuesFromIndexDbForSync: function () {
        var defer = $q.defer();
        var attribute = 'isSync';
        var value = 0;
        sqlLiteServices.getAllDataByAttribute('dataValues',attribute,value)
          .then(function (dataValues){
            alert('prepare ' + dataValues.length + " data values to sync");
            defer.resolve(dataValues);
        },function(){
            defer.reject();
          });
        return defer.promise;
      },
      uploadDataValuesToTheServer: function (formattedDataValues, dataValues) {
        var base = $localStorage.baseUrl;
        var i = -1;
        formattedDataValues.forEach(function (data) {
          i++;
          $http.post(base + '/api/dataValues?' + data, null)
            .then(function () {
              dataValues[i].sync = true;
              $indexedDB.openStore('dataValues', function (dataValuesData) {
                dataValuesData.upsert(dataValues[i]).then(function () {
                  //success
                }, function () {
                  //error
                });
              });
            }, function () {
              //error on uploading data set values
            });
        })
      }

    };

    return dataSetsServices;
  });
