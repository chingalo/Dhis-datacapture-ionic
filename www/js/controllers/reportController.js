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
    $scope.$watch('data.orgUnitId', function() {
      $scope.data.period = null;
    });

    function updateReports(){
      $scope.data.loading = true;
      reportServices.getAllReportsFromServer()
        .then(function(reports){
          $scope.data.reports = [];
          reports.forEach(function(report){
            if(report.type == "HTML"){
              $scope.data.reports.push(report);
              reportServices.getIndividualReportFromServer(report.id).then(function(reportData){
                reportServices.saveReportToIndexDb(reportData);
              },function(){
                //error
              });
            }
          });
          $scope.data.loading = false;
        },function(){
          //error
          reportServices.getAllReportsFromIndexDb()
            .then(function(reports){
              $scope.data.reports =reports;
              $scope.data.loading = false;
            },function(){
              //error
              $scope.data.loading = false;
            });
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
                $state.go('app.reportsParametersReport');
              }else{
                $scope.data.loading = false;
                $state.go('app.reportsNoParametersReport');
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

  });
