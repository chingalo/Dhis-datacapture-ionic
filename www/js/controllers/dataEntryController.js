/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$localStorage,dataSetsServices){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'bottom', false, 2500);
    }

    //checking selected orgUnit
    $scope.$watch('data.orgUnitId', function() {

      $scope.data.dataSetId = null;
      $scope.data.dataSets = null;
      $scope.data.loading = true;
      dataSetsServices.getAllDataSets().then(function(dataSets){

        $scope.data.dataSets = dataSetsServices.getDataSetsByOrgUnitId($scope.data.orgUnitId,dataSets);
        $scope.data.loading = false;
      },function(){

        var message = 'Data entry form has not been found';
        progressMessage(message);
        $scope.data.loading = false;
      });
    });

    periodOption();
    function periodOption(){
      var year = 2016;
      var period = [];

      for(var i = 0; i < 20; i ++){
        period.push({ year : year --});
      }
      $scope.data.periodOption = period;
    }

  });
