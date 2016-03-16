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
    'multi-select-tree',
    'ngSanitize'
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

  .controller('mainController', function ($scope, $window, $interval, $state,
                                          userServices, synchronizationServices,
                                          $ionicHistory, $ionicModal, ionicToast,
                                          indicatorsServices, reportServices, constantsServices,
                                          $localStorage, dataSetsServices,
                                          sectionsServices, $indexedDB) {

    //initial variables
    $scope.data = {};
    var url = 'http://41.217.202.50:8080/dhis';

    //function for toaster messages
    function progressMessage(message) {
      ionicToast.show(message, 'bottom', false, 2500);
    }

    function progressTopMessage(message) {
      ionicToast.show(message, 'top', false, 3500);
    }

    //initialization of base url for an app to access as well as auto login for logged in user
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
        var message = 'Please waiting...';
        progressMessage(message);
        startSyncProcess($localStorage.loginUser);
        authenticateUser(username, password);
      }
    }
    $scope.data.baseUrl = $localStorage.baseUrl;

    //initialization of form label preference
    if (angular.isUndefined($localStorage.formLabelPreference)) {
      $localStorage.formLabelPreference = {
        label: 'formName',
        placeHolder: 'formName'
      }
    }


    //function for login into the app
    $scope.login = function () {
      if ($scope.data.baseUrl) {
        var message = "";
        formatBaseUrl($scope.data.baseUrl);
        if ($scope.data.username && $scope.data.password) {
          authenticateUser($scope.data.username, $scope.data.password);
        } else {
          message = 'Please Enter both username and password.';
          progressMessage(message);
        }
      } else {
        message = 'Please Enter server URL.';
        progressMessage(message);
      }
    };

    //function for log out from the system
    $scope.logOut = function () {
      //TODO some logic flow during log out process as reset all data on setting
      $scope.data.loading = true;
      delete $localStorage.loginUser;
      delete $localStorage.dataEntryData;
      delete $localStorage.loginUserData;
      delete $localStorage.selectedReport;
      $ionicHistory.clearCache().then(function () {
        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        synchronizationServices.stopSyncUserLoginData();
        $scope.data.loading = false;
        var message = "You have logged out successfully";
        progressMessage(message);
        $window.location.reload(true);
        $state.go('login');
      });
    };

    //function redirect the landing page f the app
    function directToLandingPage() {
      progressTopMessage("It's ready, kindly enjoy the offline support");
      startSyncProcess($localStorage.loginUser);
      $state.go('app.dataEntry', {}, {location: "replace", reload: true});
    }

    //function to format url
    //todo append http or https if not included at begin
    function formatBaseUrl(baseUrl) {
      var formattedBaseUrl = "";
      var newArray = [];
      var baseUrlString = baseUrl.split('/');
      var length = baseUrlString.length;
      for (var i = 0; i < length; i++) {
        if (baseUrlString[i]) {
          newArray.push(baseUrlString[i]);
        }
      }
      formattedBaseUrl = newArray[0] + '/';
      for (var j = 0; j < newArray.length; j++) {
        if (j != 0) {
          formattedBaseUrl = formattedBaseUrl + '/' + newArray[j];
        }
      }
      return formattedBaseUrl;
    }

    //function handle all authentications to DHIS2 server
    //TODO logic for pull all metadata necessary to support offline support
    //@todo add on user services to authenticate user
    function authenticateUser(username, password) {
      $scope.data.loading = true;
      var base = formatBaseUrl($scope.data.baseUrl);
      $localStorage.baseUrl = base;
      if ($localStorage.loginUser) {
        if ($localStorage.loginUser.password == password && $localStorage.loginUser.username == username) {
          $scope.data.loading = false;
          //redirect to home page
          directToLandingPage();
        }
      } else {
        Ext.Ajax.request({
          url: base + '/dhis-web-commons-security/login.action?failed=false',
          callbackKey: 'callback',
          method: 'POST',
          params: {
            j_username: username,
            j_password: password
          },
          withCredentials: true,
          useDefaultXhrHeader: false,
          success: function () {
            var fields = "fields=[:all],userCredentials[userRoles[dataSets[id,name]]";
            //call checking if user is available
            Ext.Ajax.request({
              url: base + '/api/me.json?' + fields,
              callbackKey: 'callback',
              method: 'GET',
              params: {
                j_username: username,
                j_password: password
              },
              withCredentials: true,
              useDefaultXhrHeader: false,
              success: function (response) {
                $scope.data.password = null;
                try {
                  var userData = JSON.parse(response.responseText);
                  $localStorage.loginUser = {'username': username, 'password': password};
                  $localStorage.loginUserData = userData;
                  addAssignedOrgUnit($localStorage.loginUserData.organisationUnits, base);
                  loadDataSets(base);
                  loadSystemInfo(base);
                } catch (e) {
                  var message = 'Fail to login, please check your username or password';
                  progressMessage(message);
                  $scope.data.loading = false;
                  synchronizationServices.stopSyncUserLoginData();
                }
                $scope.$apply();
              },
              failure: function () {
                $scope.data.password = null;
                var message = 'Fail to login, please server URL or Network connection';
                progressMessage(message);
                $scope.data.loading = false;
                synchronizationServices.stopSyncUserLoginData();
                $scope.$apply();
              }
            });
          },
          failure: function () {
            $scope.data.password = null;
            //fail to connect to the server
            var message = 'Fail to connect to the server, please check server URL or Network connection';
            progressMessage(message);
            $scope.data.loading = false;
            synchronizationServices.stopSyncUserLoginData();
            $scope.$apply();
          }
        });
      }
    }

    //function to load system info
    function loadSystemInfo(base) {
      console.log(base);
      userServices.getSystemInfo(base).then(function(systemInfo){
        $localStorage.systemInfo = systemInfo;
      },function(){
        //error getting system info
      });
    }

    //function to fetching date entry sections
    function loadDataEntrySections(base) {
      $scope.data.loading = true;
      var message = "Downloading available form sections, please wait";
      progressTopMessage(message);
      sectionsServices.getAllSectionsFromServer(base)
        .then(function (sections) {
          sections.forEach(function (section) {
            sectionsServices.getIndividualSectionFromServer(section.id, base)
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
          //saving data entry form sections
          var message = "Complete Saving data entry form sections";
          progressTopMessage(message);
          //loading indicators
          loadIndicators(base);
        }, function () {
          //error
          var message = "Fail to download form sections";
          progressTopMessage(message);
          $scope.data.loading = false;
        });
    }

    //function to fetching indicators
    function loadIndicators(base) {
      $scope.data.loading = true;
      var message = "Downloading available indicators for reports, please wait";
      progressTopMessage(message);
      indicatorsServices.getAllIndicatorsFromServer(base)
        .then(function (indicators) {
          indicators.forEach(function (indicator) {
            indicatorsServices.saveIndicatorIntoIndexDb(indicator);
          });

          var message = "Complete Saving available indicators for report";
          progressTopMessage(message);
          //leading reports
          loadReports(base)
        }, function () {
          //error
          var message = "Fail to download indicators";
          progressTopMessage(message);
          $scope.data.loading = false;
        });
    }

    //function to fetching reports from the server
    function loadReports(base) {
      $scope.data.loading = true;
      var message = "Downloading available reports for offline support, please wait";
      progressTopMessage(message);
      reportServices.getAllReportsFromServer(base)
        .then(function (reports) {
          $scope.data.reports = reports;
          reportServices.saveReportToIndexDb(reports);
          reports.forEach(function (report) {
            reportServices.saveReportToIndexDb(report);
          });

          var message = "Complete saving available reports for offline support";
          progressTopMessage(message);
          //loading all constants
          loadConstants(base)
        }, function () {
          //error
          var message = "Fail to download reports";
          progressTopMessage(message);
          $scope.data.loading = false;
        });
    }

    //function to fetching all constants from the server
    function loadConstants(base) {
      var message = "Downloading available constants for reports, please wait";
      progressTopMessage(message);
      constantsServices.getAllConstantsFromServer(base)
        .then(function (constants) {
          constants.forEach(function (constant) {
            constantsServices.saveConstantIntoIndexDb(constant);
          });
          var message = "Complete saving available constants for reports";
          progressTopMessage(message);
          //redirect to th landing page
          directToLandingPage();
        }, function () {
          $scope.data.loading = false;
          var message = "Fail to download constants for reports";
          progressTopMessage(message);
        });
    }

    //function to fetching all forms from the server
    function loadDataSets(base) {
      $localStorage.baseUrl = base;
      $scope.data.loading = true;
      var message = "Downloading available data entry forms, please wait";
      progressTopMessage(message);
      dataSetsServices.getAllDataSetsFromServer(base).then(function (dataSets) {
        dataSets.forEach(function (dataSet) {
          dataSetsServices.getIndividualDataSetFromServer(dataSet.id, base).then(function (data) {
            $indexedDB.openStore('dataSets', function (dataSetData) {
              dataSetData.upsert(data).then(function () {
                //success
              }, function () {
                //error getting individual data set
              });
            })
          }, function () {
            //error

          });
        });
        var message = "Complete saving available data entry forms";
        progressTopMessage(message);
        //load all data entry sections forms
        loadDataEntrySections(base);
      }, function () {
        //error getting data sets from server
        var message = "Fail to download data entry forms";
        progressTopMessage(message);
        $scope.data.loading = false;
      });
    }

    //function to fetch all orgUnits assigned to the user from server
    function addAssignedOrgUnit(orgUnits, baseUrl) {
      var message = 'fetching all assigned organisation units';
      ionicToast.show(message, 'top', false, 2500);
      orgUnits.forEach(function (orgUnit) {
        userServices.getAssignedOrgUnitChildrenFromServer(orgUnit.id, baseUrl).then(function (OrgUnitChildrenData) {
          $indexedDB.openStore('orgUnits', function (orgUnitsData) {
            orgUnitsData.upsert(OrgUnitChildrenData).then(function () {
              //success
            }, function () {
              //error
            });
          })
        }, function () {
        });

      });
    }

    //Synchronization processing
    function startSyncProcess(user) {
      var time = null;
      if ($localStorage.syncTime) {
        time = $localStorage.syncTime;
      }
      synchronizationServices.startSync(time);
      synchronizationServices.syncUserLoginData(user);
    }
  })

  .config(function ($stateProvider, $urlRouterProvider, $indexedDBProvider, $ionicConfigProvider) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $indexedDBProvider
      .connection('hisptz')
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

      })
      .upgradeDatabase(2, function (event, db, tx) {
        var dataSets = db.createObjectStore('indicators', {keyPath: 'id'});
        dataSets.createIndex('id_index', 'id', {unique: true});
      })
      .upgradeDatabase(3, function (event, db, tx) {
        var dataSets = db.createObjectStore('constants', {keyPath: 'id'});
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

      .state('app.help', {
        url: '/help',
        views: {
          'menuContent': {
            templateUrl: 'templates/help.html',
            controller: 'helpController'
          }
        }
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
            templateUrl: 'templates/reportsList.html',
            controller: 'reportController'
          }
        }
      })
      .state('app.reportsParametersForm', {
        url: '/reports-parameters-form',
        views: {
          'menuContent': {
            templateUrl: 'templates/reportsParametersForm.html',
            controller: 'reportController'
          }
        }
      })
      .state('app.generatedReport', {
        url: '/generated-report',
        views: {
          'menuContent': {
            templateUrl: 'templates/generatedReport.html',
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
  .filter('paginationFilter', function () {
    return function (input, start) {
      start = +start; //parse to int
      return input.slice(start);
    }
  })
  .filter('to_trusted_html', ['$sce', function ($sce) {
    return function (text) {
      return $sce.trustAsHtml(text);
    };
  }])
  .directive('tooltip', function () {
    return {
      restrict: 'C',
      link: function (scope, element, attrs) {
        if (attrs.title) {
          var $element = $(element);
          $element.attr("title", attrs.title)
          $element.tooltipster({
            animation: attrs.animation,
            trigger: "click",
            position: "top",
            positionTracker: true,
            maxWidth: 500,
            contentAsHTML: true
          });
        }
      }
    };
  })
;
