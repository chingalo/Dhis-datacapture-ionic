/**
 * Created by chingalo on 3/16/16.
 */
angular.module('dataCapture')
  .controller('aboutController',function($scope,$localStorage,sqlLiteServices){

    $scope.data = {};
    $scope.data.systemInfo = $localStorage.systemInfo;
    $scope.data.appInfo = {
      Name : 'Dhis 2 Touch',
      Version : '0.17',
      'App revision' : '446589e'

    };
    $scope.data.appStorageStatus = {
      synced : {value : 0,data : false},
      unSynced : {value : 0,data : false}
    };


    $scope.getSystemInfoName = function(key){
      return (key.charAt(0).toUpperCase() + key.slice(1)).replace(/([A-Z])/g, ' $1').trim();
    };

    $scope.reloadLocalStorageStatus = function(){
      getSyncedDataValues();
      getUnSyncedDataValues();
    };
    getSyncedDataValues();
    getUnSyncedDataValues();
    function getSyncedDataValues(){
      var value = 2;
      sqlLiteServices.getAllDataByAttribute('dataValues', 'isSync',parseInt(value))
        .then(function(dataValues){
          $scope.data.appStorageStatus.synced = {
            value : dataValues.length,
            data :true
          }
        },function(){})
    }
    function getUnSyncedDataValues(){
      var value = 1;
      sqlLiteServices.getAllDataByAttribute('dataValues', 'isSync',parseInt(value))
        .then(function(dataValues){
          $scope.data.appStorageStatus.unSynced = {
            value : dataValues.length,
            data :true
          }
        },function(){})
    }

  });

