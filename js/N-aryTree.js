function Tree(value){
	this.value=value;
	this.sons= [] ;
	
	this.insertSons =
		function (n){
			this.sons.push(n);
		}

	this.preOrder =
		function(){
			var visit = "";
			for(var i in this.sons){
				visit+=this.sons[i].preOrder()+" ";
			}
			return this.value +" " +visit + " ";
		}

	this.postOrder =
		function(){
			var visit ="";
			for(var i in this.sons){
				visit+=this.sons[i].postOrder()+" ";
			}
			return visit + this.value + " ";
		}

	this.high =
		function(){
			if(this.sons.length==0){
				return 0;
			}
			var maxHigh =this.sons[0].high();
			for(var i=1 ; i<this.sons.length; i++){
				var highSon =this.sons[i].high();
				if(highSon >maxHigh){
					maxHigh=highSon
				}
			}
			return maxHigh + 1;
		}

	this.frontier=
		function(){
			if(this.sons.length == 0){
				return this.value + " ";
			}
			var f="";
			for (var i in this.sons){
				f += this.sons[i].frontier();
			}
			return f;
		}
	}

function Launch(){
	var a1= new Tree("Andrea");
	var a2= new Tree("Giacomo");
	var a3= new Tree("Marta");
	var a4= new Tree("Camillo");
	var a5= new Tree("Luca");
	var a6= new Tree("Filippo");
	var a7= new Tree("Antonio");
	var a8= new Tree("Carmelo");
	a1.insertSons(a2);
	a1.insertSons(a3);
	a1.insertSons(a4);
	a2.insertSons(a5);
	a3.insertSons(a6);
	a3.insertSons(a7);
	a7.insertSons(a8);
	
	document.write("Visit PreOrder: "+a1.preOrder()+"<br>");
	document.write("Visit PostOrder: "+a1.postOrder()+"<br>");
	document.write("High Tree: "+a1.high()+"<br>");
	document.write("Frontier: "+a1.frontier()+"<br>");
	
	}