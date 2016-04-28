/**
 * Created by chingalo on 3/24/16.
 */
angular.module('dataCapture')
  .controller('eventCaptureController', function ($scope, $localStorage, userServices,
                                                  ionicToast,
                                                  $filter, programManagerServices) {

    $scope.data = {};
    $scope.data.orgUnit = [];
    $scope.data.selectedProgram = {};

    //checking changes on selected orgUnit
    $scope.$watch('data.orgUnit', function () {
      $scope.data.programId = null;
      if ($scope.data.orgUnit.length > 0) {
        progressMessage('Loading programs from local storage');
        $scope.data.loading = true;
        programManagerServices.getAllPrograms()
          .then(function (programs) {
            $scope.data.programs = getProgramsByOrgUnit(programs, $scope.data.orgUnit[0].id);
            progressMessage($scope.data.programs.length + ' programs found in ' + $scope.data.orgUnit[0].name);
            $scope.data.loading = false;
          }, function () {
            progressMessage('Fail to loading programs from local storage');
            $scope.data.loading = false;
          });
      }
    });
    //checking changes on programs
    $scope.$watch('data.programId', function () {
      if ($scope.data.programId) {
        $scope.data.loading = true;
        $scope.data.selectedProgram = {};
        $scope.data.programs.forEach(function (program) {
          if ($scope.data.programId == program.id){
            $scope.data.selectedProgram = program;
            $scope.data.loading = false;
          }
        });
      }
    });

    //function to fetching programs based on selected orgUnit
    function getProgramsByOrgUnit(programs, orgUnitId) {
      var programsData = [];
      $scope.data.loading = true;
      programs.forEach(function (program) {
        program.organisationUnits.forEach(function (orgUnit) {
          if (orgUnit.id == orgUnitId) {
            programsData.push({
              id: program.id,
              name: program.name
            });
          }
        });
      });
      $scope.data.loading = false;
      return programsData;
    }

    //function to showing toaster message/notifications
    function progressMessage(message) {
      ionicToast.show(message, 'top', false, 2000);
    }

    //function to get all user assigned orgUnit for tree
    getAllAssignedOrgUnits();
    function getAllAssignedOrgUnits() {
      $scope.data.loading = true;
      userServices.getAssignedOrgUnitFromIndexDb()
        .then(function (orgUnits) {
          if (orgUnits.length > 0) {
            $scope.data.orgUnits = getSortedOrgUnit(orgUnits);
            $scope.data.loading = false;
          } else {
            getAllAssignedOrgUnits();
          }
        }, function () {
          //error
          $scope.data.loading = false;
        })
    }

    //function to get sorted orgUnits
    function getSortedOrgUnit(orgUnits) {
      var data = [];
      orgUnits.forEach(function (orgUnit) {
        data.push(sortingOrUnit(orgUnit));
      });
      return data;
    }

    //sorting all orgUnits and its children
    function sortingOrUnit(parentOrgUnit) {
      if (parentOrgUnit.children) {
        parentOrgUnit.children = $filter('orderBy')(parentOrgUnit.children, 'name');
        parentOrgUnit.children.forEach(function (child, index) {
          parentOrgUnit.children[index] = sortingOrUnit(child);
        });
      }
      return parentOrgUnit;
    }

  });
