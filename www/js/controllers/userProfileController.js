/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('userProfileController',function($scope,$localStorage){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;

    //function to get user roles
    $scope.getUserRoles = function(){
      var data = [];
      $localStorage.loginUserData.userCredentials.userRoles.forEach(function(userRole){
        data.push(userRole.name);
      });
      return data;
    };

    //function to get assigned org units
    $scope.getUserAssignedOrgUnits = function(){
      var data = [];
      $localStorage.loginUserData.organisationUnits.forEach(function(orgUnit){
        data.push(orgUnit.name);
      });
      return data;
    };

    //function to get assigned form for a given user
    $scope.getUserAssignedForms = function(){
      var dataSetsData = [];
      $localStorage.loginUserData.userCredentials.userRoles.forEach(function(userRole){
        userRole.dataSets.forEach(function(dataSet){
          if(isUniqueDataSet(dataSetsData,dataSet)){
            dataSetsData.push(dataSet);
          }
        });
      });
      return dataSetsData;
    };

    //function to get unique data set form the list
    function isUniqueDataSet(dataSetsData,dataSet){
      var returnData = true;
      dataSetsData.forEach(function(dataSetSelected){
        if(dataSetSelected.id == dataSet.id){
          returnData = false;
        }
      });
      return returnData;
    }

  });
