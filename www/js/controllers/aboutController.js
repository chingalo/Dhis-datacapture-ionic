/**
 * Created by chingalo on 3/16/16.
 */
angular.module('dataCapture')
  .controller('aboutController',function($scope,$localStorage){

    $scope.data = {};
    $scope.data.systemInfo = $localStorage.systemInfo;
    $scope.data.appInfo = {
      Name : 'Dhis 2 Touch',
      Version : '0.19',
      'App revision' : 'a6d5f7e9',
      'Release status' : 'Snapshot'

    };

    $scope.getSystemInfoName = function(key){
      return (key.charAt(0).toUpperCase() + key.slice(1)).replace(/([A-Z])/g, ' $1').trim();
    }

  });

