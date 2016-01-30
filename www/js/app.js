// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('dataCapture', [
  'ionic',
  'ionic-toast',
  'ngStorage',
  'indexedDB'
])

  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
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

  .controller('mainController',function($scope,$state,$ionicModal,ionicToast,$localStorage){

    $scope.data = {};
    var url = 'http://';

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'bottom', false, 1500);
    }
    if(! $localStorage.baseUrl){

      $localStorage.baseUrl = url;
    }
    else{

      //authenticate using local storage data of login user
      if($localStorage.loginUser){

        $scope.data.baseUrl = $localStorage.baseUrl;
        var username = $localStorage.loginUser.username;
        var password = $localStorage.loginUser.password;
        var message = 'Please waiting..';
        progressMessage(message);
        authenticateUser(username,password);
      }
    }

    $scope.data.baseUrl = $localStorage.baseUrl;

    $scope.login = function(){

      if($scope.data.baseUrl){

        if($scope.data.username && $scope.data.password){

          authenticateUser($scope.data.username,$scope.data.password);

        }else{

          var message = 'Please Enter both username and password.';
          progressMessage(message);
        }
      }else{

        var message = 'Please Enter server URL.';
        progressMessage(message);
      }

    };

    $scope.logOut = function(){

      //TODO some logic flow during log out process

      $localStorage.loginUser = null;
      $state.go('login');
    };

    //function handle all authentications to DHIS2 server
    //TODO logic for pull all metadata necessary to support offline support
    function authenticateUser($username, $password){

      $scope.data.loading =true;

      var base = $scope.data.baseUrl;
      Ext.Ajax.request({
        url : base + '/dhis-web-commons-security/login.action?failed=false',
        callbackKey : 'callback',
        method : 'POST',
        params : {
          j_username : $username,
          j_password : $password
        },
        withCredentials : true,
        useDefaultXhrHeader : false,
        success: function () {
          //call checking if user is available
          Ext.Ajax.request({
            url: base + '/api/me.json',
            callbackKey : 'callback',
            method : 'GET',
            params : {
              j_username : $username,
              j_password : $password
            },
            withCredentials : true,
            useDefaultXhrHeader : false,
            success : function(response){

              $scope.data.username = null;
              $scope.data.password = null;
              try{
                var userData = JSON.parse(response.responseText);
                $localStorage.loginUser = {'username' : $username,'password':$password};
                $localStorage.loginUserData = userData;
                $localStorage.baseUrl = $scope.data.baseUrl;

                //redirect to landing page for success login
                $state.go('app.dataEntry');

              }catch(e){
                var message = 'Fail to login, please check your username or password';
                progressMessage(message);
                $scope.data.password = null;
              }

              $scope.data.loading = false;
              $scope.$apply();
            },
            failure : function(){

              $scope.data.password = null;
              var message = 'Fail to login, please Check your network';
              progressMessage(message);
              $scope.data.loading = false;
              $scope.$apply();
            }
          });

        },
        failure : function() {

          $scope.data.password = null;
          //fail to connect to the server
          var message = 'Fail to connect to the server, please check server URL';
          progressMessage(message);
          $scope.data.loading = false;
          $scope.$apply();
        }
      });
    }
  })

  .config(function($stateProvider, $urlRouterProvider,$indexedDBProvider) {

    $indexedDBProvider
      .connection('Dhis2_Data_Cappture')
      .upgradeDatabase(1, function(event, db, tx){

        var dataSets = db.createObjectStore('dataSets',{keyPath : 'id'});
        dataSets.createIndex('id_index','id',{unique : false});
        dataSets.createIndex('name_index','name',{unique : false});

      });

    $stateProvider

      .state('login',{
        url : '/login',
        templateUrl : 'templates/login.html',
        controller : 'mainController'
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
            controller:'dataEntryController'
          }
        }
      })

      .state('app.reports', {
        url: '/reports',
        views: {
          'menuContent': {
            templateUrl: 'templates/reports.html'
          }
        }
      })

      .state('app.profile', {
        url: '/profile',
        views: {
          'menuContent': {
            templateUrl: 'templates/profile.html',
            controller : 'userProfileController'
          }
        }
      })

      .state('app.settings', {
        url: '/settings',
        views: {
          'menuContent': {
            templateUrl: 'templates/settings.html'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  });
