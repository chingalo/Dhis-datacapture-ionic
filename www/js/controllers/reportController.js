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

    if($localStorage.reportParams){
      reportParams = $localStorage.reportParams;
      console.log(reportParams);
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
    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnit', function(){
      delete $localStorage.reportParams;
      $scope.data.period = null;
    });

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
          if(reports.length <= 0){
            progressMessage('There are no report available at the moment');
          }
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
    $scope.changePeriodInterval = function(type){
      var year = null;
      if(type =='next'){
        year = parseInt($scope.data.periodOption[0].year);
        year +=9;
      }else{
        var periodOptionLength = $scope.data.periodOption.length;
        periodOptionLength = parseInt(periodOptionLength);
        year = $scope.data.periodOption[periodOptionLength-1].year;
      }
      $scope.data.periodOption = getPeriodOption(year);
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

    $scope.generateReport = function(type){
      if(type == 'withParameter'){
        //if( && )
        $localStorage.reportParams = {
          ou:$scope.data.orgUnit[0].id,
          pe:$scope.data.period
        }
      }
      $state.go('app.generatedReport');
    };

    periodOption();
    function periodOption(){
      var year = 2016;
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
