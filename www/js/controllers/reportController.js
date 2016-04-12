/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('reportController',function($scope,$state,ionicToast,$filter,
                                          $localStorage,reportServices,
                                          periodSelectionServices,
                                          userServices,$ionicModal){

    //variable for reports
    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;
    $scope.data.reports = null;
    $scope.data.orgUnits = [];
    $scope.data.orgUnit = [];
    //pagination variables
    $scope.currentPage = 0;
    $scope.pageSize = 10;

    //function to handle pagination on report list
    $scope.numberOfPages=function(){
      if($scope.data.reports){
        return Math.ceil($scope.data.reports.length/$scope.pageSize);
      }else{
        return 0;
      }
    };
    if($localStorage.dhis2){
      dhis2.report = $localStorage.dhis2.report;
    }

    //checking for selection of report
    if(! $localStorage.selectedReport){
      loadReportsFromIndexDb();
    }else{
      $scope.data.selectedReport = $localStorage.selectedReport;
    }

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'bottom', false, 2500);
    }

    function  topProgressMessage(message){
      ionicToast.show(message, 'top', false, 1500);
    }

    //function to reload report form server
    $scope.reloadReports = function(){
      updateReports();
    };

    //function to load reports from index db
    function loadReportsFromIndexDb(){
      reportServices.getAllReportsFromIndexDb()
        .then(function(reports){
          var reportLength = angular.isUndefined(reports.length)? 0: reports.length;
          progressMessage('There are '+ reportLength + ' report(s) available at the moment on Offline storage');
          $scope.data.reports =reports;
          $scope.data.loading = false;
        },function(){
          //error
          var message = "Fail to load reports from Offline storage ";
          progressMessage(message);
        });
    }

    //function to take updates of reports from index db
    function updateReports(){
      $scope.data.loading = true;
      reportServices.getAllReportsFromServer($localStorage.baseUrl)
        .then(function(reports){
          var reportLength = angular.isUndefined(reports.length)? 0: reports.length;
          progressMessage('There are '+ reportLength + ' report(s) available at the moment from server');
          if(! angular.isUndefined(reports)){
            $scope.data.reports = reports;
            reportServices.saveReportToIndexDb(reports);
            reports.forEach(function(report){
              reportServices.saveReportToIndexDb(report);
            });
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$apply();
          }
          $scope.data.loading = false;
        },function(){
          //error
          var message = "Fail to load reports from server";
          progressMessage(message);
          $scope.data.loading = false;
        });
    }

    //function to handle selected report
    $scope.selectReport = function(reportId){
      delete $localStorage.selectedReport;
      var message = "Please waiting for report's details are being loaded";
      progressMessage(message);
      getReportDetails(reportId);
    };

    //function to get report details
    function getReportDetails(reportId){
      $scope.data.loading = true;
      reportServices.getAllReportsFromIndexDb()
        .then(function(reports){
          reports.forEach(function(report){
            if(report.id == reportId){
              $localStorage.selectedReport = report;
              if(report.reportParams.paramOrganisationUnit || report.reportParams.paramOrganisationUnit){
                $scope.data.loading = false;
                $state.go('app.reportsParametersForm');
              }else{
                $scope.data.loading = false;
                $scope.generateReport('withOutParameter');
              }
            }
          });
        },function(){
          //error
          $scope.data.loading = false;
        });
    }

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

    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnit', function(){
      delete $localStorage.reportParams;
      $scope.data.period = null;
    });

    //function to control changes of period option selection
    $scope.changePeriodInterval = function(type){
      var year = null;
      if(type =='next'){
        year = parseInt($scope.data.periodOption[0].periodValue);
        year +=9;
      }else{
        var periodOptionLength = $scope.data.periodOption.length;
        periodOptionLength = parseInt(periodOptionLength);
        year = $scope.data.periodOption[periodOptionLength-1].periodValue;
      }
      if(year > parseInt(new Date().getFullYear())){
        var message = "There no period option further than this at moment";
        ionicToast.show(message, 'top', false, 1500);
      }else{
        $scope.data.periodOption = getPeriodOption(year);
      }

    };

    //function for pop up model
    $ionicModal.fromTemplateUrl('templates/modal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    //function to control closing of pop up modle
    $scope.close = function() {
      $scope.modal.hide();
    };

    //function to control period selection
    $scope.periodSelect = function(){
      $scope.close();
    };

    //function to control open up for model
    $scope.openModal = function(modalType){
      $scope.data.modalType = modalType;
      $scope.modal.show();
    };

    //function for generate view for parameter
    $scope.generateReport = function(type){
      var message = "";
      if(type == 'withParameter'){
        if(isParameterMeet()){
          var selectedOrUnit = {
            id : $scope.data.orgUnit[0].id,
            name : $scope.data.orgUnit[0].name,
            code : $scope.data.orgUnit[0].code
          };
          $localStorage.dhis2 = {
            report : {
              organisationUnit : selectedOrUnit,
              organisationUnitHierarchy : getOrganisationUnitHierarchy($scope.data.orgUnit[0].ancestors,selectedOrUnit),
              organisationUnitChildren : $scope.data.orgUnit[0].children,
              period :$scope.data.period
            }
          };
          message = "Please waiting to load report data";
          topProgressMessage(message);
          $state.go('app.generatedReport');
        }else{
          message = "Please select report parameter(s) first";
          topProgressMessage(message);
        }
      }
      else{
        message = "Please waiting to load report data";
        topProgressMessage(message);
        $state.go('app.generatedReport');
      }
    };

    //function to checking to checking if report parameter met
    function isParameterMeet(){
      var result = false;
      var report = $localStorage.selectedReport;
      if(report.reportParams.paramOrganisationUnit && report.reportParams.paramOrganisationUnit){
        if($scope.data.orgUnit[0] && $scope.data.period){
          result =true;
        }
      }else{
        if($scope.data.period || $scope.data.orgUnit[0]){
          result =true;
        }
      }
      return result;
    }

    //function to get organisation hierarchy for a given orgUnit
    function getOrganisationUnitHierarchy(orgUnitAncestors,selectedOrUnit){
      var data = [];
      var length = orgUnitAncestors.length;
      data.push(selectedOrUnit);
      for(var i=0 ;i < length; i ++){
        var index = length - [i + 1];
        data.push(orgUnitAncestors[index])
      }
      return data;
    }

    //function to render period selection
    periodOption();
    function periodOption(){
      var year = parseInt(new Date().getFullYear());
      $scope.data.periodOption = getPeriodOption(year);
    }

    //function to get period options
    function getPeriodOption(year){
      var period = [];
      for(var i = 0; i < 10; i ++){
        var yearDis = year --;
        period.push({
          displayValue : yearDis,
          periodValue : yearDis
        });
      }
      return period;
    }

    //function to get display name for period
    $scope.getPeriodDisplayValue=function(period){
      var periodDisplayValue = '';
      $scope.data.periodOption.forEach(function(periodData){
        if(periodData.periodValue == period){
          periodDisplayValue = periodData.displayValue;
        }
      });
      return periodDisplayValue;
    }

  });
