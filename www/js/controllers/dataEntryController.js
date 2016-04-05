/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$indexedDB,$filter,$q,
                                             $state,$ionicModal,ionicToast,
                                             $localStorage,userServices,dataSetsServices,
                                             dataValueSetServices,$ionicLoading,
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
    $scope.data.dataValue = {
      local : 0,
      online : 0
    };

    if(angular.isUndefined($scope.data.isDataSetCompleted)){
      $scope.data.isDataSetCompleted = false;
    }

    //pagination variables
    $scope.currentPage = 0;
    $scope.pageSizeDefault = 5;
    $scope.pageSizeSection = 1;
    function blockAppUi(message){
      $ionicLoading.show({
        template: message

      });
    }
    function unBlockUi(){
      $ionicLoading.hide();
    }
    $scope.navigateToNewPage = function(pageNumber,type){
      $scope.data.loading = true;
      if(type == 'last'){
        if($localStorage.dataEntryData.formType == 'SECTION'){
          $scope.currentPage = $scope.data.selectedDataEntryForm.dataSet.sections.length - 1;
          $scope.data.loading = false;
        }else{
          $scope.currentPage = Math.ceil($scope.data.selectedDataEntryForm.dataSet.dataElements.length/$scope.pageSizeDefault);
          $scope.data.loading = false;
        }
      }else{
        $scope.currentPage = pageNumber;
        $scope.data.loading = false;
      }
    };

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
      if($localStorage.allowDataEntrySync){
        prepareDataElementsValuesFromServer();
      }
      trimOffBRNScoreValues();
      if( $localStorage.dataEntryData.formType == 'SECTION'){
        $scope.data.loading = true;
        $localStorage.dataEntryData.dataSet.sections.forEach(function(selectedSection){
          sectionsServices.getAllDataEntryFormSection().then(function(sections){
            sections.forEach(function(section){
              if(selectedSection.id == section.id){
                $scope.data.sectionsForm.push(section);
              }
            });
            $scope.data.loading = false;
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
      blockAppUi("Please waiting while, we are checking for available data values from local storage");
      var dataElements = $localStorage.dataEntryData.dataSet.dataElements;
      var ou = $localStorage.dataEntryData.orgUnit;
      var pe = $localStorage.dataEntryData.period;
      var dataSetId = $localStorage.dataEntryData.dataSet.id;
      $scope.data.loading = true;
      $localStorage.localStorageValues = 0;
      var counter = 0;
      var promises = [];
      dataElements.forEach(function(dataElement,index){
        dataElement.categoryCombo.categoryOptionCombos.forEach(function(categoryOptionCombo){
          var id = dataSetId + '-' + dataElement.id + '-' +categoryOptionCombo.id+ '-' +pe+ '-' +ou;
          promises.push(dataSetsServices.getDataValueById(id)
            .then(function(returnedDataValue){
              var message = Math.ceil(((index + 1)/dataElements.length) * 100) + '% to completion';
              progressMessageStick(message);
              if(returnedDataValue != null){
                if(returnedDataValue.sync){
                  $scope.data.dataValue.online ++;
                }else {
                  counter ++;
                  $scope.data.dataValue.local = counter;
                }
                if(id == returnedDataValue.id){
                  $scope.data.dataValues[dataElement.id+'-'+returnedDataValue.co] = isDataElementHasDropDown(dataElement.id)?{name :returnedDataValue.value,id:''}:returnedDataValue.value;
                }
              }
            },function(){
              //error
              var message = Math.ceil(((index + 1)/dataElements.length) * 100) + '% to completion';
              progressMessageStick(message);
            })
          );

        });
      });
      $q.all(promises).then(function(){
        unBlockUi();
        progressMessageStick('100% to completion');
      },function(){
        unBlockUi();
        progressMessage('Fail to load all data values from server');
      });
      $scope.data.loading = false;
    }

    //function to prepare data elements and values from server to be rendered on form
    function prepareDataElementsValuesFromServer(){
      $scope.data.loading = true;
      prepareDataElementsValuesFromIndexDb();
      progressMessage("Downloading data values from server");
      var dataSet = $localStorage.dataEntryData.dataSet.id;
      var period = $localStorage.dataEntryData.period;
      var orgUnit = $localStorage.dataEntryData.orgUnit;
      dataValueSetServices.getDataValueSet(dataSet,period,orgUnit)
        .then(function(dataValueSets){
          checkDataSetCompleteness(dataValueSets);
          if(dataValueSets.dataValues){
            dataValueSets.dataValues.forEach(function(dataElementValues,index){
              var value = isDataElementValueTypeNumber(dataElementValues.dataElement)?parseInt(dataElementValues.value):dataElementValues.value;
              var storedValue = isDataElementHasDropDown(dataElementValues.dataElement)?{name :value,id : ''} : value;
              $scope.data.dataValues[dataElementValues.dataElement+'-'+dataElementValues.categoryOptionCombo] = storedValue;
              prepareDataValuesToIndexDb(dataElementValues.dataElement + "-" + dataElementValues.categoryOptionCombo,storedValue,true);
            });
            $scope.data.loading = false;
          }else{
            progressMessage('There is no data values that has been found from server');
          }

        },function(){
          //error
          progressMessage('Fail to retrieve data values form server, it might be due to network connectivity');
          $scope.data.loading = false;
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
    function progressMessageStick(message){
      ionicToast.show(message, 'top', true,3000);
    }

    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnit', function(){
      $scope.data.dataSetId = null;
      $scope.data.dataSets = null;
      $scope.data.formSelectVisibility = false;
      $scope.data.period = null;
      $scope.data.hasCategoryComboOptions = false;
      if($scope.data.orgUnit.length > 0){
        var message = "Loading assigned data entry forms in " + $scope.data.orgUnit[0].name;
        progressMessage(message);
        $scope.data.loading = true;
        dataSetsServices.getAllDataSets().then(function(dataSets){
          var allDataSetsByOrgUnit = dataSetsServices.getDataSetsByOrgUnitId($scope.data.orgUnit[0].id,dataSets);
          $scope.data.dataSets = getAllowedDataSet(allDataSetsByOrgUnit);
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

    //function to get data set based on user role
    function getAllowedDataSet(allDataSetsByOrgUnit){
      var allowedDataSet = [];
      allDataSetsByOrgUnit.forEach(function(dataSet){
        if(isDataSetAllowed(dataSet.id)){
          allowedDataSet.push(dataSet);
        }
      });
      return allowedDataSet;
    }

    //function to get setting preferences on form label
    $scope.getFormLabelPreferences = function(){
      return $localStorage.formLabelPreference.label;
    };

    //function to checking data set is assigned to user
    function isDataSetAllowed(dataSetId){
      var result = false;
      $localStorage.loginUserData.userCredentials.userRoles.forEach(function(userRole){
        userRole.dataSets.forEach(function(userAssignedDataSet){
          if(dataSetId == userAssignedDataSet.id){
            result = true;
          }
        });
      });
      return result;
    }

    //checking changes on data entry form
    $scope.$watch('data.dataSetId', function() {
      $localStorage.allowDataEntrySync = true;
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
      for(var key in $scope.data.dataValues){
        if($scope.data.dataValues[key]){
          var value = $scope.data.dataValues[key];
          prepareDataValuesToIndexDb(key,value,false);
          if(dataElement.attributeValues.length > 0){
            extendDataElementFunctions(dataElement,value);
          }
        }
      }
    };

    //function to extend data element functions sample
    var attributeValues = {
      scoreValues:[
        {value:"Yes",figure:0},
        {value:"Partial",figure:0},
        {value:"No",figure:0},
        {value:"[No value]",figure:" "},
        {value:"No value",figure:" "},
        {value:"NA",figure:0}
      ],
      updateScoreValue:function (value){
        var dataElementName = this.name+"_brn_scoreValue";
        var scoreDataElement = getDataElementByName(dataElementName);
        var correctScoreValue= null;
        angular.forEach(this.scoreValues,function(scoreValue){
          if(value == scoreValue.value){
            correctScoreValue=scoreValue.figure;
          }
        });
        //@todo find mechanism of identify co-value for data element so far i just pick first category Option Combos as co-value
        if(correctScoreValue != null && scoreDataElement != null){
          var de = scoreDataElement.id;
          var co = scoreDataElement.categoryCombo.categoryOptionCombos[0].id;
          saveValue(de,co,correctScoreValue);
        }
      },
      events:{onChange:"updateScoreValue"}
    };

    //function to extend data elements functionality
    function extendDataElementFunctions(dataElement,value){
      dataElement.attributeValues.forEach(function(attributeValue){
        if(attributeValue.attribute.name == 'extendFunction'){
          var attributeObject = eval("(" + attributeValue.value + ")");
          angular.extend(dataElement,attributeObject);
          var dataElementValue = angular.isUndefined(value.name)? value:value.name;
          if(dataElement.events.onChange){
            dataElement[dataElement.events.onChange](dataElementValue)
          }
        }
      });
    }

    //function to get data elements by name
    function getDataElementByName(dataElementName){
      var returnedDataElement = null;
      $localStorage.dataSetDataElements.forEach(function(dataElement){
        if(dataElement.name.toLowerCase() == dataElementName.toLowerCase()){
          returnedDataElement = dataElement;
        }
      });
      return returnedDataElement;
    }

    //function to save values from extended function
    function saveValue(dataElementId,categoryComboId,value){
      prepareDataValuesToIndexDb(dataElementId + "-" + categoryComboId,value,false);
    }
    //@todo modify based on  api on docs
    //function to save data values from the form to indexed db
    function prepareDataValuesToIndexDb(key,value,syncStatus){
      var valueToBeStored = null;
      if(value.name){
        valueToBeStored = value.name;
      }else{
        valueToBeStored = value;
      }
      var ou = $localStorage.dataEntryData.orgUnit;
      var pe = $localStorage.dataEntryData.period;
      var dataSetId = $localStorage.dataEntryData.dataSet.id;
      var modelValue = key.split('-');
      var id = dataSetId + '-' +modelValue[0] + '-'+modelValue[1]+'-'+pe+ '-' +ou;
      var dataValue = null;
      var data = null;
      data = {
        "id":id,
        "de": modelValue[0],
        "pe": pe,
        "value": isDatElementHasDateValueDate(modelValue[0]) ? formatDate(valueToBeStored):valueToBeStored,
        "co" : modelValue[1],
        "ou" : ou,
        "cc":$localStorage.dataEntryData.dataSet.categoryCombo.id,
        "cp":$localStorage.dataEntryData.categoryOptionCombosId,
        "sync":syncStatus
      };
      dataSetsServices.getDataValueById(id).then(function(returnedDataValue){
        dataValue = returnedDataValue;
        var canUpdate = false;
        if(dataValue == null ){
          canUpdate = true;
        }else{
          if(dataValue.value != valueToBeStored){
            canUpdate = true;
          }
        }
        if(canUpdate){

          dataSetsServices.saveDataSetDataValue(data);
        }
      },function(){
        dataSetsServices.saveDataSetDataValue(data);
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

    //function to handle formatting of data value for the form with drop down option set
    function isDataElementHasDropDown(dataElementId){
      var result = false;
      var dataElements = $scope.data.selectedDataEntryForm.dataSet.dataElements;
      dataElements.forEach(function(dataElement){
        if(dataElement.id == dataElementId){
          if($scope.hasDataSets(dataElement) && !($scope.isInteger(dataElement.valueType)) && !($scope.isIntegerZeroOrPositive(dataElement.valueType))){
            result = true;
          }
        }
      });
      return result;
    }

    //function to format date as supported on dhis 2
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
      $localStorage.allowDataEntrySync = true;
      var message = "Please wait...";
      ionicToast.show(message, 'bottom', false, 2500);
      $localStorage.dataEntryData.formType = 'DEFAULT';
      $scope.data.loading = false;
      $state.go('app.dataEntryForm');
    };

    //function to trim off brn score values data element
    function trimOffBRNScoreValues(){
      $scope.data.loading = true;
      var dataElements = $localStorage.dataEntryData.dataSet.dataElements;
      var trimmedOffBRNScoreValuesDataElements = [];
      var scoreValuesDataElements = [];
      var counter = 0;
      dataElements.forEach(function(dataElement){
        counter ++;
        var dataElementNameString = dataElement.name.split('_');
        var length = dataElementNameString.length;
        if(dataElementNameString[length -1] != "scorevalue"){
          trimmedOffBRNScoreValuesDataElements.push(dataElement);
        }else{
          scoreValuesDataElements.push(dataElement);
        }
        if(counter == dataElements.length){
          $scope.data.selectedDataEntryForm.dataSet.dataElements = trimmedOffBRNScoreValuesDataElements;
          $localStorage.dataSetDataElements = dataElements;
          $localStorage.dataEntryData.dataSet.dataElements = trimmedOffBRNScoreValuesDataElements;
          $scope.data.loading = false;
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
      $localStorage.allowDataEntrySync = true;
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
      if($scope.data.orgUnit.length > 0 && $scope.data.dataSetId != null){
        $scope.modal.show();
      }else{
        var message = "Please choose both Organisation Unit or Data Entry Form first";
        progressMessage(message);
      }

    };

    //function to get all user assigned orgUnit for tree
    getAllAssignedOrgUnits();
    function getAllAssignedOrgUnits(){
      $scope.data.loading = true;
      userServices.getAssignedOrgUnitFromIndexDb()
        .then(function(orgUnits){
          if(orgUnits.length > 0){
            $scope.data.orgUnits = getSortedOrgUnit(orgUnits);
            $scope.data.loading = false;
          }else {
            getAllAssignedOrgUnits();
          }
        },function(){
          //error
          $scope.data.loading = false;
        })
    }

    //function to get sorted orgUnits
    function getSortedOrgUnit(orgUnits){
      var data = [];
      orgUnits.forEach(function(orgUnit){
        data.push(sortingOrUnit(orgUnit));
      });
      return data;
    }

    //sorting all orgUnits and its children
    function sortingOrUnit(parentOrgUnit){
      if(parentOrgUnit.children) {
        parentOrgUnit.children = $filter('orderBy')(parentOrgUnit.children, 'name');
        parentOrgUnit.children.forEach(function (child,index) {
          parentOrgUnit.children[index]=sortingOrUnit(child);
        });
      }
      return parentOrgUnit;
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
      $scope.data.loading = true;
      var parameter = getDatSetCompletenessParameter();
      dataValueSetServices.completeOnDataSetRegistrations(parameter).then(function(){
        //success on complete form
        $scope.data.isDataSetCompleted = true;
        $scope.data.loading = false;
        progressMessage('Data entry form has been completed successfully');
      },function(){
        //error on complete form
        $scope.data.loading = false;
        progressMessage('Data entry form  has not been completed, it might be due to network connectivity');
      });
    };

    //function to handle form un-completeness
    $scope.unCompleteDataEntryForm = function(){
      $scope.data.loading = true;
      var parameter = getDatSetCompletenessParameter();
      dataValueSetServices.inCompleteOnDataSetRegistrations(parameter).then(function(){
        //success on incomplete form
        $scope.data.isDataSetCompleted = false;
        $scope.data.loading = false;
        progressMessage('Data entry form has been uncompleted successfully');
      },function(){
        //error on incomplete form
        $scope.data.loading = false;
        progressMessage('Data entry form  has not been uncompleted, it might be due to network connectivity');
      });
    };

    $scope.isDataSetCompleted = function(){
      var result = false;
      if($scope.data.isDataSetCompleted){
        result = true;
      }
      return result;
    };
    //function to check data set completeness
    function checkDataSetCompleteness(dataSetValues){
      if(dataSetValues.completeDate){
        $scope.data.isDataSetCompleted = true;
      }else{
        $scope.data.isDataSetCompleted = false;
      }
    }

    //function to get all data set completeness parameters
    function getDatSetCompletenessParameter(){
      var dataEntryForm = $localStorage.dataEntryData;
      var parameter = "ds="+dataEntryForm.dataSet.id+"&pe="+dataEntryForm.period+"&ou="+dataEntryForm.orgUnit;
      if(dataEntryForm.categoryOptionCombosId){
        parameter += "&cc="+dataEntryForm.dataSet.categoryCombo.id+"&cp="+dataEntryForm.categoryOptionCombosId;
      }
      return parameter;
    }

  });
