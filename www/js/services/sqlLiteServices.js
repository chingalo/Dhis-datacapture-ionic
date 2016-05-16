/**
 * Created by chingalo on 4/10/16.
 */
angular.module('dataCapture')

  .factory('sqlLiteServices', function ($q) {
    var db = null;
    var sqlLiteServices = {
      recordsCounter : function(tableName){
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "SELECT * FROM " + tableName + ";";
          tx.executeSql(query, [], function (tx, results) {
            console.log(tableName + ' : ' + results.rows.length);
            defer.resolve(results.rows.length);
          }, function (error) {
            defer.reject(error);
          });
        });
        return defer.promise;
      },
      insertData: function (tableName,id,data) {
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "INSERT OR REPLACE INTO " + tableName + " (id,data) VALUES (?,?)";
          tx.executeSql(query, [id,JSON.stringify(data)], function (tx, res) {
            //success adding data
            defer.resolve(res);
          }, function (e) {
            defer.reject(e);
          });
        });
        return defer.promise;
      },
      insertBatchData:function(tableName,data) {
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: "my.db"});
        var query = "INSERT OR REPLACE INTO " + tableName + " (id,data) VALUES";
        var counter = 0;
        data.forEach(function (dataVales) {
          if(counter ==0){
            query = query+ "("+JSON.stringify(dataVales.id)+",'"+JSON.stringify(dataVales)+"')";
          }
          else {
            query = query + ",("+JSON.stringify(dataVales.id)+",'"+JSON.stringify(dataVales)+"')";
          }
          counter ++;

        });
        if(data.length > 0){
          db.transaction(function (tx) {
            tx.executeSql(query,[], function (tx, res) {
              //success adding data
              defer.resolve(res);
            }, function (e) {
              defer.reject(e);
            });
          });
        }else{
          defer.resolve();
        }
        return defer.promise;
      },
      insertDataValues : function (tableName,id,data,status) {
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "INSERT OR REPLACE INTO " + tableName + " (id,data,isSync) VALUES (?,?,?)";
          tx.executeSql(query, [id,JSON.stringify(data),status], function (tx, res) {
            //success adding data
            defer.resolve(res);
          }, function (e) {
            defer.reject(e);
          });
        });
        return defer.promise;
      },
      updateDataByAttribute : function(tableName,attribute,value,data){
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "UPDATE " + tableName + " SET data = ?  WHERE "+attribute+" = ?";
          tx.executeSql(query, [JSON.stringify(data),value], function (tx,ru) {
            defer.resolve(ru);
          }, function (error) {
            defer.reject(error);
          });
        });
        return defer.promise;
      },
      getAllData: function (tableName) {
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "SELECT * FROM " + tableName + ";";
          tx.executeSql(query, [], function (tx, results) {
            var len = results.rows.length;
            var data = [];
            for (var i = 0; i < len; i++) {
              data.push(eval("(" + results.rows.item(i).data + ")"));
            }
            defer.resolve(data);
          }, function (error) {
            defer.reject(error);
          });
        });
        return defer.promise;
      },
      getDataById : function(tableName,id){
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "SELECT * FROM " + tableName + " WHERE id = ?;";
          tx.executeSql(query, [id], function (tx, results) {
            var len = results.rows.length;
            var data = [];
            for (var i = 0; i < len; i++) {
              data.push(eval("(" + results.rows.item(i).data + ")"));
            }
            defer.resolve(data[0]);
          }, function (error) {
            defer.reject(error);
          });
        });
        return defer.promise;
      },
      getAllDataByAttribute : function(tableName,attribute,value){
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "SELECT * FROM " + tableName + " WHERE "+attribute+" = ?";
          tx.executeSql(query, [value], function (tx, results) {
            var len = results.rows.length;
            var data = [];
            for (var i = 0; i < len; i++) {
              data.push(eval("(" + results.rows.item(i).data + ")"));
            }
            defer.resolve(data);
          }, function (error) {
            defer.reject(error);
          });
        });
        return defer.promise;
      },
      deleteDataByAttribute : function(tableName,attribute,value){
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "DELETE FROM " + tableName + " WHERE "+attribute+" = ?";
          tx.executeSql(query, [value], function (tx) {
            defer.resolve();
          }, function (error) {
            defer.reject(error);
          });
        });
        return defer.promise;
      },
      createTable : function(tableName){
        db.transaction(function (tx) {
          tx.executeSql('CREATE TABLE IF NOT EXISTS '+tableName+' (id TEXT primary key, data LONGTEXT, isSync INTEGER)', [],
            function (tx, result) {
              //alert("Table dataValues created successfully");
            },
            function (error) {
              //alert("Error occurred while creating the table dataValues.");
            });
        });
      },
      dropTable : function(tableName){
        var defer = $q.defer();
        db = window.sqlitePlugin.openDatabase({name: dhis2.database});
        db.transaction(function (tx) {
          var query = "DROP TABLE " + tableName + ";";
          tx.executeSql(query, [], function (tx) {
            defer.resolve();
          }, function (error) {
            defer.reject(error);
          });
        });
        return defer.promise;
      },
      dropDataBase : function(){
        var defer = $q.defer();
        window.sqlitePlugin.deleteDatabase({name: dhis2.database},function(){
          defer.resolve();
        },function(){
          defer.reject();
        });
      }
    };
    return sqlLiteServices;
  })


