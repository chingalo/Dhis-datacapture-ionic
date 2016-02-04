/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('settingController',function($scope,ionicToast,$localStorage,synchronizationServices){

    $localStorage.appSetting = {
      synchronization : {
        time : {type : 'seconds',value : 0},
        preference : 'mobile'
      },
      defaultForm : {
        sorting : 'name'
      }
    };
    $scope.data = $localStorage.appSetting;

    synchronizationServices.stopSync();

    $scope.$watch('data.defaultForm.sorting',function(){
      console.log(JSON.stringify($scope.data));

    });
    $scope.$watch('data.synchronization.preference',function(){
      console.log(JSON.stringify($scope.data));
    });
    $scope.$watch('data.synchronization.time.type',function(){
      console.log(JSON.stringify($scope.data));
    });
    $scope.$watch('data.synchronization.time.value',function(){
      console.log(JSON.stringify($scope.data));
    });

  });
