/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$indexedDB,$state,$ionicModal,ionicToast,$localStorage,dataSetsServices,sectionsServices){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;
    $scope.data.selectedData = {};
    $scope.data.formSelectVisibility = false;
    $scope.data.dataValues ={};
    $scope.data.sectionsForm =[];
    $scope.data.loading = false;


    if($localStorage.dataEntryData){

      $scope.data.loading = true;
      $scope.data.selectedData = $localStorage.dataEntryData;
      $scope.data.selectedDataEntryForm = $localStorage.dataEntryData;
      $scope.data.loading = false;
      if( $localStorage.dataEntryData.formType == 'SECTION'){

        $scope.data.loading = true;
        var selectedSections = $localStorage.dataEntryData.dataSet.sections;
        var counter = 0;
        selectedSections.forEach(function(selectedSection){
          counter ++;
          sectionsServices.getAllDataEntryFormSection().then(function(sections){
            sections.forEach(function(section){
              if(selectedSection.id == section.id){
                $scope.data.sectionsForm.push(section);
                if(counter == selectedSections.length){
                  $scope.data.loading = false;
                }
              }
            })
          },function(){
            //error
          })
        });
      }
    }else{

      $scope.data.loading = false;
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

    $scope.changeDataEntryForm = function(){

      var ou = $localStorage.dataEntryData.orgUnit.id;
      var co = $localStorage.dataEntryData.dataSet.categoryCombo.id;
      var pe = $localStorage.dataEntryData.period;

      for(var key in $scope.data.dataValues){
        var data = {
          "id":key + '-' +co+ '-' +pe+ '-' +ou,
          "dataValue":{
            "de": key,
            "co": ou,
            "pe": pe,
            "value": $scope.data.dataValues[key]
          },
          "isSaved":false
        };

        dataSetsServices.saveDataSetDataValue(data);
      }
    };

    $scope.generateDefaultDataEntryForm = function(){

      var message = "Please wait...";
      ionicToast.show(message, 'bottom', false, 2500);
      $localStorage.dataEntryData.formType = 'DEFAULT';
      $scope.data.loading = false;
      $state.go('app.dataEntryForm');
    };
    $scope.generateCustomDataEntryForm = function(){

      $scope.data.loading = true;
      var checkResults = checkingAndSetDataEntryForm('CUSTOM');
      if(checkResults){

        var message = "Please wait...";
        ionicToast.show(message, 'bottom', false, 2500);
        $localStorage.dataEntryData.formType = 'CUSTOM';
        $scope.data.loading = false;
        $state.go('app.dataEntryForm');
      }else{
        var message = 'Custom data entry form for ' +  $localStorage.dataEntryData.dataSet.name + ' form has not been defined';
        progressMessage(message);
      }
    };
    $scope.generateSectionDataEntryForm = function(){

      $scope.data.loading = true;
      var message = "Please wait...";
      ionicToast.show(message, 'bottom', false, 2500);
      var checkResults = checkingAndSetDataEntryForm('SECTION');
      if(checkResults){

        $localStorage.dataEntryData.formType = 'SECTION';
        $scope.data.loading = false;
        $state.go('app.dataEntryForm');
      }else{
        var message = 'There are no form section for ' + $localStorage.dataEntryData.dataSet.name + ' that has been set';
        progressMessage(message);
      }
    };

    $scope.changePeriodInterval = function(type){

      console.log(type);
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

    //flexibility for form
    $scope.isInteger = function(key){
      if(key == "NUMBER"){
        return true;
      }else{
        return false;
      }
    };
    $scope.isIntegerZeroOrPositive = function(key){
      if(key == "INTEGER_ZERO_OR_POSITIVE"){
        return true;
      }else{
        return false;
      }
    };
    $scope.isDate = function(key){
      if(key == "DATE"){
        return true;
      }else{
        return false;
      }
    };
    $scope.isString = function(key){
      if(key == "TEXT"){
        return true;
      }else{
        return false;
      }
    };
    $scope.isBoolean = function(key){
      if(key == "BOOLEAN"){
        return true;
      }else{
        return false;
      }
    };
    $scope.hasDataSets = function(dataElement){

      if(dataElement.optionSet != undefined){
        return true;
      }else{
        return false;
      }
    };
    $scope.getOptionSets = function(dataElement){
      if(dataElement.optionSet){
        return dataElement.optionSet.options;
      }else{
        return false;
      }

    };



  });
