/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$indexedDB,
                                             $state,$ionicModal,ionicToast,
                                             $localStorage,userServices,dataSetsServices,
                                             periodSelectionServices,sectionsServices){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;
    $scope.data.selectedData = {};
    $scope.data.formSelectVisibility = false;
    $scope.data.dataValues ={};
    $scope.data.sectionsForm =[];
    $scope.data.loading = false;
    $scope.dataForTheTree =[];
    $scope.data.periodOption = [];

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
    /* function changeOrgUnit(orgUnitId){
      console.log(orgUnitId);
    }*/
    $scope.$watch('data.orgUnitId', function() {
      $scope.data.dataSetId = null;
      $scope.data.dataSets = null;
      $scope.data.formSelectVisibility = false;
      $scope.data.period = null;
      $scope.data.loading = true;
      $scope.data.hasCategoryComboOptions = false;
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
      $scope.data.hasCategoryComboOptions = false;
      dataSetsServices.getDataSetById($scope.data.dataSetId,$scope.data.dataSets)
        .then(function(data){

          $scope.data.selectedDataSet = data;
          $scope.data.loading = false;
          periodOption(data);
        },function(){

          $scope.data.loading = false;
        })
    });

    $scope.$watch('data.categoryOptionCombos', function(){
      if($scope.data.categoryOptionCombos){
        saveSelectedDataSetToLocalStorage($scope.data.categoryOptionCombos);
      }
    });

    $scope.changeDataEntryForm = function(){
      for(var key in $scope.data.dataValues){
        if($scope.data.dataValues[key]){
          prepareDataValues(key,$scope.data.dataValues[key]);
        }
      }
    };
    //@todo modify based on  api on docs
    //@todo co :: Category option combo identifier for data element other than defaults
    function prepareDataValues(key,value){
      var ou = $localStorage.dataEntryData.orgUnit;
      var pe = $localStorage.dataEntryData.period;
      var dataSetId = $localStorage.dataEntryData.dataSet.id;
      var id = key + '-' +dataSetId+ '-' +pe+ '-' +ou;
      var dataValue = null;
      dataSetsServices.getDataValueById(id).then(function(returnedDataValue){
        dataValue = returnedDataValue;
        var data = null;
        var canUpdate = false;
        if(dataValue == null ){
          canUpdate = true;
        }else{
          if(dataValue.value != value){
            canUpdate = true;
          }
        }
        if(canUpdate){
          data = {
            "id":id,
            "de": key,
            "pe": pe,
            "value": value,
            "co" : getCategoryOptionComboId(key),
            "ou" : ou,
            "cc":$localStorage.dataEntryData.dataSet.categoryCombo.id,
            "cp":$localStorage.dataEntryData.categoryOptionCombosId,
            "sync":false
          };
          dataSetsServices.saveDataSetDataValue(data);
        }
      },function(){
      });

    }
    //@todo handling non default category option id for data element
    function getCategoryOptionComboId(dataElementId){
      var dataElements = $localStorage.dataEntryData.dataElements;
      var categoryOptionCombosId =null;
      dataElements.forEach(function(dataElement){
        if(dataElement.id == dataElementId){
          var categoryCombo = dataElement.categoryCombo;
          categoryOptionCombosId = categoryCombo.categoryOptionCombos[0].id
        }
      });
      return categoryOptionCombosId;
    }
    //@todo trim off data elements for brn score values
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
        $scope.data.loading = false;
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
        $scope.data.loading = false;
        var message = 'There are no form section for ' + $localStorage.dataEntryData.dataSet.name + ' that has been set';
        progressMessage(message);
      }
    };

    $scope.changePeriodInterval = function(type){
      var yearInput = String($scope.data.periodOption[0].periodValue);
      var year = yearInput.substring(0, 4);
      if(type =='next'){
        year = parseInt(year) + 1;
      }else{
        year = parseInt(year) - 1;
      }
      var periodOptions = periodSelectionServices.getPeriodSelections(year,$scope.data.selectedDataSet);
      if(periodOptions.length > 0){
        $scope.data.periodOption = periodOptions;
      }else{
        var message = "There no period option further than this at moment";
        ionicToast.show(message, 'top', false, 1500);
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
      if($scope.data.selectedDataSet.categoryCombo.categoryOptionCombos[0].name != 'default'){
        $scope.data.hasCategoryComboOptions = true;
      }else{
        var categoryOptionCombosId = null;
        if($scope.data.selectedDataSet){
          saveSelectedDataSetToLocalStorage(categoryOptionCombosId);
        }
      }
    };
    function saveSelectedDataSetToLocalStorage(categoryOptionCombosId){
      var dataElements = $scope.data.selectedDataSet.dataElements;
      $scope.data.selectedData = {
        orgUnit : $scope.data.orgUnit.id,
        dataSet : $scope.data.selectedDataSet,
        period : $scope.data.period,
        numberOfFields : dataElements.length,
        formType : '',
        categoryOptionCombosId : categoryOptionCombosId
      };
      $scope.data.formSelectVisibility = true;
      $localStorage.dataEntryData = $scope.data.selectedData;
      $localStorage.dataEntryData.dataElements = dataElements;
    }

     $scope.getPeriodDisplayValue=function(period){
      var periodDisplayValue = '';
      $scope.data.periodOption.forEach(function(periodData){
        if(periodData.periodValue == period){
          periodDisplayValue = periodData.displayValue;
        }
      });
      return periodDisplayValue;
    }

    $scope.openModal = function(modalType){
      $scope.data.modalType = modalType;
      $scope.modal.show();
    };

    getAllAssignedOrgUnits();
    function getAllAssignedOrgUnits(){
      $scope.data.loading = true;
      userServices.getAssignedOrgUnitFromIndexDb()
        .then(function(data){
          if(data.length > 0){
            $scope.dataForTheTree = data;
            $scope.data.loading = false;
          }else {
            getAllAssignedOrgUnits();
          }
        },function(){
          //error
          $scope.data.loading = false;
        })

    }
    $scope.showSelected = function(orgUnit){
      $scope.close();
      $scope.data.orgUnit = orgUnit;
      //changeOrgUnit(orgUnit.id);
      $scope.data.orgUnitId = orgUnit.id;
    };
    $scope.treeOptions = {
      nodeChildren: "children",
      dirSelectable: true,
      allowDeselect : false,
      injectClasses: {
        ul: "a1",
        li: "a2",
        liSelected: "a7",
        iExpanded: "a3",
        iCollapsed: "a4",
        iLeaf: "a5",
        label: "a6",
        labelSelected: "a8"
      }
    };

    function periodOption(dataSet){
      var year = parseInt(new Date().getFullYear()) -1;
      $scope.data.periodOption = periodSelectionServices.getPeriodSelections(year,dataSet);
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
