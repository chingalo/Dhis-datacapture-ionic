/**
 * Created by chingalo on 3/10/16.
 */

angular.module('dataCapture')
  .controller('helpController', function ($scope) {

    //configurations of app in built help
    $scope.groups = [];
    $scope.groups.push(
      {
        name: 'Data Entry Form',
        type: 'dataEntry'
      },
      {
        name : 'Html Report Generation',
        type : 'reports'
      }
    );

    /*
     * if given group is the selected group, deselect it
     * else, select the given group
     */
    $scope.toggleGroup = function (group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
      }
    };
    $scope.isGroupShown = function (group) {
      return $scope.shownGroup === group;
    };

  });
