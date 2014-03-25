/*
Copyright (c) 2013 Dominik Moritz

This file is part of the leaflet locate control. It is licensed under the MIT license.
You can find the project at: https://github.com/domoritz/leaflet-locatecontrol
*/
L.Control.Locate = L.Control.extend({
    options: {
        position: 'topleft',
        drawCircle: true,
        follow: false,  // follow with zoom and pan the user's location
        stopFollowingOnDrag: false, // if follow is true, stop following when map is dragged (deprecated)
        // range circle
        circleStyle: {
            iconUrl: 'libs/leaflet-0.7/images/bola_gps.png',
			iconSize:     [28, 28], // size of the icon
			iconAnchor:   [14, 14], // point of the icon which will correspond to marker's location
			shadowAnchor: [4, 62],  // the same for the shadow
			popupAnchor:  [3, -35] // 
        },
        // inner marker
        markerStyle: {
		    iconUrl: 'libs/leaflet-0.7/images/bola_gps.png',
			iconSize:     [28, 28], // size of the icon
			iconAnchor:   [14, 14], // point of the icon which will correspond to marker's location
			shadowAnchor: [4, 62],  // the same for the shadow
			popupAnchor:  [3, -35] // 
        },
        // changes to range circle and inner marker while following
        // it is only necessary to provide the things that should change
        followCircleStyle: {},
        followMarkerStyle: {
            //color: '#FFA500',
            //fillColor: '#FFB000'
        },
        circlePadding: [0, 0],
        metric: true,
        onLocationError: function(err) {
            // this event is called in case of any location error
            // that is not a time out error.
            //alert("Se ha producido un error en su posicionamiento.");
			//stopLocate();
        },
        onLocationOutsideMapBounds: function(context) {
            // this event is repeatedly called when the location changes
            //Carlos: No mensaje
			//alert(context.options.strings.outsideMapBoundsMsg);
			//stopLocate();
        },
        setView: true, // automatically sets the map view to the user's location
        strings: {
            title: "Ir a donde estoy",
            popup: "Usted está aquí",
            outsideMapBoundsMsg: "Está fuera de los límites del mapa"
        },
        locateOptions: {}
    },
    onAdd: function (map) {	
	
        var container = L.DomUtil.create('div',
            'leaflet-control-locate leaflet-bar leaflet-control');

        var self = this;
        this._layer = new L.LayerGroup();
        this._layer.addTo(map);
        this._event = undefined;

        this._locateOptions = {
            watch: true  // if you overwrite this, visualization cannot be updated
        };
        L.extend(this._locateOptions, this.options.locateOptions);
        L.extend(this._locateOptions, {
            setView: false // have to set this to false because we have to
                           // do setView manually
        });

        // extend the follow marker style and circle from the normal style
        var tmp = {};
        L.extend(tmp, this.options.markerStyle, this.options.followMarkerStyle);
        this.options.followMarkerStyle = tmp;
        tmp = {};
        L.extend(tmp, this.options.circleStyle, this.options.followCircleStyle);
        this.options.followCircleStyle = tmp;

        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
        link.href = '#';
        link.title = this.options.strings.title;

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', function() {
			var latlng;
			if(self._event!=null){
				latlng= L.latLng( self._event.coords.latitude, self._event.coords.longitude);
				}
                if (self._active && (self._event === undefined || map.getBounds().contains(latlng) || !self.options.setView ||
                    isOutsideMapBounds())) {
					//Paramos solo si está fuera del rango. CCA.
					if(!bounds.contains(latlng))
					{
						insertError();
						//stopLocate();
					}
					else{
						//Mensaje
						
					}
					locate();
                } else {
                    locate();
                }
            })
            .on(link, 'dblclick', L.DomEvent.stopPropagation);
		var watchID;
        var locate = function () {
            if (self.options.setView) {
                self._locateOnNextLocationFound = true;
            }
            if(!self._active) {
                //map.locate(self._locateOptions);
				var options = {frequency:3000,enableHighAccuracy: true };
				if(watchID!=null){
					navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError, options);
				}
				else
				{
					//cargamos el circulo de pensar
					fDisplayLoading();
					watchID = navigator.geolocation.watchPosition(onLocationFound, onLocationError, options);
				}
				
            }
            self._active = true;
            if (self.options.follow) {
                startFollowing();
            }
            if (!self._event) {
                L.DomUtil.addClass(self._container, "requesting");
                L.DomUtil.removeClass(self._container, "active");
                L.DomUtil.removeClass(self._container, "following");
            } else {
                visualizeLocation();
            }
        };

        var onLocationFound = function (e) {

			fHideLoading();
			
           console.debug("Escuchado");
		   //alert(watchID);
			if (self._event &&
                (self._event.coords.latitude === e.coords.latitude &&
                 self._event.coords.longitude === self._event.coords.longitude &&
                  self._event.coords.accuracy === e.coords.accuracy)) {
				  console.debug("Primero");
                return;
            }
			
            if (!self._active) {
				console.debug("segundo");
                return;
            }

            self._event = e;

            if (self.options.follow && self._following) {
                self._locateOnNextLocationFound = true;
				console.debug("tercero");
            }
			console.debug("Antes de visualizeLocation");
             visualizeLocation();
        };

        var startFollowing = function() {
            map.fire('startfollowing');
            self._following = true;
            if (self.options.stopFollowingOnDrag) {
                map.on('dragstart', stopFollowing);
            }
        };

        var stopFollowing = function() {
            map.fire('stopfollowing');
            self._following = false;
            if (self.options.stopFollowingOnDrag) {
                map.off('dragstart', stopFollowing);
            }
             visualizeLocation();
        };

        var isOutsideMapBounds = function () {
            if (self._event === undefined)
                return false;
				
           // return map.options.maxBounds && !map.options.maxBounds.contains(self._event.latlng);
		   var latlng = L.latLng( self._event.coords.latitude, self._event.coords.longitude);
		   
		   var retorno= bounds.contains(latlng);
		   //var retorno = map.getBounds().contains(latlng);
		   //alert("Return: "+retorno+" Coordenadas: "+self._event.coords.latitude+"; "+ self._event.coords.longitude);
		   return !retorno;
        };

        var visualizeLocation = function() {
		    self._event.accuracy = 10;
            //if (self._event.accuracy === undefined)
           
            var radius = self._event.accuracy;
            if (self._locateOnNextLocationFound) {
			console.debug("Entro en if");
                if (isOutsideMapBounds()) {
					insertError();
					console.debug("Fuera de coordenadas");
					//stopLocate();
                    self.options.onLocationOutsideMapBounds(self);
                } else {
					console.debug("Dentro de coordenadas");
					//Carlos: Comento esta linea y asigno la nueva con la respuesta de phonegap
                    //map.fitBounds(self._event.bounds, { padding: self.options.circlePadding });
					var latlng = L.latLng( self._event.coords.latitude, self._event.coords.longitude);
					//var southWest = L.latLng(self._event.coords.latitude, self._event.coords.longitude),
					//northEast = L.latLng(self._event.coords.latitude, self._event.coords.longitude),
					
					var lista= [latlng,latlng,latlng,latlng];
					var extension = L.latLngBounds(lista);

					//Zoom to point
					map.setView(latlng,map.zoom);					
                }
                self._locateOnNextLocationFound = false;
            }

            // circle with the radius of the location's accuracy
            var style, o;
            if (self.options.drawCircle) {
                if (self._following) {
                    style = self.options.followCircleStyle;
                } else {
                    style = self.options.circleStyle;
                }
				var latlng = L.latLng( self._event.coords.latitude, self._event.coords.longitude);
                if (!self._circle) {
                   // self._circle = L.circle(self._event.latlng, radius, style).addTo(self._layer);
				   self._circle = L.circle(latlng, radius, style).addTo(self._layer);
                } else {
                    //self._circle.setLatLng(self._event.latlng).setRadius(radius);
					self._circle.setLatLng(latlng).setRadius(radius);
                    for (o in style) {
                        self._circle.options[o] = style[o];
                    }
                }
            }

            var distance, unit;
            if (self.options.metric) {
                distance = radius.toFixed(0);
                unit = "meters";
            } else {
                distance = (radius * 3.2808399).toFixed(0);
                unit = "feet";
            }

            // small inner marker
            var mStyle;
            if (self._following) {
                mStyle = self.options.followMarkerStyle;
            } else {
                mStyle = self.options.markerStyle;
            }

            var t = self.options.strings.popup;
            if (!self._circleMarker) {
			//CCA. Cambio _event.latlong por latlng
			var latlng = L.latLng( self._event.coords.latitude, self._event.coords.longitude);
			
			var pinIconGps = L.icon({
			iconUrl: 'libs/leaflet-0.7/images/bola_gps.png',
			iconSize:     [28, 28], // size of the icon
			iconAnchor:   [14, 14], // point of the icon which will correspond to marker's location
			shadowAnchor: [4, 62],  // the same for the shadow
			popupAnchor:  [3, -35] // point from which the popup should open relative to the iconAnchor

		});		
					//var marker=L.marker([elemento.Y, elemento.X],{icon:pinIcon}).addTo(map).bindPopup(popup);
                self._circleMarker = L.marker(latlng, {icon:pinIconGps}).bindPopup(L.Util.template(t, {distance: distance, unit: unit})).addTo(self._layer);
            } else {
			
                self._circleMarker.setLatLng(latlng).bindPopup(L.Util.template(t, {distance: distance, unit: unit}))._popup.setLatLng(self._event.latlng);
                for (o in mStyle) {
                    self._circleMarker.options[o] = mStyle[o];
                }
            }

            if (!self._container)
                return;
            if (self._following) {
                L.DomUtil.removeClass(self._container, "requesting");
                L.DomUtil.addClass(self._container, "active");
                L.DomUtil.addClass(self._container, "following");
            } else {
                L.DomUtil.removeClass(self._container, "requesting");
                L.DomUtil.addClass(self._container, "active");
                L.DomUtil.removeClass(self._container, "following");
            }
        };

        var resetVariables = function() {
            self._active = false;
            self._locateOnNextLocationFound = self.options.setView;
            self._following = false;
        };

        resetVariables();

        var stopLocate = function() {
			//Fin de escucha
            //map.stopLocate();
			if (watchID != null) {
				navigator.geolocation.clearWatch(watchID);
				watchID = null;
			}
			
            map.off('dragstart', stopFollowing);

            L.DomUtil.removeClass(self._container, "requesting");
            L.DomUtil.removeClass(self._container, "active");
            L.DomUtil.removeClass(self._container, "following");
            resetVariables();

            self._layer.clearLayers();
            self._circleMarker = undefined;
            self._circle = undefined;
        };

        var onLocationError = function (err) {
		
			fHideLoading();
			
			map.off('dragstart', stopFollowing);
            L.DomUtil.removeClass(self._container, "requesting");
            L.DomUtil.removeClass(self._container, "active");
            L.DomUtil.removeClass(self._container, "following");
			
            // ignore time out error if the location is watched
            if (err.code == 3 && this._locateOptions.watch) {
                return;
            }
            //stopLocate();
            self.options.onLocationError(err);
        };

        // event hooks
        map.on('locationfound', onLocationFound, self);
        map.on('locationerror', onLocationError, self);

        // make locate functions available to outside world
        this.locate = locate;
        this.stopLocate = stopLocate;
        this.stopFollowing = stopFollowing;

        return container;
    }
});

L.Map.addInitHook(function () {
    if (this.options.locateControl) {
        this.locateControl = L.control.locate();
        this.addControl(this.locateControl);
    }
});

L.control.locate = function (options) {
    return new L.Control.Locate(options);
};
