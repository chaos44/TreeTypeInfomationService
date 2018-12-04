
function scrollTo(node,pos){
	if(this.handle)
		clearInterval(this.handle);
	pos -= 20;
	if(pos < 0)
		pos = 0;
	var limit = node.scrollHeight -node.clientHeight;
	if (pos > limit)
		pos = limit;
	this.handle = setInterval(function(){
		var p = pos - node.scrollTop;
		if(Math.abs(p) < 5){
			node.scrollTop = pos;
			clearInterval(this.handle);
			this.handle = null;
		}
		else
			node.scrollTop += p/5;

	},10);
}
function createAdsenseNode(parent,pos){
	var code;
	if (!System.adsense)
		return;
	if(pos == 'TOP'){
		code = System.adsense.top;
	}
	if (pos == 'BOTTOM') {
		code = System.adsense.bottom;
	}
	if (pos == 'INNER') {
		code = System.adsense.inner;
	}
	if(!code)
		return null;

	//サイズ調整
	var div = document.createElement('div');
	div.style.boxSizing = 'border-box';
	div.style.overflow = 'hidden'
	if(pos == 'TOP')
		parent.insertBefore(div,parent.firstChild);
	else
		parent.appendChild(div);
	div.innerHTML = code;
/*
	//広告コードの挿入
	var dummy = document.createElement('div');
	dummy.innerHTML = code;
	for(var i=0;i<dummy.childNodes.length;i++){
		div.appendChild(dummy.childNodes[0]);
	}
*/
	setTimeout(function(){
		try {
			(adsbygoogle = window.adsbygoogle || []).push({});
		} catch (e) { }
	},10);
	return div;
}
function createAdsenseNode2(parent, pos) {
	var code;
	if (!System.rakuten)
		return null;
	if (pos == 'TOP') {
		code = System.rakuten.top;
	}
	if (pos == 'BOTTOM') {
		code = System.rakuten.bottom;
	}
	if (pos == 'INNER') {
		code = System.rakuten.inner;
	}
	if (!code)
		return null;

	//サイズ調整
	var iframe = document.createElement('iframe');
	iframe.style.border = 'none'
	iframe.style.width = '100%'
	iframe.style.height = '210px'
	iframe.style.paddingLeft = '8%';
	iframe.style.paddingRight = '8%';
	if(pos == 'TOP')
		parent.insertBefore(iframe,parent.firstChild);
	else
		parent.appendChild(iframe);

	setTimeout(function(){
		iframe.contentDocument.write(code)


	},0);
	return iframe;
}
function createAdsenseNode3(parent, pos) {
	var code;
	if (!System.amazon)
		return null;
	if (pos == 'TOP') {
		code = System.amazon.top;
	}
	if (pos == 'BOTTOM') {
		code = System.amazon.bottom;
	}
	if (pos == 'SIDE') {
		code = System.amazon.side;
	}
	if (!code)
		return null;

	//document.writeのフック
	var documentWrite = document.write;
	document.write = function(value){
		var div = document.createElement('div');
		div.innerHTML = value;
		parent.appendChild(div);
		document.write = documentWrite;
	}
	//広告コードの挿入
	var dummy = document.createElement('div');
	dummy.innerHTML = code;
	while(dummy.childNodes.length){
		let node =  dummy.childNodes[0];
		dummy.removeChild(node);
		if(node.nodeName === 'SCRIPT'){
			var script = document.createElement('SCRIPT');
			if(node.src)
				script.src = node.src;
			script.innerHTML = node.innerHTML;
			parent.appendChild(script);
		}
		else
			parent.appendChild(dummy.childNodes[0]);
	}


}
function createContentsView(){
	function jumpContents(id) {
		if (Contents.nodes[id]) {
			node = Contents.nodes[id];
			var y = node.getBoundingClientRect().top - page.getBoundingClientRect().top;
			setTimeout(function(){scrollTo(client, y-200);},0);
		}
	}

	var win = GUI.createWindow();
	var client = win.getClient();
	client.style = "overflow:auto;";
	var page = document.createElement("div");
	page.className = "ContentsPage";
	client.appendChild(page);
	win.loadContents = function(id){
		//コンテンツが存在するなら移動して終了
		if (Contents.nodes[id]){
			jumpContents(id);
			return;
		}

		ADP.exec("Contents.getContentsPage",id).on=function(value){
			win.removeChildAll();
			if(value === null)
				return;

			Contents.nodes = [];
			while (page.childNodes.length)
				page.removeChild(page.childNodes[0]);
			var contents = createContents(value);
			page.appendChild(contents);

			var contentsChilds = contents.querySelectorAll('.ContentsArea');

			var allHeight = 0;
			var height = 0;
			var count = 0;
			//記事内広告の設定
			for(var i=0;i<contentsChilds.length;i++){
				var c = contentsChilds[i];
				height += c.offsetHeight;
				allHeight +=  c.offsetHeight;
				if(height > 900){
					if(count++ == 0)
						createAdsenseNode2(c, "INNER");
					else
						createAdsenseNode(c, "INNER");
					height = 0;
				}
			}


			if(allHeight > 300)
				createAdsenseNode(page,"TOP");	//トップ広告の挿入

			if (length > 900)
				createAdsenseNode(page, "BOTTOM");	//ボトム広告の挿入

			//サイドバー
			// var client = System.adArea.getClient()
			// // while (client.childNodes.length)
			// // 	client.removeChild(client.childNodes[0])
			// if (client.childNodes.length === 0)
			// 	createAdsenseNode3(System.adArea.getClient(),"SIDE");

			jumpContents(id);

			//トラッカーに通知
			try {
				gtag('config', AnalyticsUA, { 'page_title': value["title"], 'page_path': '/?p=' + value["id"]});
			} catch (e) { }

			var desc = document.head.querySelector("meta[name=description]");
			if(!desc){
				desc = document.createElement("meta");
				desc.name = "description";
				document.head.appendChild(desc);
			}
			desc.content = page.querySelector(".Body").textContent.substr(0,40);

		}
	}
	win.moveVector = function (id, vector){
		var node = Contents.nodes[id];
		if(node == null)
			return;
		var parent = node.parentNode;
		var childs = parent.childNodes;
		for (var i = 0; i < childs.length; i++) {
			if (childs[i] === node) {
				if (vector < 0) {
					if (i === 0)
						return false;
					parent.insertBefore(node, childs[i - 1]);
				} else {
					if (i === childs.length - 1)
						return false;
					parent.insertBefore(childs[i + 1], node);
				}
				break;
			}
		}
	}
	Contents.addEvent("update",function(r){
		var value = r.value;
		var contents = Contents.nodes[value["id"]];
		if (contents)
			contents.updateContents(value);
	});
	Contents.addEvent("delete", function (r) {
		var ids = r.ids;
		if (ids && ids.length > 0) {
			for (var i in ids) {
				var id = ids[i];
				var contents = Contents.nodes[id];
				if (contents) {
					contents.deleteContents();
				}
			}
		}
	});
	return win;
}
function createContents(value){
	var area = document.createElement('div');
	area.className = "ContentsArea";
	Contents.nodes[value["id"]] = area;
	var contents = document.createElement('div');
	contents.className = "Contents";
	area.appendChild(contents);

	//管理者用編集メニュー
	if (SESSION.isAuthority("SYSTEM_ADMIN"))
		contents.appendChild(createControlPanel(value["id"]));

	var title = document.createElement('div');
	contents.appendChild(title);

	var date = document.createElement('div');
	date.className = "Date";
	contents.appendChild(date);

	var body = document.createElement('div');
	body.className = "Body";
	contents.appendChild(body);

	var childs = document.createElement('div');
	childs.className = "Childs";
	area.appendChild(childs);

	var c = value["childs"];
	for(var i in c){
		childs.appendChild(createContents(c[i]));
	}
	area.updateContents = function(value){
		if (area.dataset.type === value["type"]){
			area.dataset.stat = value["stat"];
			title.className = "Title" + value["title_type"];
			title.textContent = value["title"];
			date.textContent = (new Date(value["date"])).toLocaleString();
			body.innerHTML = value["value"];
			var nodes = body.querySelectorAll("img");
			for(var i=0;i<nodes.length;i++){
				node = nodes[i];
				node.onclick = function(){
					window.open(this.src, 'newtab');
				}
			}
			var nodes = body.querySelectorAll(".code");
			for (var index = 0; nodes[index]; index++) {
				var node = nodes[index];
				hljs.highlightBlock(node);
			}
			var nodes = body.querySelectorAll(".update");
			for (var index = 0; nodes[index]; index++) {
				var node = nodes[index];
				checkUpdate(node);
			}
		}
	}
	function checkUpdate(node){
		ADP.exec("Contents.checkUpdate",10).on = function(values){
			if(!values)
				return;
			for(var i=0;i<values.length;i++){
				var value = values[i];
				var div = document.createElement("div");
				var span = document.createElement("span");
				span.innerText = (new Date(value["date"])).toLocaleString();
				div.appendChild(span);
				var span = document.createElement("span");
				span.innerText = value["title2"];
				div.appendChild(span);
				node.appendChild(div);
				div.dataset.id = value["id"];
				div.onclick = function(){
					Contents.selectContents(this.dataset.id);
				}
			}
		}
	}
	area.deleteContents = function () {
		area.parentNode.removeChild(this);
		Contents.nodes[value["id"]] = null;
	}
	area.dataset.type = value["type"];
	area.updateContents(value);
	return area;
}
function createControlPanel(id){
	function onClick(){
		switch(this.index){
		case 0:
			createCustomEditor(id);
			break;
		case 1:
			Contents.createContentsMenu(id, 'TEXT', this);
			break;
		case 2:
			Contents.moveVector(id, -1);
			break;
		case 3:
			Contents.moveVector(id, 1);
			break;
		}
	}

	var items = ["Edit", "🖹", "🔺", "🔻"];
	var panel = document.createElement('div');
	panel.className = "Panel";
	for(var i in items){
		var d = document.createElement('div');
		d.textContent = items[i];
		panel.appendChild(d);
		d.index = parseInt(i);
		d.addEventListener("click",onClick);
	}
	return panel;
}