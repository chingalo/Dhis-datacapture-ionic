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

  .controller('mainController', function ($scope, $state,$ionicHistory,$ionicModal, ionicToast, $localStorage, dataSetsServices, sectionsServices, $indexedDB) {

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

                addAssignedOrgUnit($localStorage.loginUserData.organisationUnits);
                $scope.data.loading = false;
                var message = 'Please wait while we try to synchronize with server.';
                ionicToast.show(message, 'bottom', false, 4000);
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

    function addAssignedOrgUnit(orgunits) {
      deleteAssignedOrgUnit();
      orgunits.forEach(function (orgunit) {
        $indexedDB.openStore('orgUnits', function (orgUnitsData) {
          orgUnitsData.upsert(orgunit).then(function () {
            //success
          }, function () {
            //error
          });
        })
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

    $scope.treeOptions = {
      nodeChildren: "children",
      dirSelectable: true,
      injectClasses: {
        ul: "a1",
        li: "a2",
        liSelected: "a7",
        iExpanded: "a3",
        iCollapsed: "a4",
        iLeaf: "a5",
        label: "a6",
        labelSelected: "a8"
      }
    }
    $scope.dataForTheTree =
      [
        {"name":"Kinondoni Municipal Council","id":"ts6eEeUjcfO","children":[{"name":"Bunju Dispensary","id":"Cz8YxZFF9Nq","children":[]},{"name":"AAM-International","id":"yj6imNl5717","children":[]},{"name":"Muya Dental Clinic","id":"i3Yl5thdrET","children":[]},{"name":"Lab Consult Dispensary","id":"FbpC2QXTJOY","children":[]},{"name":"Kombe Dispensary ","id":"HJBNTqLaMnn","children":[]},{"name":"Ameni Dispensary","id":"Amgk1lw8G2T","children":[]},{"name":"P-Medical Consultant","id":"icmybEalu8O","children":[]},{"name":"St. John Med Center Dispensary","id":"lvhvijs7WOD","children":[]},{"name":"Arafa Vigaeni Dispensary","id":"oTatmvM92KG","children":[]},{"name":"Kwezi Dispensary","id":"RWOIMFo8498","children":[]},{"name":"Mikuru Dispensary","id":"xWvJOLhlcHv","children":[]},{"name":"Oysterbay police dispensary","id":"w2tpbINfGWX","children":[]},{"name":"Lugalo Hospital RCH","id":"kQxC8INwhfT","children":[]},{"name":"Kigogo Morovian Dispensary","id":"lyl8QTItob5","children":[]},{"name":"Kalitha Mt.Home Dispensary","id":"zkAYVQ2QxMb","children":[]},{"name":"Kelei - Dispensary","id":"ChuwzbxEw2s","children":[]},{"name":"Chance optic Care Clinic","id":"W55QJQlY6Qk","children":[]},{"name":"Omeki Family Dispensary","id":"l5amAfPZV4H","children":[]},{"name":"Neema Health Center","id":"wTEfWWqffxT","children":[]},{"name":"Samaritan Dispensary","id":"Ggekya4hMKC","children":[]},{"name":"Marise Dispensary","id":"ZrX6e9P4brO","children":[]},{"name":"JPM - Dispensary","id":"NoLdNh1XcLr","children":[]},{"name":"Vission Plus Clinic","id":"zH6yQbrQlCj","children":[]},{"name":"Wazo Dispensary","id":"Q69wPGBDtgE","children":[]},{"name":"Salasala Dispensary","id":"pyZZWzxjpdt","children":[]},{"name":"Magomeni Health Center","id":"fdMq1IC5VMY","children":[]},{"name":"Serenity Dental","id":"dtCz9HjpKk9","children":[]},{"name":"Arafa Boko - Dispensary","id":"fOp9KAVWmDR","children":[]},{"name":"International School of Tanganyika Clinic","id":"lsVvAcanriX","children":[]},{"name":"Luguruni Dispensary","id":"UiNbo3e3H3l","children":[]},{"name":"Moroco Physiotherapy Clinic","id":"RpNrKfivlvp","children":[]},{"name":"Maya Dental Clinic","id":"GLNiYncG0gI","children":[]},{"name":"Imaging Plus Med Diagnostic Center","id":"EfmbkCyVKbX","children":[]},{"name":"Optic Zone Clinic","id":"SoVBSSJaH0g","children":[]},{"name":"KAM  Mwananyamala Dispensary","id":"FEKVZvPwrhU","children":[]},{"name":"Mavurunza Dispensary","id":"ZEkdMcbaa6X","children":[]},{"name":"Sinza Family Eye Clinic","id":"hbCitqUjIFG","children":[]},{"name":"Msasani Peninsula Hospital","id":"pBFDmXYrLnU","children":[]},{"name":"FM CGPU Dispensary","id":"nDtc8K6uWFq","children":[]},{"name":"Mburahati Dispensary","id":"oRHCvuSI6ur","children":[]},{"name":"AMII Hospital","id":"S9cdrG2rNZv","children":[]},{"name":"Emilio Mzena Hospital","id":"OgwGBZB5A7o","children":[]},{"name":"Boko dental clinic","id":"LcC6Z31V7TK","children":[]},{"name":"AIF Huduma Dispensary","id":"AJTdcHLUhJ7","children":[]},{"name":"MNA Dispensary","id":"Rv06KgGEwhW","children":[]},{"name":"Lugalo Hospital","id":"nPsRsAhjEIx","children":[]},{"name":"Mikumi Hospital","id":"Aqwu0N14yCQ","children":[]},{"name":"Meig`s Bunju Dispensary","id":"rkfFU5D1hjR","children":[]},{"name":"KAM Magomeni Dispensary","id":"Sk370kCXD6w","children":[]},{"name":"Kitea Dispensary","id":"SnV7AfhlTYk","children":[]},{"name":"AAR Wazo Dispensary","id":"GKVQgjF8wl6","children":[]},{"name":"New Msasani Dispensary","id":"NmiS9lvkFhj","children":[]},{"name":"Tanzania Heart Institute Hospital","id":"gmoaXkQV58C","children":[]},{"name":"AAR Health Center ","id":"FfS2msBURuh","children":[]},{"name":"Mauto Medical Care","id":"lOlVx6w99W7","children":[]},{"name":"Arafa Mikocheni Dispensary  ","id":"rKdarKzWxqz","children":[]},{"name":"Nyota Njema Mat.home Clinic","id":"xU0sSKCLRlb","children":[]},{"name":"BD dental clinic","id":"OWNIX13kCoJ","children":[]},{"name":"Dental Plus Clinic","id":"iDD1qL3mg42","children":[]},{"name":"MCDIT Dispensary","id":"p8vnwizmWMb","children":[]},{"name":"TM Dispensary","id":"QXY2GQgVtxq","children":[]},{"name":"Premier Care Clinic","id":"cSU52I0LFbv","children":[]},{"name":"Msewe Dispensary","id":"OjmTLqwbSyS","children":[]},{"name":"CCBRT Hospital","id":"L3OnLgaVY3P","children":[]},{"name":"Tegeta Mission Dispensary","id":"Zn0ZwInrhHj","children":[]},{"name":"Marie Stopes Kimara Dispensary","id":"sqidbag65cP","children":[]},{"name":"Flora - Dispensary","id":"phKVo8IDktn","children":[]},{"name":"Elly Medical Ahueni Clinic","id":"zo4U0BntBAr","children":[]},{"name":" Rabinisia Memorial  Hospital","id":"IQ1r2hd8i9I","children":[]},{"name":"PK Dispensary","id":"vDJtkypEmX1","children":[]},{"name":"Baraka Mbezi Dispensary","id":"fqjLIuDZVm2","children":[]},{"name":"Father Triest Dispensary ","id":"OGSXXxiJLcK","children":[]},{"name":"Faberk Modern Msufini Dispensary","id":"h2LKBQgUYcb","children":[]},{"name":"Lifesign Dispensary","id":"PeVr88ITfdV","children":[]},{"name":"Marie Stopes Mabibo Dispensary","id":"r0AIUHRIm5y","children":[]},{"name":"luquman Dispensay","id":"XPz9FmKBOmP","children":[]},{"name":"TAIFO Tegeta Dispensary","id":"DXEpgI8ZKI9","children":[]},{"name":"Ubungo JWTZ Dispensary","id":"rV93w7ANI4m","children":[]},{"name":"Luguruni Health Center","id":"puO85jti5Zf","children":[]},{"name":"Honest Dispensary","id":"bCe3RG52voa","children":[]},{"name":"Kimara Dispensary","id":"SbQ4nbnY5Zc","children":[]},{"name":"Hope Eye Clinic","id":"BHezPaeV2gg","children":[]},{"name":"Doctor`s Plaza Heart Clinic","id":"dRFQZyVOm1u","children":[]},{"name":"Eureka Dispensary","id":"jzfWxoZqk9F","children":[]},{"name":"Kinondoni B Dispensary","id":"Upu8zI7xi90","children":[]},{"name":"St. Simon Health Center","id":"uNSPsAouVPK","children":[]},{"name":"Tanzania Methodist Church Clinic","id":"fVvC3cRH3mJ","children":[]},{"name":"Taifo Mwembechai Dispensary","id":"TOsC4Vag74u","children":[]},{"name":"New Kagera Dispensary","id":"O2sXItaFUzq","children":[]},{"name":"Arafa Uzuri Dispensary","id":"GGgMDoswMQV","children":[]},{"name":"Kaja Dispensary","id":"UTJtSAtifkm","children":[]},{"name":"Edward Michaud Health Center","id":"LqqfEDelm2j","children":[]},{"name":"Mbale Maternity Home","id":"LvwfBYEHJbS","children":[]},{"name":"Ghati Dispensary","id":"HRn34RTUZsj","children":[]},{"name":"361 KJ Lugalo Dispensary","id":"jk47Sq81pi7","children":[]},{"name":"Kigogo Eye Clinic","id":"lkY8ZsSAdyO","children":[]},{"name":"Kimara Central Dispensary","id":"VZyfgJMfZuX","children":[]},{"name":"Mwananyamala Hospital","id":"ymiIhszR6dn","children":[]},{"name":"Sinza Hospital","id":"fC4NmwUQq48","children":[]},{"name":"Tandale Dispensary","id":"aV1Q170SUPX","children":[]},{"name":"Mabibo Dispensary","id":"VW7sf9oGaif","children":[]},{"name":"JS Babhra Dispensary","id":"qhNQhXEUPME","children":[]},{"name":"SISA Health Center","id":"rYi2Ws8SPBl","children":[]},{"name":"Mlimani City Specialist","id":"TFzV5SN8it3","children":[]},{"name":"Tangi Bovu Dental","id":"K45cZFnksfw","children":[]},{"name":"Smile dental centre","id":"sMEZBZEgbRT","children":[]},{"name":"KAM College Dispensary","id":"rmmUCXMGVPD","children":[]},{"name":"Makongo juu Dispensary","id":"Kw3NrRUf8dd","children":[]},{"name":"Mosha Dental Clinic","id":"wJYn9nf7FIL","children":[]},{"name":"Istqaama Health Center","id":"oIrNQkcneOU","children":[]},{"name":"MICO Anex Dispensary","id":"uW3s4x7UpqY","children":[]},{"name":"Survey Dispensary","id":"NoB68tEMHKN","children":[]},{"name":"Family Medical Clinic","id":"OdXRtTSc6xB","children":[]},{"name":"Sinza MICO Health Center","id":"kQeeWiiNgrp","children":[]},{"name":"Kairuki Dispensary","id":"KC8qhayQTak","children":[]},{"name":"Mabibo Hostel Dispensary","id":"ravvBCaIUrJ","children":[]},{"name":"Moyo Health Care","id":"igVn8IWONEO","children":[]},{"name":"Boko Dispensary","id":"tuxRXcDELh6","children":[]},{"name":"Holistic health care dental","id":"gTjWmc0c8kb","children":[]},{"name":"MICO Farasi Mabibo Dispensary","id":"IMbDdRGiwKF","children":[]},{"name":"Ludodi Dental clinic","id":"NHtV0URfcZo","children":[]},{"name":"Peninsula dental clinic","id":"Mkxtj9ZQ4fD","children":[]},{"name":"UMASIDA Dispensary","id":"o1xt094R60I","children":[]},{"name":"Manzese Dispensary","id":"hPBwmqBQy2i","children":[]},{"name":"Megra Medical","id":"hGNp5B9jOwa","children":[]},{"name":"St Theresia - Dispensary","id":"f5UnvZsD2u2","children":[]},{"name":"Africa Sana Dental Clinic","id":"gRWlYsMyY2V","children":[]},{"name":"Antonia Verna Dispensary","id":"uwwI1NSA6Aj","children":[]},{"name":"Maadili Dispensary","id":"PB4k57NF3jt","children":[]},{"name":"Changanyikeni JWTZ Dispensary","id":"CWjFNq4EBGK","children":[]},{"name":"Arafa Basna Dispensary","id":"C87B5tSXvzY","children":[]},{"name":"MICO Mars Dispensary","id":"Or0RdiGDWiy","children":[]},{"name":"Bonde la Mpunga Dispensary","id":"XYuDH2vERDt","children":[]},{"name":"Afya Care Mbezi Dispensary","id":"TLbBHQqwGvz","children":[]},{"name":"Boniface Dental Clinic","id":"D4f6VceSAwt","children":[]},{"name":"MedCorps Medical","id":"K7ZmRhiu0oD","children":[]},{"name":"Kinondoni Hospital","id":"SwEhV8fGExb","children":[]},{"name":"Vijana Hostel Dispensary","id":"xRahYr04VMd","children":[]},{"name":"Msakuzi Clinic","id":"kQGfXp5QqFM","children":[]},{"name":"TPM Dispensary","id":"e0wkp16SFQ5","children":[]},{"name":"Ardhi University Dispensary","id":"SPLSLmRTxUg","children":[]},{"name":"Goba Dispensary","id":"MmDAQRkRTju","children":[]},{"name":"Mount Ukombozi Hospital","id":"nVpSqKyTcI0","children":[]},{"name":"Ultimate Security Dispensary","id":"D1DgW4cEwaG","children":[]},{"name":"Jabal Hiral Dispensary","id":"uPBlus9r2pw","children":[]},{"name":"Tip Top Dispensary","id":"eC9ihQd1BSb","children":[]},{"name":"Dental studio","id":"nz0bYXQNE91","children":[]},{"name":"MICO Tandale Dispensary","id":"MydYL6PVDQy","children":[]},{"name":"Kibangu Mission Hospital","id":"ehkA1CDdvq0","children":[]},{"name":"Kibamba Dispensary","id":"KeIpSDdRvsJ","children":[]},{"name":"Dr. Hiza Dispansary","id":"b5bEgLNPf9o","children":[]},{"name":"St. Brendan Dispensary","id":"vXc8x5b8Q8E","children":[]},{"name":"Makuburi Dispensary","id":"k1zQKGy0MdT","children":[]},{"name":"Morocco Eye Care","id":"RnqnmAwSsXk","children":[]},{"name":"Msumi Dispensary","id":"F0Kz1CYKFeE","children":[]},{"name":"Mlalakuwa Dispensary","id":"A0QF6NsEXRx","children":[]},{"name":"Lusasi Dental Clinic","id":"i7D7Q3J8JYR","children":[]},{"name":"MICO Makurumla Darajani Dispensary","id":"LySbBwXkqmm","children":[]},{"name":"Hananasif Dispensary","id":"ApGRO8HqrEP","children":[]},{"name":"Faraja - Dispensary","id":"I2ek4brw9lZ","children":[]},{"name":"Maibong Sukida Chinese Dispensary","id":"UZT3bainnwJ","children":[]},{"name":"Mwenge Dental Clinic","id":"w2P6TBEXCDD","children":[]},{"name":"IMTU Hospital","id":"fQ91SBccDT1","children":[]},{"name":"Mama Ngoma Health Center","id":"BXUXXddkHB6","children":[]},{"name":"TOHS Oysterbay Clinic","id":"fTdiuqQ0170","children":[]},{"name":"Madale\tDispensary","id":"XxdPar3Otrx","children":[]},{"name":"MICO Mkwajuni Dispensary","id":"qA3H6Ck2ODS","children":[]},{"name":"Kinondoni Shamba Dispensary","id":"MXxmqsIwfzs","children":[]},{"name":"Mafarasa Dispensary","id":"WTMFwgytmuC","children":[]},{"name":"Kibwegere Dispensary","id":"AP0k11kzeVi","children":[]},{"name":"Siha Eye Care Clinic","id":"onxh95IZzzj","children":[]},{"name":"Arafa Corner Dispensary","id":"FQ8KY1UIjXc","children":[]},{"name":"Arafa NHC - Ubungo Dispensary","id":"DLOcEWesEdH","children":[]},{"name":"Msisiri Dispensary","id":"xCgZSiE5bch","children":[]},{"name":"Mwenge Dispensary","id":"EPqwjbV96LO","children":[]},{"name":"Msigula Dispensary","id":"doaEOMkTFyZ","children":[]},{"name":"Kinae - Dispensary","id":"HPPalJup0St","children":[]},{"name":"Mission Mikocheni Hospital","id":"VTqogzDyPoH","children":[]},{"name":"Sandarya Dispensary","id":"P6r8UMbTIB5","children":[]},{"name":"AAR Tegeta Dispensary","id":"dBjS9vYNceP","children":[]},{"name":"MICO Ndugumbi Dispensary","id":"bAZRE0vdze6","children":[]},{"name":"Marie Stopes Mwenge Hospital","id":"QEK0nImFdOd","children":[]},{"name":"Havana Changanyikeni Dispensary","id":"Ng10kZrdqFD","children":[]},{"name":"BOCHI Health Center","id":"Ar1TJZ5mqvz","children":[]},{"name":"Doctors at Masaki Dispensary","id":"gbDH0k1IZiv","children":[]},{"name":"Makongo Hills Clinic","id":"wGd5Xv7BeF3","children":[]},{"name":"Haule/St Clara Dispensary","id":"vu1i3WIvwsR","children":[]},{"name":"Tayma Tandale Dispensary","id":"Y4QxuoOg1F8","children":[]},{"name":"Keto Dispensary","id":"yP5UbLMfHI7","children":[]},{"name":"Kidney Diagnostic Clinic","id":"FB17WluwSNT","children":[]},{"name":"Mbezi Dispensary","id":"Our1TzAGCmu","children":[]},{"name":"Kilimani Dispensary","id":"OBKolVzEDMJ","children":[]},{"name":"Suby Maternity Home Dispensary","id":"IojLmhM6Yv2","children":[]},{"name":"Upendo Ikunda Dispensary","id":"xjLvhxuvvaX","children":[]},{"name":"St. Monica Modern Hospital","id":"WtigL5Ph6lW","children":[]},{"name":"Chuo Kikuu Health Center","id":"Yc6Dt4UL6yl","children":[]},{"name":"Kunduchi Dispensary","id":"fUPruN5JnU4","children":[]},{"name":"New Tegeta Dispensary","id":"xjFLlaQa3RM","children":[]},{"name":"Mlalakuwa JKT Dispensary","id":"RZcmwRqRHIW","children":[]},{"name":"Moyo Safi wa Maria Health Center","id":"NabqQxkoChB","children":[]},{"name":"T.A.G Manzese B Dispensary","id":"Hjzhn4kPHeJ","children":[]},{"name":"Dr. Mhina Dispensary","id":"nU2h2gaet6m","children":[]},{"name":"Ekenywa ENT Medical Center","id":"jd5InfzM2QZ","children":[]},{"name":"Omega Optics Clinic","id":"MEPiVW9CHAX","children":[]},{"name":"MICO Tanesco Dispensary","id":"j24TXeinve4","children":[]},{"name":"MMR Dispensary","id":"M7TZxC7cUCI","children":[]},{"name":"Kijitonyama Dispensary","id":"Pko7pc9TCWR","children":[]},{"name":"Sanitas Health Center","id":"JHDFT9Guro9","children":[]},{"name":"Arafa Fung Zho Dispensary","id":"vHwqAPzl4iQ","children":[]},{"name":"Nurraifo Mwawimbi Dispensary","id":"MLzLNuzWepc","children":[]},{"name":"Arafa Mtogole Dispensary","id":"UQCwVNVf9f5","children":[]},{"name":"Mzimuni Dispensary","id":"xKtnLrcdZLl","children":[]},{"name":"JPM Health Center","id":"d9dckkh3PVZ","children":[]},{"name":"Arafa Mwananchi Dispensary","id":"aPBbMmcaBNT","children":[]},{"name":"Tumaini group Dispensary ","id":"xJbZoV7pNoz","children":[]},{"name":"Cignat Dispensary","id":"cd5m0Lj9x1a","children":[]},{"name":"St,Lawrent Diabetes Center","id":"BRhIJuuKweM","children":[]},{"name":"Diplomat Dental Clinic","id":"XvKXxEzophp","children":[]},{"name":"Madonna Dispensary","id":"VFWnf6uU7ia","children":[]},{"name":"Mpiji magohe Dispensary","id":"qOJqFiM5c93","children":[]},{"name":"Mafarasa Mabibo Dispensary","id":"HzpMuEDZg2Z","children":[]},{"name":"SINO Tanzania Friendship Hospital","id":"Vxu1RoMXwEd","children":[]},{"name":"Magereza Boko DIspensary","id":"jqElOjZ3KtU","children":[]},{"name":"MICO Sinza Dispensary","id":"zqC2rGRfOqG","children":[]},{"name":"Mbezi Medical - Clinic","id":"jAeMIuDHhu0","children":[]},{"name":"Afya Care Sinza Dispensary","id":"NiHJGPC2CsO","children":[]},{"name":"TMJ Hospital","id":"KmlVpQp09Mq","children":[]},{"name":"Kigogo Dispensary ","id":"GnIbZhXEmZZ","children":[]},{"name":"Voluntary Humane Society Clinic","id":"ProgCjb3wuY","children":[]},{"name":"Kambangwa Dispensary","id":"NOeuCOrE6rC","children":[]},{"name":"Kwembe Dispensary","id":"QvKF1Swy6FH","children":[]},{"name":"Ununio Dispensary","id":"FBCJzJgJCMQ","children":[]},{"name":"TKS Dispensary","id":"wase2x4WfAc","children":[]},{"name":"Mbweni Hospital","id":"DX9YU0NVgA4","children":[]},{"name":"Redcross Humanitarian Dispensary","id":"H6SYEDLRLc8","children":[]},{"name":"Furaha Medical Clinic ","id":"auwh6YBweaV","children":[]},{"name":"Vision Care - Eye Clinic","id":"xV67ZQYhRuc","children":[]},{"name":"Kisiwani - Dispensary","id":"XFNx37Ilm58","children":[]},{"name":"Mbweni Dispensary","id":"laQPzW9ITDx","children":[]},{"name":"Uzuri Manzese Dispensary","id":"OiduCYifTbV","children":[]},{"name":"Huruma Kimara","id":"OPPfto3xcDP","children":[]},{"name":"Arafa Mbezi Dispensary","id":"o2nc5n7AbYr","children":[]},{"name":"Kiluvya Dispensary","id":"acO1VqhFnhh","children":[]},{"name":"Uzima Dispensary ","id":"q7p430cElbu","children":[]},{"name":"Taifo Mchangani Dispensary","id":"W2z38xSaXjO","children":[]},{"name":"UN Dispensary","id":"bA4Ezfaw9jI","children":[]},{"name":"Esnan Dental Centre","id":"QPfCwRsuyZB","children":[]},{"name":"Smart dental clinic","id":"rBGj81oKIAq","children":[]},{"name":"Prim care Dispensary","id":"p32pht4RFFf","children":[]},{"name":"Kipasika Dispensary","id":"Ue8XrRPmAx4","children":[]},{"name":"Benalal Dental","id":"REFLwZGfNGB","children":[]},{"name":"MICO Salasala Dispensary","id":"wvgBG0xNBkc","children":[]},{"name":"Sandra Medi consultant","id":"LXg8xO1r08w","children":[]},{"name":"Kwembe Kati","id":"VQWAIdiI4ac","children":[]},{"name":"Arafa Huruma Dispensary","id":"UQORyaXK8A4","children":[]},{"name":"Mbweni B Dispensary","id":"eBPTDGokr1W","children":[]},{"name":"Access Medical and Dialysis Centre","id":"XiBrieBUjvO","children":[]},{"name":"Kawe dispensary","id":"ek7f9TTpmEh","children":[]},{"name":"Oysterbay Hospital","id":"qdLvbvAz9bZ","children":[]},{"name":"Ndumbwi Dispensary","id":"ZtcvK8n39tR","children":[]},{"name":"B J Mmasi dispensary","id":"KYnEZM9idI7","children":[]},{"name":"Tegeta Dispensary","id":"ykrAOSs9bcm","children":[]},{"name":"Nsilo Dispensary","id":"vYjXJCo6LEF","children":[]},{"name":"St. Michael Dispensary","id":"pSuQclwDSVF","children":[]},{"name":"Masana Hospital","id":"WlUFF56THDG","children":[]},{"name":"Mabwepande Dispensary","id":"Ves4gYYgwZR","children":[]},{"name":"Elite Dental clinic","id":"c2N62YZPsWG","children":[]},{"name":"Arafa Dispensary","id":"ixy2hSYppxy","children":[]},{"name":"Azania Dispensary","id":"hKmUGARRe0F","children":[]},{"name":"Perfect Point Clinic","id":"Zd6RoLOSStN","children":[]},{"name":"Mbweni JKT - Dispensary","id":"zaC7GwsaZf6","children":[]},{"name":"Med dent clinic","id":"DaiJFZXF3Tj","children":[]},{"name":"Aga Khan Health Center","id":"yEvQpEVosVH","children":[]},{"name":"Nurraifo Wazo Dispensary","id":"kpS4JwlKp53","children":[]},{"name":"Mbopo Dispensary","id":"AfHknm7RAux","children":[]},{"name":"Mashuda Dispensary","id":"DO2HZtkRPyc","children":[]},{"name":"St. Benedict Dispensary","id":"uPQrwWX8cYl","children":[]},{"name":"International dental centre","id":"GgA9KUHV18N","children":[]},{"name":"MICO Manzese Dispensary","id":"NBbnrDfyfS5","children":[]},{"name":"Maknesh - Dispensary","id":"GKReYXU1mCh","children":[]},{"name":"Arafa Sinza - Dispensary","id":"P6BQX2hbrBd","children":[]},{"name":"London - Health Center","id":"qbdDqhG0WOz","children":[]},{"name":"Pangasega Dispensary","id":"dXpY4EMKlZq","children":[]},{"name":"Iranian Health Center","id":"YGcHB9r3N0x","children":[]},{"name":"Mbezi health Center","id":"vikxwZMmt7i","children":[]},{"name":"Kisopwa Dispensary","id":"lEyDYw4CQJa","children":[]},{"name":"Mabwepande Hospital","id":"BpBetPkmdzf","children":[]},{"name":"KBHS Dispensary","id":"kHZ2GyBlhqw","children":[]},{"name":"Capricon Maternity home Clinic","id":"qNU8YkpbO3V","children":[]},{"name":"Rahma Dental Clinic","id":"s7q5faYBkYW","children":[]},{"name":"AAR Sinza Dispensary","id":"WEodYzuuRvw","children":[]},{"name":"Dental clinic","id":"grQ10FhWzNb","children":[]},{"name":"Mpiji Mbweni Dispensary","id":"y71Tb1vN5Fo","children":[]}]}
      ];
    
    $scope.showSelected = function(orGunit){
      console.log(orGunit.name);
    }

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
