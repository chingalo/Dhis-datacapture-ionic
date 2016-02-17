/**
 * Created by chingalo on 2/17/16.
 */
angular.module('dataCapture')
  .factory('dataValueSetServices',function($http,$q,$localStorage,$indexedDB){

    var dataValueSetServices = {
      getDataValueSet:function(){
       console.log('data freom server still loading')
      }

    };

    return dataValueSetServices;

  });
