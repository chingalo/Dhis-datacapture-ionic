// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('dataCapture', [
  'ionic',
  'ionic-toast',
  'ngStorage',
  'dataCapture.controllers'
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

  .controller('mainController',function($scope,$ionicModal,ionicToast,$localStorage){

    $scope.data = {};
    var url = 'http://';

    //function for toaster messages
    function progressMessage(message){
      ionicToast.show(message, 'bottom', false, 2000);
    }
    if(! $localStorage.baseUrl){
      $localStorage.baseUrl = url;
    }

    $scope.login = function(){

      progressMessage('login btn');
    };
    $ionicModal.fromTemplateUrl('templates/setConfiguration.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.data.baseUrl = url;
    });

    $scope.closeSetting = function() {
      $scope.modal.hide();
    };

    $scope.setConfiguration = function() {
      $scope.modal.show();
    };

    $scope.saveSetting = function(){

      $localStorage.baseUrl = $scope.data.baseUrl;
      $scope.closeSetting();
    };
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
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  });
