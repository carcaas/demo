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
            color: '#136AEC',
            fillColor: '#136AEC',
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.5
        },
        // inner marker
        markerStyle: {
            color: '#136AEC',
            fillColor: '#2A93EE',
            fillOpacity: 0.7,
            weight: 2,
            opacity: 0.9,
            radius: 5
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
            alert(err.message);
        },
        onLocationOutsideMapBounds: function(context) {
            // this event is repeatedly called when the location changes
            alert(context.options.strings.outsideMapBoundsMsg);
        },
        setView: true, // automatically sets the map view to the user's location
		enableLocation: false, 
        strings: {
            title: "Ir a donde estoy",
            popup: "You are within {distance} {unit} from this point",
            outsideMapBoundsMsg: "Pareces estar fuera de los límites del mapa."
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
                if (self._active && (self._event === undefined || map.getBounds().contains(self._event.latlng) || !self.options.setView ||
                    isOutsideMapBounds())) {
                    //stopLocate();
					stopLocatePhonegap();
                } else {
                    //locate();
					//Carlos Cabanes
					locatePhonegap();
                }
            })
            .on(link, 'dblclick', L.DomEvent.stopPropagation);
			
			
			
		var locatePhonegap=function (){
			//La primera vez que entra, lo que hace es lanzar el escuchador.
			if( watchID!=null){
				fObtenerPosicion();
			}
			else{
			// Get the most accurate position updates available on the
			// device.
			//Testeamos en que estado nos encontramos
				//var options = { frequency: 500 };
				var options = {maximumAge: 3000, timeout: 10000,enableHighAccuracy: true };
				watchID = navigator.geolocation.watchPosition(onSuccessWhatch, onErrorWhatch, options);
				
			}
		}
		
		//POSICION GPS
		 var watchID = null;
		 var estado=false;
		// onSuccess Geolocation
		
		function goTOPoint(position) {
		
			alert("bien:" + position.coords.latitude+","+position.coords.longitude);
			pintarCirculo(position);
			irA(position);
		}
		
		function onSuccessWhatch(position) {
			//Carlos. Evento que recoge la posicion y la manda a la funcion de pintado
			fValidarBounds(position, watchID);
			this.options.enableLocation=true;
		}
	// clear the watch that was started earlier
		//
		var stopLocatePhonegap= function () {
			alert('Fin de geolocalizacion. Vuelva a pulsar para reiniciar el servicio');
			if (watchID != null) {
				navigator.geolocation.clearWatch(watchID);
				watchID = null;
			}
			this.options.enableLocation=false;
			 //this.options.enableLocation=false;
			
			//Estilos de desactivado
			L.DomUtil.removeClass(self._container, "active");
			L.DomUtil.addClass(self._container, "following");

		}


		// onError Callback receives a PositionError object
		//
		function onErrorWhatch(error) {
			
			alert('code: '    + error.code    + '\n' +
				'message: ' + error.message + '\n');
		}

        var locate = function () {
            if (self.options.setView) {
                self._locateOnNextLocationFound = true;
            }
			//Carlos Cabanes. Seguimos con la lógica e introducimos el phonegap aquí
            if(!self._active) {
				//Ubicamos
                map.locate(self._locateOptions);
				
            }
            self._active = true;
            if (self.options.follow) {
				//Activamos el seguimiento
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
            // no need to do anything if the location has not changed
            if (self._event &&
                (self._event.latlng.lat === e.latlng.lat &&
                 self._event.latlng.lng === e.latlng.lng &&
                 self._event.accuracy === e.accuracy)) {
                return;
            }

            if (!self._active) {
                return;
            }

            self._event = e;

            if (self.options.follow && self._following) {
                self._locateOnNextLocationFound = true;
            }

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
            return map.options.maxBounds &&
                !map.options.maxBounds.contains(self._event.latlng);
        };

        var visualizeLocation = function() {
		
            if (self._event.accuracy === undefined)
                self._event.accuracy = 0;

            var radius = self._event.accuracy;
            if (self._locateOnNextLocationFound) {
                if (isOutsideMapBounds()) {
                    self.options.onLocationOutsideMapBounds(self);
                } else {
                    map.fitBounds(self._event.bounds, { padding: self.options.circlePadding });
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

                if (!self._circle) {
                    self._circle = L.circle(self._event.latlng, radius, style)
                        .addTo(self._layer);
                } else {
                    self._circle.setLatLng(self._event.latlng).setRadius(radius);
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
                self._circleMarker = L.circleMarker(self._event.latlng, mStyle)
                    .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                    .addTo(self._layer);
            } else {
                self._circleMarker.setLatLng(self._event.latlng)
                    .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                    ._popup.setLatLng(self._event.latlng);
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
            map.stopLocate();
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
            // ignore time out error if the location is watched
            if (err.code == 3 && this._locateOptions.watch) {
                return;
            }

            stopLocate();
            self.options.onLocationError(err);
        };

        // event hooks
        map.on('locationfound', onLocationFound, self);
        map.on('locationerror', onLocationError, self);

        // make locate functions available to outside world
        this.locate = locate;
        this.stopLocate = stopLocate;
        this.stopFollowing = stopFollowing;
		this.stopLocatePhonegap=stopLocatePhonegap;
		
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
