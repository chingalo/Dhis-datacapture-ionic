/**
 * Created by joseph on 2/1/16.
 */
angular.module('dataCapture')
  .controller('reportController',function($scope,$state,ionicToast,
                                          $localStorage,reportServices,
                                          periodSelectionServices,
                                          userServices,$ionicModal){
    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;
    $scope.data.reports = null;
    $scope.data.orgUnits = [];
    $scope.data.orgUnit = [];
    //pagination variables
    $scope.currentPage = 0;
    $scope.pageSize = 10;
    $scope.numberOfPages=function(){
      if($scope.data.reports){

        return Math.ceil($scope.data.reports.length/$scope.pageSize);
      }else{
        return 0;
      }
    };
    if($localStorage.dhis2){
      dhis2 = $localStorage.dhis2;
    }
    //@todo checking this logic
    if(! $localStorage.selectedReport){
      updateReports();
    }else{
      $scope.data.selectedReport = $localStorage.selectedReport;
      reportServices.getAllReportsFromIndexDb()
        .then(function(reports){

          $scope.data.reports =reports;
          $scope.data.loading = false;
        },function(){
          //error
          $scope.data.loading = false;
        });
    }

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'bottom', false, 2500);
    }

    $scope.reloadReports = function(){
      updateReports();
    };
    function updateReports(){
      $scope.data.loading = true;
      reportServices.getAllReportsFromServer()
        .then(function(reports){
          $scope.data.reports = reports;
          reportServices.saveReportToIndexDb(reports);
          reports.forEach(function(report){
            reportServices.saveReportToIndexDb(report);
          });
          progressMessage('There are '+ reports.length + ' report(s) available at the moment');
          $scope.data.loading = false;
        },function(){
          //error
          $scope.data.loading = false;
        });
    }
    $scope.selectReport = function(reportId){
      delete $localStorage.selectedReport;
      getReportDetails(reportId);
    };
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
    $scope.generateReportParameters = function(){
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
    };

    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnit', function(){
      delete $localStorage.reportParams;
      $scope.data.period = null;
    });
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
    };
    $scope.openModal = function(modalType){
      $scope.data.modalType = modalType;
      $scope.modal.show();
    };

    //@todo checking if report parameters meet
    $scope.generateReport = function(type){
      if(type == 'withParameter'){
        //if( && )
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
      }
      $state.go('app.generatedReport');
    };

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

    periodOption();
    function periodOption(){
      var year = parseInt(new Date().getFullYear());
      $scope.data.periodOption = getPeriodOption(year);
    }
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
