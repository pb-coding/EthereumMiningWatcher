var ul = SpreadsheetApp.getActive().getSheetByName('Umsätze und Laufzeiten');
var ethermine_dashboard = SpreadsheetApp.getActive().getSheetByName('Ethermine API Dashboards');
var miner_history = SpreadsheetApp.getActive().getSheetByName('Miner History');
var mining_chart = SpreadsheetApp.getActive().getSheetByName('Mining Chart');
var payouts = SpreadsheetApp.getActive().getSheetByName('Ethermine API Payouts');

var cellColumnReference = 2; //Wo ist die Datum & Uhrzeit Spalte

function start() {
  var minerStatusUpdate = checkRunningMiners();
  
  if (minerStatusUpdate == false) {
    Logger.log("Miner Status unverändert.")
  }
  else {
    refreshHistory(minerStatusUpdate, 0);
  }
}

function checkRunningMiners() {
    var cellRowReference = checkDates(ul)+1;
    var oldNyxStatus = ul.getRange(cellRowReference-1, cellColumnReference+6).getValue();
    var oldRig1Status = ul.getRange(cellRowReference-1, cellColumnReference+7).getValue();
    var oldTimespyStatus = ul.getRange(cellRowReference-1, cellColumnReference+8).getValue();
    var oldSarynStatus = ul.getRange(cellRowReference-1, cellColumnReference+9).getValue();
    var newNyxStatus = mining_chart.getRange(2,3).getValue();
    var newRig1Status = mining_chart.getRange(3,3).getValue();
    var newTimespyStatus = mining_chart.getRange(4,3).getValue();
    var newSarynStatus = mining_chart.getRange(5,3).getValue();

    var minerStatus = [newNyxStatus, newRig1Status, newTimespyStatus, newSarynStatus];

    Logger.log(minerStatus);

    var newPayout = checkForNewPayout(ul, cellRowReference, cellColumnReference);
    

    if (newPayout != 0) {
      refreshHistory(minerStatus, newPayout);
    }
    

    if (oldNyxStatus == 0 && newNyxStatus == 0 || oldNyxStatus != 0 && newNyxStatus != 0 ) {
      Logger.log("keine Veränderung bei NYX.");

      if (oldRig1Status == 0 && newRig1Status == 0 || oldRig1Status != 0 && newRig1Status != 0 ) {
        Logger.log("keine Veränderung bei Rig1.");

        if (oldTimespyStatus == 0 && newTimespyStatus == 0 || oldTimespyStatus != 0 && newTimespyStatus != 0 ) {
          Logger.log("keine Veränderung bei Timespy.");

          if (oldSarynStatus == 0 && newSarynStatus == 0 || oldSarynStatus != 0 && newSarynStatus != 0 ) {
            Logger.log("keine Veränderung bei Saryn.");
      
          }
          else {
            Logger.log("Veränderung bei Saryn!");
            return minerStatus;
          }      
        }
        else {
          Logger.log("Veränderung bei Timespy!");
          return minerStatus;
        }      
      }
      else {
        Logger.log("Veränderung bei Rig1!");
        return minerStatus;
      }      
    }
    else {
      Logger.log("Veränderung bei NYX!");
      return minerStatus;
    }

    return false;
}

function refreshHistory(minerStatusUpdate, newPayout) {    
    var cellRowReference = createTimeStamp(ul, cellColumnReference);
    var unpaidAmount = writeUnpaidAmount(ul, cellRowReference, cellColumnReference);
    var timeDifference = writeTimeDifference(ul, cellRowReference, cellColumnReference);
    writePayoutAmount(ul, cellRowReference, cellColumnReference, newPayout);
    var ethDifference = writeETHDifference(ul, cellRowReference, cellColumnReference, unpaidAmount, newPayout);
    var ethPerHour = writeEthPerHour(ul, cellRowReference, cellColumnReference, timeDifference, ethDifference);
    var ethPer24Hour = writeEthPer24Hour(ul, cellRowReference, cellColumnReference, ethPerHour);
    writeMinerStatus(ul , cellRowReference, cellColumnReference, minerStatusUpdate);
    var energyCosts = calcEnergyCosts(ul, cellRowReference, cellColumnReference, timeDifference);
    var ethDiffInEuro = writeEthDiffInEuro(ul, cellRowReference, cellColumnReference, ethDifference);
    var gewinn = writeGewinn(ul, cellRowReference, cellColumnReference, energyCosts, ethDiffInEuro);
}

function createTimeStamp(sheet, cellColumnReference) {
    var timedate_now = Utilities.formatDate(new Date(), "GMT+1", "dd.MM.yyyy' 'HH:mm:ss");
    var cellRowReference = checkDates(sheet)+1;
    sheet.getRange(cellRowReference, cellColumnReference).setValue(timedate_now);
    return cellRowReference;
}

function checkDates(sheet) {
    var timestamps = sheet.getRange("B1:B").getValues();
    var last_stamp = timestamps.filter(String).length;
    return last_stamp;
    
}

function writeUnpaidAmount(sheet, cellRowReference, cellColumnReference) {
    var unpaidAmountEntryColumn = 24; // Y Spalte
    var unpaidAmountRowReference = getFirstEntry(ethermine_dashboard, 3, 999, unpaidAmountEntryColumn);
    while (true) {
      if (unpaidAmountRowReference != "not_found") {
        break;
      }
      var unpaidAmountRowReference = getFirstEntry(ethermine_dashboard, 3, 999, unpaidAmountEntryColumn);
    }
    
    Logger.log(unpaidAmountRowReference);
    var unpaidAmount = ethermine_dashboard.getRange(unpaidAmountRowReference, unpaidAmountEntryColumn + 1).getValue();
    Logger.log(unpaidAmount);

    var unpaidAmount = unpaidAmount / 1000000000000000000
    sheet.getRange(cellRowReference, cellColumnReference +1).setValue(unpaidAmount);
    return unpaidAmount;
    
}

function getFirstEntry(ssname, start_row, search_limit, column) {
    var sheet = ssname;
    var data = sheet.getDataRange().getValues();
    for (var i = start_row; i < search_limit; i++) {
      if (data[i][column]) {   // index 2 = 3rd column = C
        return i+1;
      }
    }
    return "not_found";
}



function writeTimeDifference(sheet, cellRowReference, cellColumnReference) {
    var timestamp_new = sheet.getRange(cellRowReference, cellColumnReference).getValue();
    var timestamp_old = sheet.getRange(cellRowReference -1, cellColumnReference).getValue();
    var time_difference = parseFloat(Math.floor((timestamp_new - timestamp_old)))/1000/60/60;
    Logger.log(time_difference);
    sheet.getRange(cellRowReference, cellColumnReference +3).setValue(time_difference);
    sheet.getRange(cellRowReference, cellColumnReference +4).setValue(1);
    sheet.getRange(cellRowReference, cellColumnReference +5).setValue(time_difference);
    return time_difference;
}

function writePayoutAmount(sheet, cellRowReference, cellColumnReference, newPayout) {
    if (newPayout != 0) {
      sheet.getRange(cellRowReference, cellColumnReference+18).setValue(newPayout);
    }
}

function writeETHDifference(sheet, cellRowReference, cellColumnReference, unpaidAmount, newPayout) {
    var lastUnpaidAmount = sheet.getRange(cellRowReference -1, cellColumnReference +1).getValue();

    var ethDiff = (unpaidAmount + newPayout) - lastUnpaidAmount;
    Logger.log(ethDiff);
    sheet.getRange(cellRowReference, cellColumnReference +2).setValue(ethDiff);
    return ethDiff;
}

function writeEthPerHour(sheet, cellRowReference, cellColumnReference, timeDifference, ethDifference) {
    var ethPerHour = ethDifference/timeDifference;
    sheet.getRange(cellRowReference, cellColumnReference +10).setValue(ethPerHour);
    return ethPerHour;
}

function writeEthPer24Hour(sheet, cellRowReference, cellColumnReference, ethPerHour) {
    var ethPer24Hour = ethPerHour * 24;
    sheet.getRange(cellRowReference, cellColumnReference +11).setValue(ethPer24Hour);
    return ethPer24Hour;
}

function writeMinerStatus(sheet, cellRowReference, cellColumnReference, minerStatusUpdate) {
    sheet.getRange(cellRowReference, cellColumnReference+6).setValue(minerStatusUpdate[0]);
    sheet.getRange(cellRowReference, cellColumnReference+7).setValue(minerStatusUpdate[1]);
    sheet.getRange(cellRowReference, cellColumnReference+8).setValue(minerStatusUpdate[2]);
    sheet.getRange(cellRowReference, cellColumnReference+9).setValue(minerStatusUpdate[3]);    
}

function calcEnergyCosts(sheet, cellRowReference, cellColumnReference, timeDifference) {
    var wattCostsNyx = mining_chart.getRange(2,7).getValue();
    var wattCostsRig1 = mining_chart.getRange(3,7).getValue();
    var wattCostsTimespy = mining_chart.getRange(4,7).getValue();
    var wattCostsSaryn = mining_chart.getRange(5,7).getValue();

    var lastMinerStatus = [sheet.getRange(cellRowReference-1, cellColumnReference+6).getValue(), sheet.getRange(cellRowReference-1, cellColumnReference+7).getValue(), sheet.getRange(cellRowReference-1, cellColumnReference+8).getValue(), sheet.getRange(cellRowReference-1, cellColumnReference+9).getValue()]

    var minerStatusOnOff = [];
    lastMinerStatus.forEach(function(item, index) {
      
      if (item == 0) {
        minerStatusOnOff.push(0);
      }
      else {
        minerStatusOnOff.push(1);
      }
    });

    var energyCostsNyx = minerStatusOnOff[0] * timeDifference * (wattCostsNyx/24);
    var energyCostsRig1 = minerStatusOnOff[1] * timeDifference * (wattCostsRig1/24);
    var energyCostsTimespy = minerStatusOnOff[2] * timeDifference * (wattCostsTimespy/24);
    var energyCostsSaryn = minerStatusOnOff[3] * timeDifference * (wattCostsSaryn/24);
    var energyCostsSum = energyCostsNyx + energyCostsRig1 + energyCostsTimespy + energyCostsSaryn;

    var energyCosts = [energyCostsNyx, energyCostsRig1, energyCostsTimespy, energyCostsSaryn, energyCostsSum];
    
    sheet.getRange(cellRowReference, cellColumnReference+13).setValue(energyCosts[0]);
    sheet.getRange(cellRowReference, cellColumnReference+14).setValue(energyCosts[1]);
    sheet.getRange(cellRowReference, cellColumnReference+15).setValue(energyCosts[2]);
    sheet.getRange(cellRowReference, cellColumnReference+16).setValue(energyCosts[3]);
    sheet.getRange(cellRowReference, cellColumnReference+17).setValue(energyCosts[4]);

    return energyCosts;
}

function writeEthDiffInEuro(sheet, cellRowReference, cellColumnReference, ethDifference) {
    var ethEuroKurs = mining_chart.getRange(18,2).getValue();
    var ethDiffInEuro = ethEuroKurs * ethDifference;
    Logger.log(ethDiffInEuro);
    Logger.log(ethDifference);
    Logger.log(ethEuroKurs);
    sheet.getRange(cellRowReference, cellColumnReference+19).setValue(ethDiffInEuro);
    return ethDiffInEuro;
}

function writeGewinn(sheet, cellRowReference, cellColumnReference, energyCosts, ethDiffInEuro) {
    var gewinn = ethDiffInEuro - energyCosts[energyCosts.length -1];
    sheet.getRange(cellRowReference, cellColumnReference+20).setValue(gewinn);
    return gewinn;
}

function checkForNewPayout(sheet, cellRowReference, cellColumnReference) {
    var lastPayout = payouts.getRange(2,6).getValue();
    var lastTimestamp = sheet.getRange(cellRowReference-1, cellColumnReference).getValue();
    Logger.log(lastPayout + " " + lastTimestamp);
    var lastTimestampUnix = new Date(lastTimestamp).valueOf()/1000
    Logger.log(lastTimestampUnix);

    if (lastPayout > lastTimestampUnix) {
      Logger.log("neuer Payout!");
      var payoutAmount = payouts.getRange(2,4).getValue()/1000000000000000000
      Logger.log("Payout Amount: " + payoutAmount);
      return payoutAmount;
    }
    else {
      Logger.log("kein neuer Payout.");
      return 0;
    }

}