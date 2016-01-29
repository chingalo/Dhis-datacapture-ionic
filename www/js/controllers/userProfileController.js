/**
 * Created by joseph on 1/29/16.
 */
angular.module('')
  .controller('userProfileController',function($scope,$localStorage){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;

  });
