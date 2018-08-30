/**
 * DB File
 * 
 */
var idb =

function(){

   'use strict';
   //check for support
   if (!('indexedDB' in window)) {
     console.log('This browser doesn\'t support IndexedDB');
     return;
   }

   var dbPromise = idb.open('restaurants', 3, function(upgradeDb) {

     switch (upgradeDb.oldVersion) {
     case 0:

     if (!upgradeDb.objectStoreNames.contains('restaurants')) {
       upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
       putRestaurants();
     }
   }
 });



   function putRestaurants(){
            const api_url = "http://localhost:1337/restaurants/"
            fetch(api_url)
             .then (response => {
                                   return response.json()
                                 })
             .then(items => {
             dbPromise.then(db =>
             {
                var tx = db.transaction('restaurants', 'readwrite');
                var store = tx.objectStore('restaurants');
                    return Promise.all(items.map(item => {
                        return store.add(item);
                   })
                 ).catch( e => {
                   tx.abort();
                   console.log(e);
                 }).then(function() {
                   console.log('All restaurants added successfully!');
                 });
           });
         });
      }

      function pullRestaurants() {
        return dbPromise.then(function(db) {
          var tx = db.transaction('restaurants', 'readonly');
          var store = tx.objectStore('restaurants');
          return store.getAll();
        });
       }

      function pullRestaurantById(id){
        return dbPromise.then(function(db) {
          var tx = db.transaction('restaurants', 'readonly');
          var store = tx.objectStore('restaurants');
          return store.get(id);
        });
      }

 return {
      dbPromise: (dbPromise),
      fetchRestaurants: (pullRestaurants),
      putRestaurants: (putRestaurants),
      pullRestaurantById: (pullRestaurantById)
     }



}()




class DBHelper {

  static fetchRestaurants(callback) {
    idb.fetchRestaurants().then(function(restaurants){
      return restaurants;
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
     idb.fetchRestaurants().then(function(restaurants,error){
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant

          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    idb.fetchRestaurants().then(function(restaurants,error){
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    idb.fetchRestaurants().then(function(restaurants,error){
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants

    idb.fetchRestaurants().then(function(restaurants,error){


      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }

        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants


    idb.fetchRestaurants().then(function(restaurants,error){


    //DBHelper.fetchRestaurants((error, restaurants) => {

      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants

        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)

        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    })
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    idb.fetchRestaurants().then(function(restaurants,error){
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants

        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)

        callback(null, uniqueCuisines);
      }
    });
  }


  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {

    return (`./img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}