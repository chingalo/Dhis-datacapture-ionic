/**
 * Created by joseph on 2/8/16.
 */
angular.module('dataCapture')
  .factory('periodSelectionServices',function(){
    var monthlyYearData = [
      'January','February','March','April','May','June','July','August','September','October','November','December'
    ];
    var quarterlyYearData =[
      'January-March','April-June','July-September','October-December'
    ];
    var mainServices = {
      getPeriodSelections : function(year,dataSet){
        var periodSelection = [];
        var allowedFutureValue = mainServices.getAllowedFuturePeriod(dataSet);
        switch(dataSet.periodType){
          case 'Monthly':
            periodSelection = mainServices.getMonthlyPeriodSectionOptions(year,allowedFutureValue);
            break;
          case 'Quarterly':
            periodSelection = mainServices.getQuarterlyPeriodSectionOptions(year,allowedFutureValue);
            break;
          case 'Weekly':
            break;
          /*case '':
           break;*/
          case 'Yearly':
            periodSelection = mainServices.getYearlyPeriodSectionOptions(year,allowedFutureValue);
            break;
          default :
            periodSelection = [];
        }
        return periodSelection;
      },
      getMonthlyPeriodSectionOptions : function(year,allowedFutureValue){
        var data = [];
        var currentYear = parseInt(new Date().getFullYear()) -1;
        var allowedFutureYear = currentYear + parseInt(allowedFutureValue/12);
        if(year <= allowedFutureYear){
          for(var i=11;i >=0; i --){
            var month = i + 1;
            if(month > 9){
              data.push({
                displayValue :monthlyYearData[i] +' '+year,
                periodValue : year + '' +month
              });
            }else {
              data.push({
                displayValue :monthlyYearData[i] +' '+year,
                periodValue : year + '0' +month
              });
            }
          }
        }else{
          if(year == currentYear + 1){
            var indexOfAllowedMonth = parseInt(new Date().getMonth()) - 1;
            for(var i=11;i >=0; i --){
              var month = i + 1;
              if(indexOfAllowedMonth >= i){
                if(month > 9){
                  data.push({
                    displayValue :monthlyYearData[i] +' '+year,
                    periodValue : year + '' +month
                  });
                }else {
                  data.push({
                    displayValue :monthlyYearData[i] +' '+year,
                    periodValue : year + '0' +month
                  });
                }
              }
            }
          }
        }
        return data;
      },
      getQuarterlyPeriodSectionOptions : function(year,allowedFutureValue){
        var data = [];
        var currentYear = parseInt(new Date().getFullYear()) -1;
        var allowedFutureYear = currentYear + parseInt(allowedFutureValue/4);
        if(year <= allowedFutureYear){
          for(var i=3;i >= 0; i --){
            var quarter = i + 1;
            data.push({
              displayValue :quarterlyYearData[i] + ' ' +year ,
              periodValue : year+'Q' +quarter
            });
          }
        }else{
          if(year == currentYear + 1){
            var currentMonth = parseInt(new Date().getMonth());
            var allowedQuarter = parseInt((currentMonth+1)/4);
            for(var i=3;i >= 0; i --){
              var quarter = i + 1;
              if(allowedQuarter > i){
                data.push({
                  displayValue :quarterlyYearData[i] + ' ' +year ,
                  periodValue : year+'Q' +quarter
                });
              }
            }
          }
        }
        return data;
      },
      getYearlyPeriodSectionOptions : function(year,allowedFutureValue){
        var data = [];
        var currentYear = parseInt(new Date().getFullYear()) -1;
        var allowedFutureYear = currentYear + parseInt(allowedFutureValue);
        if(year <= allowedFutureYear){
          for(var i=0;i < 12; i ++){
            data.push({
              displayValue :year,
              periodValue : year
            });
            year--;
          }
        }
        return data;
      },
      getAllowedFuturePeriod : function(dateSet){
        var result = 0;
        if(dateSet.openFuturePeriods > 0){
          result = dateSet.openFuturePeriods;
        }
        return result;
      }

    };
    return mainServices;
  });
