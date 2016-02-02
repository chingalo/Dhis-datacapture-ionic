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
      $scope.data.selectedDataEntryForm = $scope.data.selectedData;
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

      $scope.data.selectedDataEntryForm.formType = 'DEFAULT';
      $localStorage.dataEntryData = $scope.data.selectedDataEntryForm;
      $state.go('app.dataEntryForm');
    };
    $scope.generateCustomDataEntryForm = function(){

      var checkResults = checkingAndSetDataEntryForm('CUSTOM');
      if(checkResults){

        $scope.data.selectedDataEntryForm.formType = 'CUSTOM';
        $localStorage.dataEntryData = $scope.data.selectedDataEntryForm;
        $state.go('app.dataEntryForm');
      }else{

        var message = 'Data Entry form has no CUSTOM form';
        progressMessage(message);
      }
    };
    $scope.generateSectionDataEntryForm = function(){

      var checkResults = checkingAndSetDataEntryForm('SECTION');
      if(checkResults){

        $scope.data.selectedDataEntryForm.formType = 'SECTION';
        $localStorage.dataEntryData = $scope.data.selectedDataEntryForm;
        $state.go('app.dataEntryForm');
      }else{

        var message = 'Data Entry form has no section';
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
          numberOfSections : $scope.data.selectedDataSet.sections.length,
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
      var numberOfSections = $localStorage.dataEntryData.numberOfFields;
      var results = false;
      if(type == 'SECTION'){
        if(numberOfSections > 0){
          results = true;
        }
      }else{
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
