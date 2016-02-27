/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$indexedDB,
                                             $state,$ionicModal,ionicToast,
                                             $localStorage,userServices,dataSetsServices,
                                             dataValueSetServices,
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
    $scope.data.orgUnits = [];
    $scope.data.orgUnit = [];
    $scope.data.selectedDataEntryForm = null;

    //pagination variables
    $scope.currentPage = 0;
    $scope.pageSizeDefault = 5;
    $scope.pageSizeSection = 1;

    //function to control pagination on data entry sections
    $scope.numberOfPagesSection=function(){
      var numberOfSections = $localStorage.dataEntryData.dataSet.sections;
      if(numberOfSections){
        return Math.ceil(numberOfSections.length/$scope.pageSizeSection);
      }else{
        return 0;
      }
    };

    //function to control pagination on data entry default form
    $scope.numberOfPagesDefault=function(){
      var dataElements = $scope.data.selectedDataEntryForm.dataSet.dataElements;
      if(dataElements){
        return Math.ceil(dataElements.length/$scope.pageSizeDefault);
      }else{
        return 0;
      }
    };

    //checking if data entry form is selected
    if($localStorage.dataEntryData){
      $scope.data.loading = true;
      $scope.data.selectedData = $localStorage.dataEntryData;
      $scope.data.selectedDataEntryForm = $localStorage.dataEntryData;
      $scope.data.loading = false;
      prepareDataElementsValuesFromIndexDb();
      trimOffBRNScoreValues();
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
            });
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

    //function to prepare data elements and values to be rendered on form
    function prepareDataElementsValuesFromIndexDb(){
      var dataElements = $localStorage.dataEntryData.dataSet.dataElements;
      var ou = $localStorage.dataEntryData.orgUnit;
      var pe = $localStorage.dataEntryData.period;
      var dataSetId = $localStorage.dataEntryData.dataSet.id;
      $scope.data.loading = true;
      var counter = 0;
      dataElements.forEach(function(dataElement){
        var categoryOptionCombos = dataElement.categoryCombo.categoryOptionCombos;
        categoryOptionCombos.forEach(function(categoryOptionCombo){
          var id = dataElement.id + '-' +dataSetId+ '-' +categoryOptionCombo.id+ '-' +pe+ '-' +ou;
          dataSetsServices.getDataValueById(id)
            .then(function(returnedDataValue){
              counter ++;
              if(returnedDataValue != null){
                if(id == returnedDataValue.id){

                  $scope.data.dataValues[dataElement.id+'-'+returnedDataValue.co] = returnedDataValue.value;
                }
              }
            },function(){
              counter ++;
            });
        });
      });
      prepareDataElementsValuesFromServer();
    }

    //function to prepare data elements and values from server to be rendered on form
    function prepareDataElementsValuesFromServer(){
      $scope.data.loading = true;
      progressMessage("Downloading data values from server");
      var dataSet = $localStorage.dataEntryData.dataSet.id;
      var period = $localStorage.dataEntryData.period;
      var orgUnit = $localStorage.dataEntryData.orgUnit;
      dataValueSetServices.getDataValueSet(dataSet,period,orgUnit)
        .then(function(dataElementsValuesFromServer){
          if(dataElementsValuesFromServer){
            progressMessage(dataElementsValuesFromServer.length + " data values has been found from server");
            dataElementsValuesFromServer.forEach(function(dataElementValues){
              saveDataValuesFromServerToIndexDb(dataElementValues);
              var value = isDataElementValueTypeNumber(dataElementValues.dataElement)?parseInt(dataElementValues.value):dataElementValues.value;
              $scope.data.dataValues[dataElementValues.dataElement+'-'+dataElementValues.categoryOptionCombo] = value;
            });
            $scope.data.loading = false;
          }
        },function(){
          //error
          progressMessage('Fail to retrieve data values form server, it might be due to network connectivity');
          $scope.data.loading = false;
        });
    }

    //function to save datavalues to form server to indexdb
    function saveDataValuesFromServerToIndexDb(dataElementValues){
      var ou = $localStorage.dataEntryData.orgUnit;
      var pe = $localStorage.dataEntryData.period;
      var dataSetId = $localStorage.dataEntryData.dataSet.id;
      var id = dataSetId + '-' +dataElementValues.dataElement+ '-'+dataElementValues.categoryOptionCombo+'-'+pe+ '-' +ou;
      dataSetsServices.getDataValueById(id).then(function(returnedDataValue){
        var dataValue = returnedDataValue;
        var value = isDataElementValueTypeNumber(dataElementValues.dataElement)?parseInt(dataElementValues.value):dataElementValues.value;
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
            "de": dataElementValues.dataElement,
            "pe": pe,
            "value": value,
            "co" : dataElementValues.categoryOptionCombo,
            "ou" : ou,
            "cc":$localStorage.dataEntryData.dataSet.categoryCombo.id,
            "cp":dataElementValues.attributeOptionCombo,
            "sync":true
          };
          dataSetsServices.saveDataSetDataValue(data);
        }
      },function(){
      });
    }
    function isDataElementValueTypeNumber(dataElementId){
      var result = false;
      var dataElements = $localStorage.dataEntryData.dataSet.dataElements;
      dataElements.forEach(function(dataElement){
        if(dataElement.id == dataElementId){
          if($scope.isIntegerZeroOrPositive(dataElement.valueType)|| $scope.isInteger(dataElement.valueType)){
            result = true;
          }
        }
      });
      return result;
    }

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'top', false, 2000);
    }

    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnit', function(){
      $scope.data.dataSetId = null;
      $scope.data.dataSets = null;
      $scope.data.formSelectVisibility = false;
      $scope.data.period = null;
      $scope.data.hasCategoryComboOptions = false;
      if($scope.data.orgUnit.length > 0){
        $scope.data.loading = true;
        var orgUnitId = $scope.data.orgUnit[0].id;
        dataSetsServices.getAllDataSets().then(function(dataSets){
          $scope.data.dataSets = dataSetsServices.getDataSetsByOrgUnitId(orgUnitId,dataSets);
          var message = $scope.data.dataSets.length + ' Data entry form has been found';
          progressMessage(message);
          $scope.data.loading = false;
        },function(){
          var message = 'Data entry form has not been found';
          progressMessage(message);
          $scope.data.loading = false;
        });
      }
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

    //function to checking changes on data elements values from data entry form
    $scope.changeDataEntryForm = function(dataElement){
      if(dataElement.attributeValues.length > 0){
        extendDataElementFunctions(dataElement);
      }
      for(var key in $scope.data.dataValues){
        if($scope.data.dataValues[key]){
          prepareDataValues(key,$scope.data.dataValues[key]);
        }
      }
    };

    //@todo complete calling extended function
    //function to extend data element functions
    function extendDataElementFunctions(dataElement){
      var attributeObject = eval(dataElement.dataElement.attributeValues[0].value);
      angular.extend(dataElement,attributeObject);
      if(dataElement.events){
        //activate ectended functions
      }
    }
    //@todo modify based on  api on docs
    //function to save data values from the form
    function prepareDataValues(key,value){
      var ou = $localStorage.dataEntryData.orgUnit;
      var pe = $localStorage.dataEntryData.period;
      var dataSetId = $localStorage.dataEntryData.dataSet.id;
      var modelValue = key.split('-');
      var id = dataSetId + '-' +modelValue[0] + '-'+modelValue[1]+'-'+pe+ '-' +ou;
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
            "de": modelValue[0],
            "pe": pe,
            "value": isDatElementHasDateValueDate(modelValue[0]) ? formatDate(value):value,
            "co" : modelValue[1],
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

    //function to check id data element take date as input using data elementId
    function isDatElementHasDateValueDate(dataElementId){
      var result = false;
      var dataElements = $scope.data.selectedDataEntryForm.dataSet.dataElements;
      dataElements.forEach(function(dataElement){
        if(dataElement.id == dataElementId){
          if($scope.isDate(dataElement.valueType)){
            result = true;
          }
        }
      });
      return result;
    }

    //function to format date as supported on dhis
    function formatDate(dateValue){
      var m,d = (new Date(dateValue));
      m = d.getMonth() + 1;
      var date = d.getFullYear() + '-';
      if(m > 9){
        date = date + m + '-';
      }else{
        date = date + '0' + m + '-';
      }
      if(d.getDate() > 9){
        date = date + d.getDate();
      }else{
        date = date + '0' +d.getDate();
      }
      return date;
    }

    //function to generate default data entry form
    $scope.generateDefaultDataEntryForm = function(){
      $scope.data.loading = true;
      var message = "Please wait...";
      ionicToast.show(message, 'bottom', false, 2500);
      $localStorage.dataEntryData.formType = 'DEFAULT';
      $scope.data.loading = false;
      $state.go('app.dataEntryForm');
    };

    //funtion to trim off brn score values data element
    function trimOffBRNScoreValues(){
      $scope.data.loading = true;
      var dataElements = $localStorage.dataEntryData.dataSet.dataElements;
      var trimmedOffBRNScoreValues = [];
      var counter = 0;
      dataElements.forEach(function(dataElement){
        counter ++;
        var dataElementNameString = dataElement.name.split('_');
        var length = dataElementNameString.length;
        if(dataElementNameString[length -1] != "scorevalue"){
          trimmedOffBRNScoreValues.push(dataElement);
        }
        if(counter == dataElements.length){
          $scope.data.loading = false;
          $scope.data.selectedDataEntryForm.dataSet.dataElements = trimmedOffBRNScoreValues;
          $localStorage.dataEntryData.dataSet.dataElements = trimmedOffBRNScoreValues;
          //$state.go('app.dataEntryForm');
        }
      });
    }

    //function to generate custom data entry form
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

    //function to generate section data entry form
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

    //function to handle period option changes
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

    //function to handle pop up modal
    $ionicModal.fromTemplateUrl('templates/modal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    //function to close pop up model
    $scope.close = function() {
      $scope.modal.hide();
    };

    //function to handle selection of date entry period selection
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

    //function to save all details necessary for data entry to local storage
    function saveSelectedDataSetToLocalStorage(categoryOptionCombosId){
      var dataElements = $scope.data.selectedDataSet.dataElements;
      $scope.data.selectedData = {
        orgUnit : $scope.data.orgUnit[0].id,
        orgUnitName : $scope.data.orgUnit[0].name,
        dataSet : $scope.data.selectedDataSet,
        period : $scope.data.period,
        periodDisplayName : $scope.getPeriodDisplayValue($scope.data.period),
        numberOfFields : dataElements.length,
        formType : '',
        categoryOptionCombosId : categoryOptionCombosId
      };
      $scope.data.formSelectVisibility = true;
      $localStorage.dataEntryData = $scope.data.selectedData;
      $localStorage.dataEntryData.dataElements = dataElements;
    }

    //function to get period display name value
    $scope.getPeriodDisplayValue=function(period){
      var periodDisplayValue = '';
      $scope.data.periodOption.forEach(function(periodData){
        if(periodData.periodValue == period){
          periodDisplayValue = periodData.displayValue;
        }
      });
      return periodDisplayValue;
    }

    //function to open the pop p modal
    $scope.openModal = function(modalType){
      $scope.data.modalType = modalType;
      $scope.modal.show();
    };

    //function to get all user assigned orgUnit for tree
    getAllAssignedOrgUnits();
    function getAllAssignedOrgUnits(){
      $scope.data.loading = true;
      userServices.getAssignedOrgUnitFromIndexDb()
        .then(function(data){
          if(data.length > 0){
            $scope.data.orgUnits = data;
            $scope.data.loading = false;
          }else {
            getAllAssignedOrgUnits();
          }
        },function(){
          //error
          $scope.data.loading = false;
        })
    }

    //function for period selections
    function periodOption(dataSet){
      var year = parseInt(new Date().getFullYear()) -1;
      $scope.data.periodOption = periodSelectionServices.getPeriodSelections(year,dataSet);
    }

    //function to check data entry form type
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

    //function to handle form completeness
    $scope.completeDataEntryForm = function(){
      var parameter = getDatSetCompletenessParameter();
      dataValueSetServices.completeOnDataSetRegistrations(parameter).then(function(){
        //success on complete form
        progressMessage('Data entry form has been completed successfully');
      },function(){
        //error on complete form
        progressMessage('Data entry form  has not been completed, it might be due to network connectivity');
      });
    };

    //function to handle form un-completeness
    $scope.unCompleteDataEntryForm = function(){
      var parameter = getDatSetCompletenessParameter();
      dataValueSetServices.inCompleteOnDataSetRegistrations(parameter).then(function(){
        //success on incomplete form
        progressMessage('Data entry form has been uncompleted successfully');
      },function(){
        //error on incomplete form
        progressMessage('Data entry form  has not been uncompleted, it might be due to network connectivity');
      });
    };

    //function to get all data set completeness parameters
    function getDatSetCompletenessParameter(){
      var dataEntryForm = $localStorage.dataEntryData;
      var parameter = "ds="+dataEntryForm.dataSet.id+"&pe="+dataEntryForm.period+"&ou="+dataEntryForm.orgUnit;
      if(dataEntryForm.categoryOptionCombosId){
        parameter += "&cc="+dataEntryForm.dataSet.categoryCombo.id+"&cp="+dataEntryForm.categoryOptionCombosId;
      }
      return parameter;
    }

    //flexibility for form
    $scope.isInteger = function(key){
      if(key == "NUMBER" || key == "INTEGER"){
        return true;
      }else{
        return false;
      }
    };
    $scope.isTrueOnly = function(key){
      if(key == "TRUE_ONLY"){
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
      if(key == "TEXT" || key == "LONG_TEXT"){
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
