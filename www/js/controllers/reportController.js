/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('reportController',function($scope,ionicToast,$localStorage){
    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;
    $scope.data.selectedData = {};
    $scope.data.formSelectVisibility = false;
    if($localStorage.dataEntryData){

      $scope.data.selectedData = $localStorage.dataEntryData;
    }

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'bottom', false, 2500);
    }

    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnitId', function() {

      progressMessage($scope.data.orgUnitId);
    });

    periodOption();
    function periodOption(){
      var year = 2016;
      var period = [];

      for(var i = 0; i < 10; i ++){
        period.push({ year : year --});
      }
      $scope.data.periodOption = period;
    }

  });
