/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('settingController',function($scope,ionicToast,$localStorage){
    $localStorage.userSetting = {};
    $scope.data = {};
    $scope.data.defaultForm = {
      sorting : 'name'
    };
    $scope.data.synchronization = {
      time : {type : 'seconds',value : 0},
      preference : 'mobile'
    };

    $scope.$watch('data.defaultForm',function(){
      console.log(JSON.stringify($scope.data));
    });
    $scope.$watch('data.synchronization',function(){
      console.log(JSON.stringify($scope.data));
    });

  });
