/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('settingController',function($scope,ionicToast,$localStorage,synchronizationServices){

    $localStorage.appSetting = {
      synchronization : {
        time : {type : 'seconds',value : 60},
        preference : 'mobile'
      },
      defaultForm : {
        sorting : 'name'
      },syncTime :60*1000

    };
    $scope.data = $localStorage.appSetting;

    $scope.$watch('data.defaultForm.sorting',function(){
      $localStorage.appSetting = $scope.data.synchronization;
      console.log(JSON.stringify($scope.data));

    });
    $scope.$watch('data.synchronization.preference',function(){
      console.log(JSON.stringify($scope.data));
    });
    $scope.$watch('data.synchronization.time.type',function(){
      $localStorage.appSetting = $scope.data.synchronization;
      changeSyncTime();
    });
    $scope.$watch('data.synchronization.time.value',function(){
      $localStorage.appSetting = $scope.data.synchronization;
      changeSyncTime();
    });
    function changeSyncTime(){
      var type = $scope.data.synchronization.time.type;
      var value = $scope.data.synchronization.time.value;
      $localStorage.appSetting = $scope.data.synchronization;
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
      $localStorage.appSetting.syncTime = newValue;
      synchronizationServices.stopSync();
      synchronizationServices.startSync(newValue);

    }

  });
