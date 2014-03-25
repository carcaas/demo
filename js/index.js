/* -----------------------------------
--------------------------------------
--------------------------------------
        Variables Globales
--------------------------------------
--------------------------------------
-------------------------------------*/
var app;
var map; // Variable que controla el mapa
var options; // Variable que controla las opciones del mapa
var bounds;

//  bases de datos
var db;
var dbCreated = false;
var strIdiomaTabla="ES";//Se utiliza para acceder a las diferentes tablas según el idiomas.

/*Funciones de inicio*/
function onDeviceReady() {
    try{
        inicializarBBDD();

    }catch(ex) {
        alert("Error mapa en onDeviceReady:" +ex)
    }
}
//function aaa(position){
//
//}
//function bbb(error){
//	    
//		if(1==error.code){
//			alert(error.message);
//		}
//		
//}
function inicializarApp(){
    //Comprobar el idioma guardado
    if (map== null)	inicializarMapa_Idioma();
}

function resizeMap(){
	try{
		$("#map-canvas").height(Math.max(100,$(window).height()-90));// TODO set 
	}
	catch(ex)
	{
	alert("Error en resizeMap: "+ex);
	}
}

function resizeVew(){

	if(map!=null){
		$('#map_canvas').height(($("body").height()-$("#cabecera").height()));
		//map.fire('resize');
		 console.debug("Hecho el resize del mapa");
	 }
	}

function inicializarMapa_Idioma(){

    try{
		//alert("antes de resize");
		//resizeMap();
        $('#map_canvas').height(($("body").height()-$("#cabecera").height()));

        //Extensión del mapa de las tiles y aplica loa cambios sobre el mapa
        //Al ser asíncronas las llamadas a la bbdd, metemos toda la gestión del mapa en el resultado de la consulta: fSetConfigMapa
        obtenerdatosConfig();

    }catch(ex){
        alert(ex)
    }
}

function inicializarBBDD(){
    try{
        db = window.openDatabase("AnayaPapel", "1.0", "PhoneGap Demo", 200000);
        //Comprobamos si existe o no la bbdd
        db.transaction( function(tx){ bbddComprobarExistenciaBBDD(tx) }, transaction_errorBBDDNoCreada ); //bbddComprobarExistenciaBBDD
    }catch(ex) {
        alert("Error crearbbdd en deviceReady ");
    }
}

function bbddComprobarExistenciaBBDD(tx){
   // alert("bbddComprobarExistenciaBBDD");
        tx.executeSql("SELECT * from 'Version'", [], transaction_errorBBDDNoCreada); //en leaflet.js
}

function transaction_errorBBDDNoCreada(tx, results){
   // alert("transaction_errorBBDDNoCreada");
    if 	(results == null || results.rows.length==0 ||results.rows.item(0).Version!=2){
        //La base de datos no esta creada pasamos a crearla
        db.transaction(createDB, transaction_error, createDB_success); //createDB es una función de bbdd.js con las querys de creación de bbddd
    }else{
        alert("else");
        createDB_success()
    }
}

function createDB_success() {
    //alert("Inicializamos app");
    inicializarApp();
}
function transaction_error(tx, error) {
    $('#busy').hide();
    alert("Error en transactionError: " + error);
}

function obtenerdatosConfig() {
    try{
       // alert("obtenerdatosConfig");
        db.transaction( function(tx){ fGetDatosApp(tx) }, transaction_error );
    }catch(ex) {
        alert("Error obtenerExtensionTiles")
    }
}
function obtenerdatoPOIS() {
    try{
       // alert("obtenerdatosConfig");
        db.transaction( function(tx){ fGetPoisApp(tx) }, transaction_error );
    }catch(ex) {
        alert("Error obtenerPOIS")
    }
}

function fGetDatosApp(tx) {
    try{
        var sql = "select * from CONFIG ";
        tx.executeSql(sql, [], fSetDatosApp); //en leaflet.js
    }catch(ex) {
        alert("Error CONFIG")
    }
}
function fGetPoisApp(tx) {
    try{
        var sql = "select * from POIS ";
        tx.executeSql(sql, [], fSetPoisApp); //en leaflet.js
    }catch(ex) {
        alert("Error pois")
    }
}
function lanzarResizeMapa(){
	if(map!=null){
		map._resetView(map.getCenter(), map.getZoom(), true);
		map.fire('resize');
		console.debug("resize lanzado");
	}
}
function fRecargarCapas(){
		try{
			map.fire('resize');
		}
		catch(e){
			
			//alert("Error en fRecargarCapas: "+e);
		}
	}

	function fSetMapOptions(){
	
		try{
		
			//Lo metemos aquí para que se haga después de los eleementos del mapa
			options = {minZoom: 12,maxZoom: 17,opacity: 1.0,tms: false};

            //Capa base. CCA. Cambio para pozuelo
            L.tileLayer('tiles/base/{z}/{x}/{y}.png', options).addTo(map);
			//L.tileLayer('tiles/pozuelo/{z}/{x}/{y}.jpg', options).addTo(map);
			  //zoom con dos dedos enabled
            map.touchZoom.enable();
			//Establecemos los máximos
            map.setMaxBounds(bounds);		
			
			insertarControlPosicion();
			
		}
		catch(e)
		{
			console.debug(e);
		}
	}
	
function fSetDatosApp(tx, results){
    try{

        for (var i=0; i< results.rows.length; i++) {
            var dimensiones = results.rows.item(i);

            //Usamos la variable global del mapa para asignar las dimensiones. Añadimos un margen para los límites del mapa.
			bounds = new L.LatLngBounds(
				new L.LatLng((dimensiones.YMIN-0.005),(dimensiones.XMIN-0.005)),
				new L.LatLng((dimensiones.YMAX+0.005),(dimensiones.XMAX+0.005)));

            map = L.map('map_canvas', {touchZoom: true,scrollWheelZoom: false,dragging: true}, { zoomControl:true }).setView([dimensiones.YCENTRO, dimensiones.XCENTRO], 16);
			
			//Rellenamos los puntos de interés
			obtenerdatoPOIS();
			
           
			map.on('resize', function(e) {
				resizeVew();
			});
			
			map.on('viewreset', function (e){
				map.fire('resize');
			});
			
			map.fire('resize');
			
			//hacemos zoom a el elemento
			map.setZoom(15);
		    map.panTo([dimensiones.YCENTRO, dimensiones.XCENTRO]);
        }
		
		
    }
    catch(ex)
    {
        alert("Error en fSetDatosApp: "+ex);
    }
}
//Variable para gestionar el control de la posicion
var lc;
function insertarControlPosicion(){

	// add location control to global name space for testing only
	// on a production site, omit the "lc = "!
	lc = L.control.locate({
			follow: true
	}).addTo(map);
	

	map.on('startfollowing', function() {
    map.on('dragstart', lc.stopFollowing);
		}).on('stopfollowing', function() {
			map.off('dragstart', lc.stopFollowing);
		});
		
	map.fire('resize');
}


function fCargarPois(){
    try{
        var sql = "select * from POIS";
        tx.executeSql(sql, [], fSetPoisApp);
    }
    catch (ex){
        alert(ex);
    }
}
function fSetPoisApp(tx, results){
    try{
        
		var LeafIcon = L.Icon.extend({
			options: {
				iconSize:     [38, 95],
				shadowSize:   [50, 64],
				iconAnchor:   [22, 94],
				shadowAnchor: [4, 62],
				popupAnchor:  [-3, -76]
			}
		});
		
		//var pinIcon = new LeafIcon({iconUrl: 'libs/images/marker-icon.png'});
		//var pinIcon = L.icon({iconUrl: 'libs/images/marker-icon.png'});
		var pinIcon = L.icon({
				iconUrl: 'libs/leaflet-0.7/images/poi.png',
				iconSize:     [29, 35], // size of the icon
				iconAnchor:   [8, 35], // point of the icon which will correspond to marker's location
				shadowAnchor: [4, 62],  // the same for the shadow
				popupAnchor:  [3, -35] // point from which the popup should open relative to the iconAnchor
	
			});

		var popup;
        for (var i=0; i< results.rows.length; i++) {
            var elemento = results.rows.item(i);

			//Quitamos el aspa del popup
			popup = L.popup();
			popup.setContent(elemento.DESCRIPTION);
			popup.options.closeButton=false;
				
            //Usamos la variable global del mapa para asignar las dimensiones
            //var marker=L.marker([elemento.Y, elemento.X],{icon:pinIcon}).addTo(map).bindPopup(elemento.DESCRIPTION);
			var marker=L.marker([elemento.Y, elemento.X],{icon:pinIcon}).addTo(map).bindPopup(popup);
        }
		
		//Establecemos el resto de parámtros.
		fSetMapOptions();
		
    }
    catch(ex)
    {
        alert("Error en fSetPoisApp: "+ex);
    }

}

//POSICION GPS
 var watchID = null;
   
// onSuccess Geolocation
//
function onSuccessWhatch(position) {
alert( 'Latitude: '  + position.coords.latitude      + '<br />' +
		'Longitude: ' + position.coords.longitude     + '<br />' +
		'<hr />');
}

// clear the watch that was started earlier
//
function clearWatch() {
	alert('no geoposicionado');
	if (watchID != null) {
		navigator.geolocation.clearWatch(watchID);
		watchID = null;
	}
}


// onError Callback receives a PositionError object
//
function onErrorWhatch(error) {
	alert('22code: '    + error.code    + '\n' +
		'message: ' + error.message + '\n');
}



function fEscucharPosicion(){
 // Get the most accurate position updates available on the
    // device.

    var options = { frequency: 5000 };
    watchID = navigator.geolocation.watchPosition(onSuccessWhatch, onErrorWhatch, options);
	alert('iD: '+watchID);
}

//Variables que pintan la posición actual. Se limpian cada vez que lanza el evento.
var circle;
var latlng;
var marker;

		
			
//Funcion que pinta un circulo y un marker a modo de posicion gps
function pintarCirculo(position){
	try{

		latlng = new L.LatLng(position.coords.latitude,position.coords.longitude);
		//marker = L.marker(latlng).addTo(map);
		// circle = L.circle(latlng, 10, {
			// color: '#03f',
			// fillColor: '#90D8E2',
			// fillOpacity: 1
		// }).addTo(map);
		
		var pinIconGps = L.icon({
			iconUrl: 'libs/leaflet-0.7/images/bola_gps.png',
			iconSize:     [28, 28], // size of the icon
			iconAnchor:   [14, 14], // point of the icon which will correspond to marker's location
			shadowAnchor: [4, 62],  // the same for the shadow
			popupAnchor:  [3, -35] // point from which the popup should open relative to the iconAnchor

		});		
		
		marker = L.marker([position.coords.latitude,position.coords.longitude],{icon:pinIconGps}).addTo(map);
		// marker=L.marker([elemento.Y, elemento.X],{icon:pinIcon}).addTo(map).bindPopup(elemento.DESCRIPTION);
				
	}
	catch(ex)
    {
        alert("Se ha producido un error al establecer su posición. "+ex);
    }
}

function irA(position){
		
		var latlng = new L.LatLng(position.coords.latitude,position.coords.longitude);
		map.panTo(latlng);
}
function despintarMarcaGps(){
	try{
		//Despintamos los puntos gps
		//map.removeLayer(marker);
		map.removeLayer(marker);
		}
	catch(ex){
		alert("Error al despintar la ubicación.");
	}
}
function fValidarBounds(position, idEscucha){
	try{
		
		//Asignamos el id desde el control
		watchID=idEscucha;
		
		//Solo se cumplirá esta condición la cuando haya pasado alguna vez.
		if(marker!=null){
			despintarMarcaGps();	
		}
		 latlng = new L.LatLng(position.coords.latitude,position.coords.longitude);
		//Comprobamos que estemos dentro de la extensión del mapa.
		if( map.getBounds().contains(latlng))
		{
			//var lgisPosicion= new L.Point(latlng);
			//Mostramos sobre el mapa y centramos
			pintarCirculo(position);
			lc.startLocate();
		}
		else{
			alert("No está dentro de la zona del mapa");
			lc.stopLocatePhonegap();
			lc.startLocate();
			//lc.stopLocate();
			//pintarCirculo(position);
		}
	}
	catch(ex){

	}
}
function fObtenerPosicion(){
    try{
	
		
        var onSuccess = function(positionm, watchID) {
			
			fValidarBounds(position);
		
			//Zoom al elemento
			//map.panTo(new L.LatLng(40.737, -3.923));
			map.setView(latlng,17);
        };

        // onError Callback receives a PositionError object
        function onError(error) {
            alert('11code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
        }	
		
		var options = {maximumAge: 3000, timeout: 5000,enableHighAccuracy: true };
        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
        		
    }
    catch(ex)
    {
        alert("Error en geoposicionamiento. "+ ex);
    }
}

function insertError(){
	$("<div class='ui-loader ui-body-a ui-corner-all'><h5> Usted no se encuentra en el área del mapa. </h5></div>").css({ "display": "block", "width":'100%',"text-align": 'center',"vertical-align": 'middle', "opacity": 0.88, "top": $(window).scrollTop() + $('#map_canvas').height()-10, "float":'left', "left":'0%'})
	  .appendTo( $("#cabecera"))
	  .delay( 3500 )
	 .fadeOut( 400, function(){
		$(this).remove();
	  });
}

function fDisplayLoading(){
	  $.mobile.loading( "show", {
            text: "Geoposicionando",
            textVisible: true,
            theme: "a",
            textonly: false,
            html: ""
    });
		
}

function fHideLoading(){
	$.mobile.loading( "hide" );
}
	