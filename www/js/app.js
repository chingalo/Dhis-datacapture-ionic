// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('dataCapture', [
    'ionic',
    'ionic-toast',
    'ngStorage',
    'indexedDB',
    'ngSanitize',
    'ui.date',
    'treeControl'
  ])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .controller('mainController', function ($scope,$interval,$state,userServices,synchronizationServices,$ionicHistory,$ionicModal, ionicToast, $localStorage, dataSetsServices, sectionsServices, $indexedDB) {

    $scope.data = {};
    var url = 'http://41.217.202.50:8080/dhis';

    //function for toaster messages
    function progressMessage(message) {
      ionicToast.show(message, 'bottom', false, 2500);
    }

    if (!$localStorage.baseUrl) {
      $localStorage.baseUrl = url;
    }
    else {
      //authenticate using local storage data of login user
      if ($localStorage.loginUser) {
        var username = $localStorage.loginUser.username;
        var password = $localStorage.loginUser.password;
        $scope.data.baseUrl = $localStorage.baseUrl;
        $scope.data.username = username;
        $scope.data.password = password;
        var message = 'Please waiting, we try to authenticate you to server';
        progressMessage(message);
        authenticateUser(username, password);
      }
    }

    $scope.data.baseUrl = $localStorage.baseUrl;

    $scope.login = function () {
      if ($scope.data.baseUrl) {
        if ($scope.data.username && $scope.data.password) {
          authenticateUser($scope.data.username, $scope.data.password);
        } else {
          var message = 'Please Enter both username and password.';
          progressMessage(message);
        }
      } else {
        var message = 'Please Enter server URL.';
        progressMessage(message);
      }
    };

    $scope.logOut = function () {
      //TODO some logic flow during log out process

      delete $localStorage.loginUser;
      delete $localStorage.dataEntryData;
      delete $localStorage.loginUserData;
      delete $localStorage.selectedReport;
      $ionicHistory.clearCache().then(function() {

        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({ disableBack: true, historyRoot: true });
        $state.go('login');
      });
    };

    //function handle all authentications to DHIS2 server
    //TODO logic for pull all metadata necessary to support offline support
    function authenticateUser($username, $password) {

      $scope.data.loading = true;

      var base = $scope.data.baseUrl;
      $localStorage.baseUrl = base;
      Ext.Ajax.request({
        url: base + '/dhis-web-commons-security/login.action?failed=false',
        callbackKey: 'callback',
        method: 'POST',
        params: {
          j_username: $username,
          j_password: $password
        },
        withCredentials: true,
        useDefaultXhrHeader: false,
        success: function () {

          //call checking if user is available
          Ext.Ajax.request({
            url: base + '/api/me.json',
            callbackKey: 'callback',
            method: 'GET',
            params: {
              j_username: $username,
              j_password: $password
            },
            withCredentials: true,
            useDefaultXhrHeader: false,
            success: function (response) {

              $scope.data.password = null;
              try {
                var userData = JSON.parse(response.responseText);
                $localStorage.loginUser = {'username': $username, 'password': $password};
                $localStorage.loginUserData = userData;

                addAssignedOrgUnit($localStorage.loginUserData.organisationUnits,base);
                $scope.data.loading = false;
                loadDataSets(base);
                //redirect to landing page for success login
                $state.go('app.dataEntry');

              } catch (e) {
                var message = 'Fail to login, please check your username or password';
                progressMessage(message);
                $scope.data.password = null;
                $scope.data.loading = false;
              }

              $scope.$apply();
            },
            failure: function () {

              $scope.data.password = null;
              var message = 'Fail to login, please Check your network';
              progressMessage(message);
              $scope.data.loading = false;
              $scope.$apply();
            }
          });

        },
        failure: function () {

          $scope.data.password = null;
          //fail to connect to the server
          var message = 'Fail to connect to the server, please check server URL';
          progressMessage(message);
          $scope.data.loading = false;
          $scope.$apply();
        }
      });
    }

    function loadDataEntrySections(base) {
      sectionsServices.getAllSectionsFromServer(base)
        .then(function (sections) {
          sections.forEach(function (section) {
            sectionsServices.getIndividualSectionFromServer(section.id,base)
              .then(function (data) {
                $indexedDB.openStore('sections', function (dataSetData) {
                  dataSetData.upsert(data).then(function () {
                    //success
                  }, function () {
                    //error
                  });
                });
              }, function () {
                //error
              });
          });
        }, function () {
        });
    }

    /*
     *function to fetching all forms
     */
    function loadDataSets(base) {
      $localStorage.baseUrl = base;
      //load all data entry sections forms
      loadDataEntrySections(base);
      $scope.data.loading = true;
      $scope.$apply();
      dataSetsServices.getAllDataSetsFromServer(base).then(function (dataSets) {
        dataSets.forEach(function (dataSet) {
          dataSetsServices.getIndividualDataSetFromServer(dataSet.id,base).then(function (data) {
            $indexedDB.openStore('dataSets', function (dataSetData) {
              dataSetData.upsert(data).then(function () {
                //success
              }, function () {
                //error
              });
            })
          }, function () {
            //error
          });
        });
        $scope.data.loading = false;

      }, function () {
        //error
        $scope.data.loading = false;
      });
    }

    function addAssignedOrgUnit(orgUnits,baseUrl) {
      deleteAssignedOrgUnit();
      var message = 'Please wait to sync facility';
      ionicToast.show(message, 'top', false, 2500);
      orgUnits.forEach(function (orgUnit) {
        userServices.getAssignedOrgUnitChildrenFromServer(orgUnit.id,baseUrl).then(function(OrgUnitChildrenData){
          $indexedDB.openStore('orgUnits', function (orgUnitsData) {
            orgUnitsData.upsert(OrgUnitChildrenData).then(function () {
              //success
            }, function () {
              //error
            });
          })
        },function(){

        });

      });
    }

    function deleteAssignedOrgUnit() {
      $indexedDB.openStore('orgUnits', function (orgUnits) {
        orgUnits.clear().then(function () {
          //success
        }, function () {
          //error
        })
      })
    }

    /*
     Synchronization processing
     */
    synchronizationServices.startSync();

  })

  .config(function ($stateProvider, $urlRouterProvider, $indexedDBProvider) {

    $indexedDBProvider
      .connection('Dhis2_Data_Capture_v2')
      .upgradeDatabase(1, function (event, db, tx) {

        var dataSets = db.createObjectStore('dataSets', {keyPath: 'id'});
        dataSets.createIndex('id_index', 'id', {unique: true});
        dataSets.createIndex('name_index', 'name', {unique: false});

        var dataSets = db.createObjectStore('reports', {keyPath: 'id'});
        dataSets.createIndex('id_index', 'id', {unique: true});
        dataSets.createIndex('name_index', 'name', {unique: false});

        var dataSets = db.createObjectStore('sections', {keyPath: 'id'});
        dataSets.createIndex('id_index', 'id', {unique: true});
        dataSets.createIndex('name_index', 'name', {unique: false});

        var dataSets = db.createObjectStore('orgUnits', {keyPath: 'id'});
        dataSets.createIndex('id_index', 'id', {unique: true});

        var dataSets = db.createObjectStore('dataValues', {keyPath: 'id'});
        dataSets.createIndex('id_index', 'id', {unique: true});

      });

    $stateProvider

      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'mainController'
      })

      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html'
      })

      .state('app.dataEntry', {
        url: '/data-entry',
        views: {
          'menuContent': {
            templateUrl: 'templates/dataEntry.html',
            controller: 'dataEntryController'
          }
        }
      })
      .state('app.dataEntryForm', {
        url: '/data-entry-form',
        views: {
          'menuContent': {
            templateUrl: 'templates/dataEntryForm.html',
            controller: 'dataEntryController'
          }
        }
      })

      .state('app.reports', {
        url: '/reports',
        views: {
          'menuContent': {
            templateUrl: 'templates/reports.html',
            controller: 'reportController'
          }
        }
      })
      .state('app.reportsParametersReport', {
        url: '/reports-parameters-report',
        views: {
          'menuContent': {
            templateUrl: 'templates/reportsParametersReport.html',
            controller: 'reportController'
          }
        }
      })
      .state('app.reportsNoParametersReport', {
        url: '/reports-no-parameters-report',
        views: {
          'menuContent': {
            templateUrl: 'templates/reportsNoParametersReport.html',
            controller: 'reportController'
          }
        }
      })

      .state('app.profile', {
        url: '/profile',
        views: {
          'menuContent': {
            templateUrl: 'templates/profile.html',
            controller: 'userProfileController'
          }
        }
      })

      .state('app.settings', {
        url: '/settings',
        views: {
          'menuContent': {
            templateUrl: 'templates/settings.html',
            controller: 'settingController'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  })
;
