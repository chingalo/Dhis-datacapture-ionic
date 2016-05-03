// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('dataCapture', [
    'ionic',
    'ionic-toast',
    'ngStorage',
    'ngSanitize',
    'ui.date',
    'multi-select-tree',
    'ngSanitize',
    'angular-spinkit'
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

  .controller('mainController', function ($scope, $window, $interval, $state,$http,Base64,
                                          userServices, synchronizationServices,
                                          $ionicHistory, $ionicModal, ionicToast,programManagerServices,
                                          indicatorsServices, reportServices, constantsServices,
                                          $localStorage, dataSetsServices, sqlLiteServices, $q,
                                          sectionsServices) {

    //initial variables
    $scope.data = {};
    var url = 'http://41.217.202.50:8080/dhis';

    //function for toaster messages
    function progressMessage(message) {
      ionicToast.show(message, 'bottom', false, 2500);
    }

    //creation of database for an app
    initDatabase();
    function initDatabase() {
      document.addEventListener("deviceready", onDeviceReady, false);
      function onDeviceReady() {
        var db = window.sqlitePlugin.openDatabase({name: "hisptz.db"});
        var tables = ['dataSets', 'reports', 'sections', 'orgUnits', 'indicators', 'constants','programs'];
        tables.forEach(function (table) {
          db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS ' + table + ' (id TEXT primary key, data LONGTEXT)', [],
              function (tx, result) {
                //alert("Table "+table+" created successfully");
              },
              function (error) {
                //alert("Error occurred while creating the table "+table+".");
              });
          });
        });
        db.transaction(function (tx) {
          tx.executeSql('CREATE TABLE IF NOT EXISTS dataValues (id TEXT primary key, data LONGTEXT, isSync INTEGER)', [],
            function (tx, result) {
              //alert("Table dataValues created successfully");
            },
            function (error) {
              //alert("Error occurred while creating the table dataValues.");
            });
        });
      }
    }

    function progressTopMessage(message) {
      ionicToast.show(message, 'top', false, 3500);
    }

    $scope.deleteLocalStorageData = function () {
      delete $localStorage.allowDataEntrySync;
    };
    //initialization of base url for an app to access as well as auto login for logged in user
    if (!$localStorage.baseUrl) {
      $localStorage.baseUrl = url;
    }
    else {
      //authenticate using local storage data of login user
      if ($localStorage.loginUser) {
        $scope.deleteLocalStorageData();
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

    //initialize data downloading on login process
    if (angular.isUndefined($scope.data.dataDownLoadingMessage)) {
      $scope.data.dataDownLoadingMessage = [];
    }
    //function to get data downloading percentage
    var numberOfProcess = 17;
    $scope.getDataDownLoadingPercentage = function(){
      return(Math.ceil(($scope.data.dataDownLoadingMessage.length/numberOfProcess) * 100))
    };
    if (angular.isUndefined($localStorage.dataDownLoadingStatus)) {
      $localStorage.dataDownLoadingStatus = false;
    }
    if (angular.isUndefined($localStorage.dataDownLoadingTracker)) {
      $localStorage.dataDownLoadingTracker = [];
    }

    //function for login into the app
    $scope.login = function () {
      if ($scope.data.baseUrl) {
        var message = "";
        formatBaseUrl($scope.data.baseUrl);
        if ($scope.data.username && $scope.data.password) {
          $scope.data.dataDownLoadingMessage = [];
          $localStorage.dataDownLoadingStatus = false;
          $scope.data.dataDownLoadingMessage.push('Authenticating user');
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
      userServices.initiateLogOutProcess().then(function(){
        $state.go('login');
        $window.location.reload();
        $scope.data.loading = false;
      },function(){
        progressMessage("The app fail to empty some data during logout");
      });
    };

    //function redirect the landing page f the app
    function directToLandingPage() {
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
      if ($localStorage.loginUser && $localStorage.dataDownLoadingStatus) {
        if ($localStorage.loginUser.password == password && $localStorage.loginUser.username == username) {
          $scope.data.loading = false;
          $http.defaults.headers.common.Authorization = 'Basic ' + Base64.encode(username + ':' + password);
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
            var fields = "fields=[:all],userCredentials[userRoles[name,dataSets[id,name]]";
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
                  loadSystemInfo(base);
                  loadDataSets(base);
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
      var processName = "systemInfo";
      $scope.data.dataDownLoadingMessage.push('Loading system information');
      if (!isProcessCompleted(processName)) {
        userServices.getSystemInfo(base).then(function (systemInfo) {
          $localStorage.systemInfo = systemInfo;
          $localStorage.dataDownLoadingTracker.push(processName);
        }, function () {
          //error getting system info
        });
      }
    }

    //function to fetching date entry sections
    function loadDataEntrySections(base) {
      userServices.preRequestDataCounter('sections',base)
        .then(function(sectionCounter){
          $scope.data.dataDownLoadingMessage.push('Downloading '+sectionCounter+' form sections');
          var processName = "dataEntrySection";
          if (isProcessCompleted(processName)) {
            loadPrograms(base);
          } else {
            $scope.data.loading = true;
            sectionsServices.getAllSectionsFromServer(base)
              .then(function (sections) {
                var tableName = 'sections';
                var promises = [];
                $scope.data.dataDownLoadingMessage.push('Saving '+sectionCounter+' form sections');
                sections.forEach(function (section) {
                  var id = section.id;
                  promises.push(
                    sqlLiteServices.insertData(tableName, id, section)
                      .then(function (pass) {
                        //alert('success : ' + JSON.stringify(pass));
                      }, function (fail) {
                        //alert('Fail : ' + JSON.stringify(fail));
                      })
                  )
                });
                $q.all(promises).then(function () {
                  //loading programs
                  loadPrograms(base);
                  $localStorage.dataDownLoadingTracker.push(processName);
                }, function () {
                  var message = "Fail to save sections";
                  progressTopMessage(message);
                  $scope.data.loading = false;
                });
              }, function () {
                //error
                var message = "Fail to download form sections";
                progressTopMessage(message);
                $scope.data.loading = false;
              });
          }
        },function(){
          var message = "Fail to determine number of sections from the server";
          progressTopMessage(message);
          $scope.data.loading = false;
        });
    }

    function loadPrograms(base){
      userServices.preRequestDataCounter('programs',base)
        .then(function(programCounter){
          $scope.data.loading = true;
          $scope.data.dataDownLoadingMessage.push('Downloading '+programCounter+' programs');
          var processName = "programs";
          if (isProcessCompleted(processName)) {
            loadIndicators(base);
          } else {
            programManagerServices.getAllProgramsFromServer(base)
              .then(function (programs) {
                var promises = [];
                var tableName = "programs";
                $scope.data.dataDownLoadingMessage.push('Saving '+programCounter+' programs');
                programs.forEach(function (program) {
                  var id = program.id;
                  promises.push(
                    sqlLiteServices.insertData(tableName, id, program)
                      .then(function (pass) {
                        //success
                      }, function (fail) {
                        //fail
                      })
                  )
                });
                $q.all(promises).then(function () {
                  //loading indicators
                  loadIndicators(base);
                  $localStorage.dataDownLoadingTracker.push(processName);
                }, function () {
                  var message = "Fail to save programs";
                  progressTopMessage(message);
                  $scope.data.loading = false;
                });
              }, function () {
                //error
                var message = "Fail to download programs";
                progressTopMessage(message);
                $scope.data.loading = false;
              });
          }
        },function(){
          var message = "Fail to determine number of programs from the server";
          progressTopMessage(message);
          $scope.data.loading = false;
        });
    }

    //function to fetching indicators
    function loadIndicators(base) {
      userServices.preRequestDataCounter('indicators',base)
        .then(function(indicatorCounter){
          $scope.data.loading = true;
          $scope.data.dataDownLoadingMessage.push('Downloading '+indicatorCounter+' indicators');
          var processName = "indicators";
          if (isProcessCompleted(processName)) {
            loadReports(base);
          } else {
            indicatorsServices.getAllIndicatorsFromServer(base)
              .then(function (indicators) {
                var promises = [];
                var tableName = "indicators";
                $scope.data.dataDownLoadingMessage.push('Saving '+indicatorCounter+' indicators');
                indicators.forEach(function (indicator) {
                  var id = indicator.id;
                  promises.push(
                    sqlLiteServices.insertData(tableName, id, indicator)
                      .then(function (pass) {
                        //alert('success : ' + JSON.stringify(pass));
                      }, function (fail) {
                        //alert('Fail : ' + JSON.stringify(fail));
                      })
                  )
                });
                $q.all(promises).then(function () {
                  //loading reports
                  loadReports(base);
                  $localStorage.dataDownLoadingTracker.push(processName);
                }, function () {
                  var message = "Fail to save indicators";
                  progressTopMessage(message);
                  $scope.data.loading = false;
                });
              }, function () {
                //error
                var message = "Fail to download indicators";
                progressTopMessage(message);
                $scope.data.loading = false;
              });
          }
        },function(){
          var message = "Fail to determine number of indicators from the server";
          progressTopMessage(message);
          $scope.data.loading = false;
        });
    }

    //function to fetching reports from the server
    function loadReports(base) {
      userServices.preRequestDataCounter('reports',base)
        .then(function(reportCounter){
          var processName = 'reports';
          $scope.data.dataDownLoadingMessage.push('Downloading '+reportCounter+' reports');
          if (isProcessCompleted(processName)) {
            loadConstants(base);
          } else {
            $scope.data.loading = true;
            reportServices.getAllReportsFromServer(base)
              .then(function (reports) {
                $scope.data.reports = reports;
                var promises = [];
                var tableName = "reports";
                $scope.data.dataDownLoadingMessage.push('Saving'+reportCounter+' reports');
                reports.forEach(function (report) {
                  var id = report.id;
                  promises.push(
                    sqlLiteServices.insertData(tableName, id, report)
                      .then(function (pass) {
                        //alert('success : ' + JSON.stringify(pass));
                      }, function (fail) {
                        //alert('Fail : ' + JSON.stringify(fail));
                      })
                  )
                });
                $q.all(promises).then(function () {
                  //loading all constants
                  loadConstants(base);
                  $localStorage.dataDownLoadingTracker.push(processName);
                }, function () {
                  var message = "Fail to save reports";
                  progressTopMessage(message);
                  $scope.data.loading = false;
                });
              }, function () {
                //error
                var message = "Fail to download reports";
                progressTopMessage(message);
                $scope.data.loading = false;
              });
          }
        },function(){
          var message = "Fail to determine number of reports from the server";
          progressTopMessage(message);
          $scope.data.loading = false;
        });


    }

    //function to fetching all constants from the server
    function loadConstants(base) {
      userServices.preRequestDataCounter('constants',base)
        .then(function(constantCounter){
          var processName = "constants";
          $scope.data.dataDownLoadingMessage.push('Downloading '+constantCounter+' constants for reports');
          if (isProcessCompleted(processName)) {
            $scope.data.dataDownLoadingMessage.push('');
            $localStorage.dataDownLoadingStatus = true;
            //redirect to th landing page
            directToLandingPage();
          } else {
            constantsServices.getAllConstantsFromServer(base)
              .then(function (constants) {
                $scope.data.dataDownLoadingMessage.push('Saving '+constantCounter+' constants for reports');
                var promises = [];
                var tableName = "constants";
                constants.forEach(function (constant) {
                  var id = constant.id;
                  promises.push(
                    sqlLiteServices.insertData(tableName, id, constant)
                      .then(function (pass) {
                        //alert('success : ' + JSON.stringify(pass));
                      }, function (fail) {
                        //alert('Fail : ' + JSON.stringify(fail));
                      })
                  )
                });
                $q.all(promises).then(function () {
                  $scope.data.dataDownLoadingMessage.push('');
                  $localStorage.dataDownLoadingStatus = true;
                  $localStorage.dataDownLoadingTracker.push(processName);
                  //redirect to th landing page
                  directToLandingPage();
                }, function () {
                  var message = "Fail to save constants";
                  progressTopMessage(message);
                  $scope.data.loading = false;
                });
              }, function () {
                $scope.data.loading = false;
                var message = "Fail to download constants for reports";
                progressTopMessage(message);
              });
          }
        },function(){
          var message = "Fail to determine number of constants for reports from the server";
          progressTopMessage(message);
          $scope.data.loading = false;
        });
    }

    //function to fetching all forms from the server
    function loadDataSets(base) {
      userServices.preRequestDataCounter('dataSets',base)
        .then(function(dataSetsCounter){
          $localStorage.baseUrl = base;
          $scope.data.loading = true;
          var processName = "dataSets";
          $scope.data.dataDownLoadingMessage.push('Downloading '+dataSetsCounter+' data entry forms');
          if (isProcessCompleted(processName)) {
            loadDataEntrySections(base);
          } else {
            dataSetsServices.getAllDataSetsFromServer(base).then(function (dataSets) {
              var promises = [];
              var tableName = "dataSets";
              $scope.data.dataDownLoadingMessage.push('saving '+dataSetsCounter+' data entry forms');
              dataSets.forEach(function (dataSet) {
                var id = dataSet.id;
                promises.push(
                  sqlLiteServices.insertData(tableName, id, dataSet)
                    .then(function (pass) {
                      //alert('success : ' + JSON.stringify(pass));
                    }, function (fail) {
                      //alert('Fail : ' + JSON.stringify(fail));
                    })
                )
              });
              $q.all(promises).then(function () {
                //load all data entry sections forms
                $localStorage.dataDownLoadingTracker.push(processName);
                loadDataEntrySections(base);
              }, function () {
                var message = "Fail to save dataSets";
                progressTopMessage(message);
                $scope.data.loading = false;
              });
            }, function () {
              //error getting data sets from server
              var message = "Fail to download data entry forms";
              progressTopMessage(message);
              $scope.data.loading = false;
            });
          }
        },function(){
          var message = "Fail to determine number of data entry forms from the server";
          progressTopMessage(message);
          $scope.data.loading = false;
        });

    }

    //function to fetch all orgUnits assigned to the user from server
    function addAssignedOrgUnit(orgUnits, baseUrl) {
      var processName = "orgUnits";
      $scope.data.dataDownLoadingMessage.push('Fetching '+orgUnits.length+' assigned Organisation ');
      if (!isProcessCompleted(processName)) {
        orgUnits.forEach(function (orgUnit, index) {
          userServices.getAssignedOrgUnitChildrenFromServer(orgUnit.id, baseUrl).then(function (OrgUnitChildrenData) {
            var tableName = "orgUnits";
            var id = OrgUnitChildrenData.id;
            sqlLiteServices.insertData(tableName, id, OrgUnitChildrenData)
              .then(function (pass) {
                //alert('success : ' + JSON.stringify(pass));
              }, function (fail) {
                //alert('Fail : ' + JSON.stringify(fail));
              });

            if (index == (orgUnits.length - 1)) {
              $localStorage.dataDownLoadingTracker.push(processName);
            }
          }, function () {
          });
        });
      }
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

    //function to checking state of process
    function isProcessCompleted(processName) {
      var processStatus = false;
      $localStorage.dataDownLoadingTracker.forEach(function (process) {
        if (process == processName) {
          processStatus = true;
        }
      });
      return processStatus;
    }

    //flexibility for form
    $scope.isInteger = function (key) {
      if (key == "NUMBER" || key == "INTEGER") {
        return true;
      } else {
        return false;
      }
    };
    $scope.isTrueOnly = function (key) {
      if (key == "TRUE_ONLY") {
        return true;
      } else {
        return false;
      }
    };
    $scope.isIntegerZeroOrPositive = function (key) {
      if (key == "INTEGER_ZERO_OR_POSITIVE") {
        return true;
      } else {
        return false;
      }
    };
    $scope.isDate = function (key) {
      if (key == "DATE") {
        return true;
      } else {
        return false;
      }
    };
    $scope.isString = function (key) {
      if (key == "TEXT" || key == "LONG_TEXT") {
        return true;
      } else {
        return false;
      }
    };
    $scope.isBoolean = function (key) {
      if (key == "BOOLEAN") {
        return true;
      } else {
        return false;
      }
    };
    $scope.hasDataSets = function (dataElement) {

      if (dataElement.optionSet != undefined) {
        return true;
      } else {
        return false;
      }
    };
    $scope.getOptionSets = function (dataElement) {
      if (dataElement.optionSet) {
        return dataElement.optionSet.options;
      } else {
        return false;
      }
    };

  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
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

      .state('app.about', {
        url: '/about',
        cache:false,
        views: {
          'menuContent': {
            templateUrl: 'templates/about.html',
            controller: 'aboutController'
          }
        }
      })

      .state('app.dashboard', {
        url: '/dashboard',
        views: {
          'menuContent': {
            templateUrl: 'templates/dashboardHome.html',
            controller: 'dashboardController'
          }
        }
      })

      .state('app.eventCapture', {
        url: '/event-capture',
        cache:false,
        views: {
          'menuContent': {
            templateUrl: 'templates/eventCaptureHome.html',
            controller: 'eventCaptureController'
          }
        }
      })

      .state('app.trackerCapture', {
        url: '/tracker-capture',
        views: {
          'menuContent': {
            templateUrl: 'templates/trackerCaptureHome.html',
            controller: 'trackerCaptureController'
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
        cache:false,
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
        cache:false,
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
  .factory('Base64', function () {
    /* jshint ignore:start */

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    return {
      encode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        do {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);

          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;

          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }

          output = output +
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4);
          chr1 = chr2 = chr3 = "";
          enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);

        return output;
      },

      decode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
          window.alert("There were invalid base64 characters in the input text.\n" +
            "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
            "Expect errors in decoding.");
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        do {
          enc1 = keyStr.indexOf(input.charAt(i++));
          enc2 = keyStr.indexOf(input.charAt(i++));
          enc3 = keyStr.indexOf(input.charAt(i++));
          enc4 = keyStr.indexOf(input.charAt(i++));

          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;

          output = output + String.fromCharCode(chr1);

          if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
          }

          chr1 = chr2 = chr3 = "";
          enc1 = enc2 = enc3 = enc4 = "";

        } while (i < input.length);

        return output;
      }
    };

    /* jshint ignore:end */
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
