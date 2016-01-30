/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$localStorage,dataSetsServices){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;

    //checking selected orgUnit
    $scope.$watch('data.orgUnitId', function() {

      dataSetsServices.getAllDataSets().then(function(dataSets){

        $scope.data.dataSets = dataSetsServices.getDataSetsByOrgUnitId($scope.data.orgUnitId,dataSets);
      },function(){

        //no data set available
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
