function render(friends) {
  var onlines = "";
  var offlines = "";

  for(var i = 0; i < friends.length; i++) {
    var f = friends[i];

    var record = "<tr class='playerInfo' id='player" + f.webPcNo + "'><td>" + f.name +" (" + f.id + ")"
      + "</td><td>" + f.area + "</td></tr>";
    html = html + record;

    // オンラインプレイヤーを優先して表示
    if(f.online) {
      onlines = onlines + record;
    } else {
      offlines = offlines + record;
    }
  }
  var html = "<table>" + onlines + offlines + "</table>";
  
  document.querySelector("#onlineFrineds").innerHTML = html;

  var reWebPcNo = /player(\d+)/;
  var jumpPage = function(){
    var no = reWebPcNo.exec(this.id)[1];
    chrome.tabs.create({'url': "http://hiroba.dqx.jp/sc/character/" + no});
  };

  var trs = document.querySelectorAll(".playerInfo");
  for(var j=0; j<trs.length; j++) {
    var tr = trs[j];
    tr.onclick = jumpPage;
  }

}

function requireLogin() {
  var html ="ログインしてください";
  document.querySelector("#onlineFrineds").innerHTML = html;
  
}

function getFriendsByPage(webPcNo, pageNo, results, callback) {
  var xhr = new XMLHttpRequest();
  
  xhr.onload = function() {
    console.log(xhr.status);
    
    var xml = xhr.responseXML;
    var friends = xml.querySelectorAll("#contentArea > div > div.bdBox1.myFriendList > div.article");
    
    var reId = /([A-Z][A-Z]\d\d\d-\d\d\d)/;
    var reWebPcNo = /character\/(\d+)/;
    for(var i = 0; i < friends.length; i++) {
      var f = friends[i];

      var el = f.getElementsByTagName("div")[0]
        .getElementsByTagName("div")[0]
        .getElementsByTagName("div")[0]
        .getElementsByTagName("dl")[0];
      
      var name = el.getElementsByTagName("dd")[0].getElementsByTagName("a")[0].textContent;
      var pcNo = reWebPcNo.exec(el.getElementsByTagName("dd")[0].getElementsByTagName("a")[0].href)[1];
      var id = reId.exec(el.getElementsByTagName("dd")[1].textContent)[1];

      var serverEl = f.getElementsByTagName("div")[0]
        .getElementsByTagName("div")[0]
        .getElementsByTagName("div")[1];

      var server = serverEl.getElementsByTagName("dd")[0].textContent.replace("： ", "");
      var area = serverEl.getElementsByTagName("dd")[1].textContent.replace("： ", "");
      var online = ("--" != server);
      
      console.log(name + ", " + id + ", " + server + ", " + area + ", online: " + online );
      results.push({name: name, webPcNo: pcNo, id: id, server: server, area: area, online: online});
    }
    
    var nextLink = xml.querySelector("#contentArea > div > div.bdBox1.myFriendList > div.pageNavi > ul > li.next > a");
    console.log("next: " + nextLink);
    if(!nextLink) {
      callback(results);
    } else {
      var nextPageNo = /.*\/(\d+)/.exec(nextLink.href)[1];
      getFriendsByPage(webPcNo, nextPageNo, results, callback);
    }
  };
  
  xhr.open("GET", "http://hiroba.dqx.jp/sc/character/" + webPcNo + "/friendlist/page/" + pageNo);
  xhr.responseType = "document";
  xhr.send();
}

function getFriends(webPcNo, callback) {
  getFriendsByPage(webPcNo, 0, [], callback);
}

function getWebPcNo(callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function(){
    console.log(xhr.status);
    
    var xml = xhr.responseXML;
    var link = xml.getElementById("mypageNavi")
      .getElementsByTagName("div")[0]
      .getElementsByTagName("ul")[0]
      .getElementsByTagName("li")[1]
      .getElementsByTagName("a")[0]
      .href;
    var res = /\/diary\/(\d+)/.exec(link)[1];

    if(!res) {
      throw new Error();
    }
    callback(res);
  };
  
  xhr.onerror = function(e) {
    requireLogin();
  };
  xhr.open("GET", "http://hiroba.dqx.jp/sc/home/");
  xhr.responseType = 'document';
  xhr.send();
}

document.addEventListener('DOMContentLoaded', function() {
  getWebPcNo(function(webPcNo){
    getFriends(webPcNo, function(friends){
      render(friends);
    });
  });
});
