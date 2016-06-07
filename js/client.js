function launch(){
	var x=location.search.split('?select=');
	var selectGet;
	if(x.length<2){
		selectGet=null;
	}
	else{
		selectGet=decodeURIComponent(x[1]);
	}
	//Create Map
	var map=createMap();
	//Include knowledge base
	var endpoint="http://dydra.com/cristianolongo/comune-di-catania/sparql";
	//Created query
	var query = 
				"PREFIX org:<http://www.w3.org/ns/org#> \n"+
				"PREFIX foaf:<http://xmlns.com/foaf/0.1/>\n"+
				"PREFIX locn:<http://www.w3.org/ns/locn#>\n"+
				"PREFIX geo:<http://www.w3.org/2003/01/geo/wgs84_pos#>\n"+

				"select ?site ?address ?lat ?lon ?dir ?dir_name ?dir_homepage ?dir_tel ?dir_mail where\n"+
				"{?dir org:hasPrimarySite ?site . \n"+
				"?site locn:address ?a ."+
				"?a locn:fullAddress ?address ."+
				"?site locn:geometry ?g .\n"+
				"?g geo:lat ?lat .\n"+
				"?g geo:long ?lon .\n"+
				"?dir rdfs:label ?dir_name .\n";
				if(selectGet){
					query+="?dir org:transitiveSubOrganizationOf <"+selectGet+">.\n"
				}
				query+="optional {?dir foaf:homepage ?dir_homepage} .\n"+
				"optional {?dir foaf:phone ?dir_tel} .\n"+
				"optional {?dir foaf:mbox ?dir_mail}\n"+
				"}order by ?site ?dir"  ;
	var query_menu=
				"PREFIX org:<http://www.w3.org/ns/org#> \n"+

				"select ?u ?label ?homepage ?child ?childlabel ?childhomepage where { \n"+
				"?u a org:Organization . \n"+
				"?u rdfs:label ?label . \n"+
				"optional { ?u foaf:homepage ?homepage .} \n"+
				"?u org:hasSubOrganization ?child .\n"+
				"optional { ?child foaf:homepage ?childhomepage .} \n"+
				"?child rdfs:label ?childlabel .\n"+
				"} order by ?u";
	createSparqlQuery(endpoint,query,map,createMarker);
	createSparqlQuery(endpoint,query_menu,map,createMenu);
}

//Created SPARQL query
function createSparqlQuery(endpoint,query,map,callback){	
	var querypart = "query=" + escape(query);
	// Get our HTTP request object.
	var xmlhttp = getHTTPObject();
	//Include POST OR GET
	xmlhttp.open('POST', endpoint, true); 
	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xmlhttp.setRequestHeader("Accept", "application/sparql-results+json");	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState==4 ){
			if(xmlhttp.status==200){				
					callback(xmlhttp.responseText,map);
			}else
				// Error
				alert("Error: Status: "+ xmlhttp.status + "Response: "
						+ xmlhttp.responseText);
		}	
	};
	// Send the query to the endpoint.
	xmlhttp.send(querypart);	
}
//Created Menu
function createMenu(response,map){	
	//Request accept				
	var jsonObj=eval('(' + response + ')');	
	var cut=jsonObj.results.bindings;
	var storage=new Storage();
	
	var descriptionParent="";
	var descriptionChild="";
	
	var homepageChild="";
	var homepageParent="";
	
	var searchParent="";
	var searchChild="";	
	
	for(var i = 0; i< cut.length; i++) {		
		try{
			homepageParent = cut[i].homepage.value;	
		}
		catch(err){
			homepageParent = ""
		}
		try{
			homepageChild = cut[i].childhomepage.value;
		}
		catch (err){
			homepageChild = "";
		}
		descriptionParent = new Description (cut[i].u.value, cut[i].label.value, homepageParent);	
		descriptionChild = new Description (cut[i].child.value, cut[i].childlabel.value, homepageChild);
		
		searchParent=storage.getNode(descriptionParent.getUri());
		searchChild=storage.getNode(descriptionChild.getUri());	
		
		if(searchParent === undefined){			
			searchParent=storage.add(descriptionParent); 
		}
		if(searchChild === undefined){			
			searchChild=storage.add(descriptionChild);			
		}		
		
		searchParent.nodetree.addChild(searchChild.nodetree);
		searchParent.parent= true;
		searchChild.parent= true;
	}
	
	/*//Example new Tree Node
	var a=new Description("aaa","nome","ttgg");
	var b=storage.add(a);
	
	document.write("ALL NODES Last:"+ storage.getNodesWithoutParent(0)+"<br><br>")
	*/
	
	//document.getElementById("navigation").innerHTML="<ul id=\"nav\"></ul>";
	
	document.getElementById("navigation").innerHTML="<ul id=\"nav\"></ul>";
	createLiMenu(storage.nodes[0].nodetree.value,storage.nodes[0].nodetree.children,"nav");
}
//Create Li menù 
function createLiMenu(value,children,id){
	var node=""
	var current=""
	var next=""
	var ul=""
	var ul2="";
	var a=""
	/*First element*/
	if(id.localeCompare("nav")==0){
		a=document.createElement("a");
		next=document.createElement("LI");
		next.setAttribute("id", value.getName());
		a.textContent=value.getName();
		a.setAttribute('href', "index.html?select="+encodeURIComponent(value.getUri()));
		next.appendChild(a);
		document.getElementById(id).appendChild(next);
	}	
	/*Children*/
	if(children.length >0 ){
		ul=document.createElement("UL");
		ul.setAttribute("id","nav_"+value.getName());
		for (var i in children) {
			a=document.createElement("a");
			current=document.createElement("LI");
			current.setAttribute("id",children[i].value.getName());
			a.textContent = children[i].value.getName();
			a.setAttribute('href', "index.html?select="+encodeURIComponent(children[i].value.getUri()));
			current.appendChild(a);
			ul.appendChild(current);
			}
		document.getElementById(value.getName()).appendChild(ul);
		}		
	for (var i in children){	
		createLiMenu(children[i].value,children[i].children,ul.getAttribute("id"));
	}
}


//Create Marker
function createMarker(response,map){
	//Request accept				
	var jsonObj=eval('(' + response + ')');					
	var t=0;//Pointer in the head of json
	var str=""
	var email=""
	var table= new Array()
	//Create Marker
	for(var i = 1; i<  jsonObj.results.bindings.length; i++) {
		//Address and site are equals 
		if (jsonObj.results.bindings[t].site.value.localeCompare(jsonObj.results.bindings[i].site.value)==0 && 
				jsonObj.results.bindings[t].address.value.localeCompare(jsonObj.results.bindings[i].address.value)==0	){
			try{
				//Clone telephone number 
				str+=jsonObj.results.bindings[t].dir_tel.value+"<br>";
				}
						
			catch (err){
				//Telephone number not found
				str+="";
				}
		}
		else{
			//Change pointer 
			try{
				str+=jsonObj.results.bindings[t].dir_tel.value+"<br>";
			}
			catch(err){
				str+=""
			}
			//Insert email
			try{
				email=jsonObj.results.bindings[t].dir_mail.value+"<br>";
			}
			catch(err){
				email=""
			}
			//Create table
			table[table.length]= new Array("<a href=\""+jsonObj.results.bindings[t].dir_homepage.value+"\">"+jsonObj.results.bindings[t].dir_name.value+"</a></b>",
							   jsonObj.results.bindings[t].address.value,email,str,jsonObj.results.bindings[t].lat.value,
							   jsonObj.results.bindings[t].lon.value);			
			str="";
		}					
		t=i;
		//Last element
		if (t==jsonObj.results.bindings.length-1){
			try{
				str+=jsonObj.results.bindings[t].dir_tel.value+"<br>";							
			}
			catch(err){
				str+=""
			}
			//Insert email
			try{
				email=jsonObj.results.bindings[t].dir_mail.value+"<br>";
			}
			catch(err){
				email=""
			}
			table[table.length]= new Array("<a href=\""+jsonObj.results.bindings[t].dir_homepage.value+"\">"+jsonObj.results.bindings[t].dir_name.value+"</a></b>",
							   jsonObj.results.bindings[t].address.value,email,str,jsonObj.results.bindings[t].lat.value,
							   jsonObj.results.bindings[t].lon.value);			
			str="";
			
		}		
		
	}
	createMessage(table,map);
}
//Create Message of PopUp
function createMessage(table,map){
	var message="";
	var control="no";
	for (var i in table) {
		for (var j in table){
			if (j!=i && (table[i][4].localeCompare(table[j][4])==0 && table[i][5].localeCompare(table[j][5])==0)){				
				if(table[i][0].localeCompare(table[j][0])==0){
					message=table[i][0]+"<br>"+table[i][1]+"<br>"+table[j][1]+"<br>"+
								   table[i][3]+table[i][2]+"<br>";
					control="yes";
					createIcon(map,table[i][4],table[i][5],message);
					
				}
				else{
					message=table[i][0]+"<br>"+table[i][1]+"<br>"+
							table[i][3]+table[i][2]+"<br>"+
							table[j][0]+"<br>"+table[j][1]+"<br>"+
							table[j][3]+table[j][2]+"<br>";
					control="yes";
					createIcon(map,table[i][4],table[i][5],message);
				}
			}			
		}
		if(control.localeCompare("no")==0){
			message=table[i][0]+"<br>"+table[i][1]+"<br>"+
					table[i][3]+table[i][2]+"<br>";
			createIcon(map,table[i][4],table[i][5],message);
		}else
			control="no";		
	}
	document.getElementById("navigation").style.visibility = "visible";
	document.getElementById("loading").style.visibility = "hidden";
}

//Request HTTP
function getHTTPObject(){
	var xmlhttp;
	if(!xmlhttp && typeof XMLHttpRequest != 'undefined'){
		try{
			// Code for old browser
			xmlhttp=new ActiveXObject('Msxml2.XMLHTTP');
			}
		catch(err){
			try{
				// Code for IE6, IE5
				xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch(err2){
				try{
					// Code for IE7+, Firefox, Chrome, Opera, Safari
					xmlhttp=new XMLHttpRequest();
				}
				catch(err3){
					xmlhttp=false
				}
			}			
		}
	}
	return xmlhttp;
}		
//Created Map
function createMap(){
	var auxmap = L.map('map').setView([37.506, 15.079], 14);
	L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, '+
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, '+
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
				id: 'andreacostazza.ik9ap86i'
			}).addTo(auxmap);
	return auxmap
}
//Created Icon
function createIcon(map,lat,lon,message){
	//Inserted an icon 		
	var iconBlue= L.icon({
		iconUrl: './icon/marker-icon.png',
		shadowUrl: './icon/marker-shadow.png',
			
		iconSize: [25,41],
		shadowSize: [41,41],
		iconAnchor:[lat,lon],
		shadowAnchor:[lat,lon],
		popupAnchor:[-25,-10]
	});
	
	var marker = L.marker([lat, lon],{icon:iconBlue});		
	marker.addTo(map);	
	marker.bindPopup(message);
}

//Create Object Description with uri,name,homepage attributes
function Description(uri,name,homepage){
	this.uri=uri
	this.name=name;
	this.homepage=homepage;
	
	//Return uri	
	this.getUri=
		function(){
			return this.uri;
	}
	//Return name
	this.getName=
		function(){
			return this.name;
	}
	//Return homepage
	this.getHomepage=
		function(){
			return this.homepage;
	}
}
//Creation class Storage 
function Storage(){
	this.nodes = [];
		
	//Create instance of Tree class and add node into Storage
	this.add=
		function(description){	
			var tree=new Tree(description);
			this.nodes.push({
				nodetree: tree,
				parent: false
			});
			return this.nodes[this.nodes.length-1];
		
	}
	//Return node corresponding to specified uri
	this.getNode=
		function(uri){
			if (this.nodes === undefined || this.nodes.length == 0) {
    		// empty
			return undefined;
			}		
			for(var i in this.nodes){						
					if(this.nodes[i].nodetree.value.getUri().localeCompare(uri)==0)
						return this.nodes[i];
			}
			return undefined;
	}
	//Return nodes without parent
	this.getNodesWithoutParent=
		function(index){
				if(this.nodes.length==index )
					return "";
				if(this.nodes[index].parent== false ){					
					return this.nodes[index].nodetree.value.getName()+this.getNodesWithoutParent(index+1) + " ";
				}
				else
					return this.getNodesWithoutParent(index+1) + " ";
		}	
}
//Create N-ary Tree
function Tree(value){
	this.value=value;
	this.children= [] ;
	
	this.addChild =
		function (child){
			this.children.push(child);
		}
	
	this.getChild =
		function (){
			var current=""
			var next=""
			current+=this.value.getUri() +" has children: ";			
			for (var i in this.children) {
				current+= this.children[i].value.getUri() + " ";
			}
			for (var i in this.children){
				next+="<br>"+this.children[i].getChild()+" ";
			}
			return current+next;
		}
	this.preOrder =
		function(){
			var visit = "";
			for(var i in this.children){
				visit+=this.children[i].preOrder()+" ";
			}
			return this.value +" " +visit + " ";
		}

	this.postOrder =
		function(){
			var visit ="";
			for(var i in this.children){
				visit+=this.children[i].postOrder()+" ";
			}
			return visit + this.value + " ";
		}

	this.high =
		function(){
			if(this.children.length==0){
				return 0;
			}
			var maxHigh =this.children[0].high();
			for(var i=1 ; i<this.children.length; i++){
				var highSon =this.children[i].high();
				if(highSon >maxHigh){
					maxHigh=highSon
				}
			}
			return maxHigh + 1;
		}

	this.frontier=
		function(){
			if(this.children.length == 0){
				return this.value + " ";
			}
			var f="";
			for (var i in this.children){
				f += this.children[i].frontier();
			}
			return f;
		}
	}
