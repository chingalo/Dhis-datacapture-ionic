/**
 * Created by chingalo on 3/16/16.
 */
angular.module('dataCapture')
  .controller('aboutController',function($scope,$localStorage){

    $scope.data = {};
    $scope.data.systemInfo = $localStorage.systemInfo;
    $scope.data.appInfo = {
      Name : 'Dhis 2 Touch',
      Version : '0.12',
      'App revision' : '3cd1985'
    }

  });

