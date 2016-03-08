/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('settingController',function($scope,ionicToast,$ionicHistory,$state,
                                           $ionicModal,dataSetsServices,$indexedDB,
                                           sectionsServices,reportServices,
                                           userServices,constantsServices,
                                           $localStorage,synchronizationServices){

    function progressMessage(message){
      ionicToast.show(message, 'top', false, 2500);
    }
    $localStorage.appSetting = {
      synchronization : {
        time : {type : getSyncTime()?$localStorage.syncTimeType:'seconds',value : getSyncTime()?getSyncTime():60},
        preference : 'mobile'
      },
      defaultForm : {
        sorting : 'name'
      }
    };
    $scope.data = $localStorage.appSetting;
    $scope.data.formLabelPreference = $localStorage.formLabelPreference;

    $scope.$watch('data.defaultForm.sorting',function(){
      $localStorage.appSetting = $scope.data;
    });
    $scope.$watch('data.synchronization.preference',function(){
      $localStorage.appSetting = $scope.data;
    });
    $scope.$watch('data.synchronization.time.type',function(){
      $localStorage.appSetting = $scope.data;
      changeSyncTime();
    });
    $scope.$watch('data.synchronization.time.value',function(){
      $localStorage.appSetting = $scope.data;
      changeSyncTime();
    });

    //todo handling placeholder options
    $scope.$watch('data.formLabelPreference.label',function(){
      $localStorage.formLabelPreference = $scope.data.formLabelPreference;
    });

    function changeSyncTime(){
      var type = $scope.data.synchronization.time.type;
      var value = $scope.data.synchronization.time.value;
      //$localStorage.appSetting = $scope.data.synchronization;
      var newValue = 60*1000;
      switch (type){
        case 'seconds':
          newValue = value * 1000;
          break;
        case 'minutes':
          newValue = value * 60  * 1000;
          break;
        case 'hours':
          newValue = value * 60 * 60 * 1000;
          break;
        default:
          newValue = 60*1000;
      }
      $localStorage.syncTime = newValue;
      $localStorage.syncTimeType = type;
      synchronizationServices.stopSync();
      synchronizationServices.startSync(newValue);
    }
    function getSyncTime(){
      var newValue = null;
      switch($localStorage.syncTimeType){
        case 'seconds':
          newValue = $localStorage.syncTime/1000;
          break;
        case 'minutes':
          newValue = $localStorage.syncTime/(60  * 1000);
          break;
        case 'hours':
          newValue = $localStorage.syncTime/(60 * 60 * 1000);
          break;
      }
      return newValue;
    }

    $scope.resetDataButtonActionConfirmation = function(type){
      $scope.data.resetDataOption = type;
      $scope.modal.show();
    };
    $ionicModal.fromTemplateUrl('templates/dataResetConfirmation.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $scope.close = function() {
      $scope.modal.hide();
    };
    $scope.confirmDataReset = function(){
      $scope.close();
      switch ($scope.data.resetDataOption){
        case 'allData':
          deleteAllData();
          break;
        case 'dataEntryValues':
          deleteAllDtaValue();
          break;
      }
    };

    function deleteAllDtaValue(){
      $scope.data.loading = true;
      dataSetsServices.deleteAllDataValues()
        .then(function(){
          $scope.data.loading = false;
          progressMessage("Data Entry values has been reset successfully")
        },function(){
          $scope.data.loading = false;
        })
    }
    function deleteAllData(){
      $indexedDB.deleteDatabase().then(function(){
        logOutUser();
      });
    }

    function logOutUser(){
      $scope.data.loading = true;
      delete $localStorage.loginUser;
      delete $localStorage.dataEntryData;
      delete $localStorage.loginUserData;
      delete $localStorage.selectedReport;
      $ionicHistory.clearCache().then(function() {
        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        synchronizationServices.stopSyncUserLoginData();
        $scope.data.loading = false;
        var message = "All Data has been reset successfully";
        progressMessage(message);
        $state.go('login', {}, {location: "replace", reload: true});
      });
    }

  });
