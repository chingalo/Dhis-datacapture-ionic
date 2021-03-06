/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('settingController',function($scope,ionicToast,$ionicHistory,$state,
                                           $ionicModal,dataSetsServices,$indexedDB,
                                           sectionsServices,reportServices,
                                           userServices,constantsServices,
                                           $localStorage,synchronizationServices){

    //initialization of setting configuration variables
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

    //function to display progress messages
    function progressMessage(message){
      ionicToast.show(message, 'top', false, 2500);
    }

    //functions to checking changes setting page
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

    //function to change sync time for an app
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

    //function to get sync time for setting configurations
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

    //function for pop up on data reset
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

    //function to handle confirmation data reset
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

    //function to delete all data values
    function deleteAllDtaValue(){
      $scope.data.loading = true;
      dataSetsServices.deleteAllDataValues()
        .then(function(){
          $scope.data.loading = false;
          progressMessage("Data Entry values has been reset successfully");
        },function(){
          progressMessage("Data Entry values has been failed to reset successfully");
          $scope.data.loading = false;
        })
    }

    //function to delete all data
    function deleteAllData(){
      $indexedDB.deleteDatabase().then(function(){
        var message = "Offline storage has been reset successfully";
        progressMessage(message);
        logOutUser();
      },function(){
        var message = "Fail to Reset Offline storage";
        progressMessage(message);
      });
    }

    //function to log out after delete all data
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
        $state.go('login', {}, {location: "replace", reload: true});
      });
    }

  });
