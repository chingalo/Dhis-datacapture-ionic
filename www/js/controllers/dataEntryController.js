/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$indexedDB,$state,$ionicModal,ionicToast,$localStorage,dataSetsServices,sectionsServices){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;
    $scope.data.selectedData = {};
    $scope.data.formSelectVisibility = false;


    if($localStorage.dataEntryData){

      $scope.data.selectedData = $localStorage.dataEntryData;
      $scope.data.selectedDataEntryForm = $localStorage.dataEntryData;
    }else{

      $scope.data.selectedDataEntryForm = {};
      $scope.data.selectedData = {};
    }

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'top', false, 2500);
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
      dataSetsServices.getDataSetById($scope.data.dataSetId,$scope.data.dataSets)
        .then(function(data){

        $scope.data.selectedDataSet = data;
        $scope.data.loading = false;
      },function(){

        $scope.data.loading = false;
      })
    });

    $scope.generateDefaultDataEntryForm = function(){

      $localStorage.dataEntryData.formType = 'DEFAULT';
      $state.go('app.dataEntryForm');
    };
    $scope.generateCustomDataEntryForm = function(){

      var checkResults = checkingAndSetDataEntryForm('CUSTOM');
      if(checkResults){

        $localStorage.dataEntryData.formType = 'CUSTOM';
        $state.go('app.dataEntryForm');
      }else{
        var message = 'Custom data entry form for ' +  $localStorage.dataEntryData.dataSet.name + ' form has not been defined';
        progressMessage(message);
      }
    };
    $scope.generateSectionDataEntryForm = function(){

      var checkResults = checkingAndSetDataEntryForm('SECTION');
      if(checkResults){

        $localStorage.dataEntryData.formType = 'SECTION';
        $state.go('app.dataEntryForm');
      }else{
        var message = 'There are no form section for ' + $localStorage.dataEntryData.dataSet.name + ' that has been set';
        progressMessage(message);
      }
    };

    $ionicModal.fromTemplateUrl('templates/modal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.close = function() {
      $scope.modal.hide();
    };

    $scope.periodSelect = function(){

      $scope.close();
      if($scope.data.selectedDataSet){

        var dataElements = $scope.data.selectedDataSet.dataElements;
        $scope.data.selectedData = {
          orgUnit : getSelectedOrgUnit($scope.data.orgUnitId),
          dataSet : $scope.data.selectedDataSet,
          period : $scope.data.period,
          numberOfFields : dataElements.length,
          formType : ''
        };
        $scope.data.formSelectVisibility = true;
        $localStorage.dataEntryData = $scope.data.selectedData;
      }
    };

    $scope.openModal = function(modalType){

      $scope.data.modalType = modalType;
      $scope.modal.show();
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

    function checkingAndSetDataEntryForm(type){

      var dataSet = $localStorage.dataEntryData.dataSet;
      var numberOfSections = dataSet.sections.length;
      var results = false;
      if(type == 'SECTION'){

        if(numberOfSections > 0){
          results = true;
        }
      }else{

        $localStorage.dataEntryData.numberOfSections = 0;
        if(dataSet.formType == type){
          results = true;
        }
      }
      return results;
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
