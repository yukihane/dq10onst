function render(friends) {
  var html = "<table>";
  for(var i = 0; i < friends.length; i++) {
    var f = friends[i];
    if(!f.online) {
      continue;
    }

    var record = "<tr><td>" + f.name +" (" + f.id + ")"
      + "</td><td>" + f.server + ", " + f.area + "</td></tr>";
    html = html + record;
  }
  html = html + "</table>";
  
  document.querySelector("#onlineFrineds").innerHTML = html;
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
    for(var i = 0; i < friends.length; i++) {
      var f = friends[i];

      var el = f.getElementsByTagName("div")[0]
        .getElementsByTagName("div")[0]
        .getElementsByTagName("div")[0]
        .getElementsByTagName("dl")[0];
      
      var name = el.getElementsByTagName("dd")[0].getElementsByTagName("a")[0].textContent;
      var id = reId.exec(el.getElementsByTagName("dd")[1].textContent)[1];

      var serverEl = f.getElementsByTagName("div")[0]
        .getElementsByTagName("div")[0]
        .getElementsByTagName("div")[1];

      var server = serverEl.getElementsByTagName("dd")[0].textContent.replace("： ", "");
      var area = serverEl.getElementsByTagName("dd")[1].textContent.replace("： ", "");
      var online = ("--" != server);
      
      console.log(name + ", " + id + ", " + server + ", " + area + ", online: " + online );
      results.push({name: name, id: id, server: server, area: area, online: online});
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
