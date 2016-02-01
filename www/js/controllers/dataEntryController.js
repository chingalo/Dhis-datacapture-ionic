/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$state,ionicToast,$localStorage,dataSetsServices){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;
    $scope.data.selectedData = {};
    $scope.data.formSelectVisibility = false;

    if($localStorage.dataEntryData){

      $scope.data.selectedData = $localStorage.dataEntryData;
      $scope.data.selectedDataEntryForm = $scope.data.selectedData;
    }

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'bottom', false, 2500);
    }

    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnitId', function() {

      $scope.data.dataSetId = null;
      $scope.data.dataSets = null;
      $scope.data.formSelectVisibility = false;
      $scope.data.period = null;

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

    //checking changes on data entry form
    $scope.$watch('data.dataSetId', function() {

      $scope.data.loading = true;
      $scope.data.formSelectVisibility = false;
      $scope.data.selectedData = null;
      $scope.data.period = null;
      dataSetsServices.getDataSetById($scope.data.dataSetId,$scope.data.dataSets).then(function(data){

        $scope.data.selectedDataSet = data;
        $scope.data.loading = false;
      },function(){

        $scope.data.loading = false;
      })
    });
    //checking changes on period inputs
    $scope.$watch('data.period', function() {

      if($scope.data.selectedDataSet){

        var dataElements = $scope.data.selectedDataSet.dataElements;
        $scope.data.selectedData = {
          orgUnit : getSelectedOrgUnit($scope.data.orgUnitId),
          dataSet : $scope.data.selectedDataSet,
          period : $scope.data.period,
          numberOfFields : dataElements.length
        };
      }

      if($scope.data.period){

        $scope.data.formSelectVisibility = true;
        $localStorage.dataEntryData = $scope.data.selectedData;
      }

    });

    $scope.generateDefaultDataEntryForm = function(){
      console.log('Default');
      $state.go('app.dataEntryForm');
    };
    $scope.generateCustomDataEntryForm = function(){
      console.log('custom');
      $state.go('app.dataEntryForm');
    };

    function getSelectedOrgUnit(orgUnitId){

      var orgUnits = $scope.data.user.organisationUnits;
      var selectedOrgUnit = null;
      orgUnits.forEach(function(orgUnit){
        if(orgUnit.id == orgUnitId){
          selectedOrgUnit = orgUnit;
        }
      });
      return selectedOrgUnit;
    }

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
