/**
 * Created by joseph on 1/30/16.
 */
angular.module('dataCapture')
  .factory('dataSetsServices', function ($http, $q, $localStorage, sqlLiteServices,ionicToast) {

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
      getDataSetById: function (dataSetId, dataSets) {
        var defer = $q.defer();
        if (dataSetId && dataSets) {
          dataSets.forEach(function (dataSet) {
            if (dataSet.id == dataSetId) {
              defer.resolve(dataSet);
            }
          })
        } else {
          defer.reject();
        }
        return defer.promise;
      },
      saveDataSetDataValue: function (data) {
        var status = 1;
        if (data.sync) {
          status = 2;
        }
        sqlLiteServices.insertDataValues('dataValues', data.id, data, status)
          .then(function (data) {
            //success saving data values
            console.log('insertDataValues : ',data.value,'status',status);
          }, function (error) {
            //error
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
        sqlLiteServices.getAllDataByAttribute('dataValues', 'id', String(id))
          .then(function (dataValue) {
            defer.resolve(dataValue);
          }, function () {
            //error get all data values from indexDB
            defer.reject();
          });
        return defer.promise;
      },
      getSavedDataValuesFromIndexDbForSync: function () {
        var defer = $q.defer();
        var value = 1;
        sqlLiteServices.getAllDataByAttribute('dataValues', 'isSync',parseInt(value))
          .then(function (dataValues) {
            defer.resolve(dataValues);
          }, function () {
            defer.reject();
          });
        return defer.promise;
      },
      uploadDataValuesToTheServer: function (formattedDataValues, dataValues) {
        if(formattedDataValues.length > 0){
          ionicToast.show('Uploading data values to the server', 'top', false, 3000);
        }
        var base = $localStorage.baseUrl;
        var i = -1;
        formattedDataValues.forEach(function (data) {
          i++;
          $http.post(base + '/api/dataValues?' + data, null)
            .then(function () {
              dataValues[i].sync = true;
              dataSetsServices.saveDataSetDataValue(dataValues[i]);
            }, function () {
              //error on uploading data set values
            });
        })
      }

    };

    return dataSetsServices;
  });
