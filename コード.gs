function recSwitchBotTemperature() {
  const switchbot_token = PropertiesService.getScriptProperties().getProperty("SWITCHBOT_TOKEN");
  const slack_hook_url = PropertiesService.getScriptProperties().getProperty("SLACK_HOOK_URL");

  // 1.SwitchBot API認証  
  var headers = {"Authorization" : switchbot_token};
  var url = "https://api.switch-bot.com/v1.0/devices"; 
  var options = {
    "headers" : headers,
  }
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());

  // 2.データ取得
  var deviceList = [];
  var i, j = 0;
  for (i = 0; i < json['body']['deviceList'].length; i++) {
    //SwitchbotMeterのリストを取得
    if (json['body']['deviceList'][i]["deviceType"] == "Meter") {
      deviceList[j] = {
        deviceId: json['body']['deviceList'][i].deviceId,
        deviceName: json['body']['deviceList'][i].deviceName
      };
      j++;
    }
  }

  // 3.デバイスの数だけデータ取得
  var url2 = "https://api.switch-bot.com/v1.0/devices/";
  var data;
  var json;
  var deviceName, deviceId, temp, rhumidity;
  var message = "";
  for (i = 0; i < deviceList.length; i++) {
    data = UrlFetchApp.fetch(url2 + deviceList[i].deviceId + "/status", options);
    json = JSON.parse(data.getContentText());
    deviceName = deviceList[i].deviceName;
    temp = json['body']['temperature'];
    rhumidity = json['body']['humidity'];
    deviceId = json['body']['deviceId'];
    writeLog(deviceName, deviceId, temp, rhumidity);// シート記入
    Logger.log(deviceList[i].deviceName + " -- " + deviceId + "　温度: " + temp + " 湿度: " + rhumidity + "％");
    message += deviceList[i].deviceName + "　温度: " + temp + "℃ 湿度: " + rhumidity + "％\n"; 
  }

  // 4.Slackに通知
  slackNotify(slack_hook_url, message);
  return;
}

/**
 * シート記入
 */
function writeLog(device_name, device_id, temp, rhumidity) {
  var objDate = new Date();
  objDate.setDate(objDate.getDate());
  var today = Utilities.formatDate(objDate, "JST", "yyyy-MM-dd HH:mm:ss");
  var ssid = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  var app = SpreadsheetApp.openById(ssid);
  var sheet = app.getSheetByName("シート名を設定");
  sheet.appendRow([
    today,
    device_name,
    temp,
    rhumidity/100
  ]);
}

/**
 * Slackに通知
 */
function slackNotify(url, message){
  var params = {
    "text" : message,
    "channel" : "#z-manno",
    "username" : "温湿チェック",
    "icon_emoji" : ":robot_face:"
  };
  var options = {
    "method" : "POST",
    'contentType': 'application/json',
    'payload' : JSON.stringify(params)
  };  
  var response = UrlFetchApp.fetch(url, options);
  return response;
}