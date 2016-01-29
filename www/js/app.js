// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('dataCapture', [
  'ionic',
  'ionic-toast',
  'ngStorage',
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
      ionicToast.show(message, 'bottom', false, 2000);
    }
    if(! $localStorage.baseUrl){
      $localStorage.baseUrl = url;
    }

    $scope.data.baseUrl = $localStorage.baseUrl;

    $scope.login = function(){
      //http://localhost:8080/dhis/api/dataSets/nqKkegk1y8U.json?fields=id,anme
      progressMessage('login btn');
      $scope.data.loading = true;
      $state.go('app.dataEntry');
    };

    $scope.logOut = function(){

      var message = "log out";
      progressMessage(message);
      $state.go('login');
    }
  })

  .config(function($stateProvider, $urlRouterProvider) {
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
            templateUrl: 'templates/dataEntry.html'
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
            templateUrl: 'templates/profile.html'
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
