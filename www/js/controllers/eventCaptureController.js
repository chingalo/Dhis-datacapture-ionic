/**
 * Created by chingalo on 3/24/16.
 */
angular.module('dataCapture')
  .controller('eventCaptureController',function($scope,$localStorage,programManagerServices,
                                                userServices,
                                                $filter){

    $scope.data = {};


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
    getAllPrograms();
    function getAllPrograms(){
      programManagerServices.getAllPrograms().then(function(programs){
        alert('Programs Counter : '+programs.length);
      },function(){})
    }

  });
