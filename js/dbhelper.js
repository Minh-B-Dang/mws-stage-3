/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }


  static dbPromise() {
    return idb.open('db', 2, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const reviewsStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewsStore.createIndex('restaurant', 'restaurant_id');
      }
    });
  }

  static fetchRestaurants() {
    return this.dbPromise()
      .then(db => {
        const tx = db.transaction('restaurants');
        const restaurantStore = tx.objectStore('restaurants');
        return restaurantStore.getAll();
      })
      .then(restaurants => {
        if (restaurants.length !== 0) {
          return Promise.resolve(restaurants);
        }
        return this.fetchRestaurants();
      })
  }

  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL + 'restaurants')
      .then(response => response.json())
      .then(restaurants => {
        return this.dbPromise()
          .then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantStore = tx.objectStore('restaurants');
            restaurants.forEach(restaurant => restaurantStore.put(restaurant));

            return tx.complete.then(() => Promise.resolve(restaurants));
          });
      });
  }

  static addReview(review) {
    let reviewObj = {
      name: 'addReview',
      data: review,
      object_type: 'review'
    };
    // Check if online
    if (!navigator.onLine && (reviewObj.name === 'addReview')) {
      DBHelper.sendDataIfOnline(reviewObj);
      return;
    }

    let reviewSend = {
      name: review.name,
      rating: parseInt(review.rating),
      comments: review.comments,
      restaurant_id: parseInt(review.restaurant_id)
    };


    fetch(`http://localhost:1337/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewSend),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then((response) => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return response.json();
      } else { 
        return 'API call successful'
        }
      })
      .then((data) => {
        console.log(`Fetch successful!`)
      })
      .catch(error => console.log('error:', error));
  }

  static sendDataIfOnline(reviewObj) {
    localStorage.setItem('data', JSON.stringify(reviewObj.data));
    window.addEventListener('online', (event) => {
      console.log('Browser: Online again!');
      let data = JSON.parse(localStorage.getItem('data'));
      [...document.querySelectorAll(".reviews_offline")]
      .forEach(element => {
        element.classList.remove("reviews_offline")
        element.querySelector(".offline_label").remove()
      });
      if (data !== null) {
        console.log(data);
        if (reviewObj.name === 'addReview') {
          DBHelper.addReview(reviewObj.data);
        }

        localStorage.removeItem('data');
        console.log(`Local Storage: ${reviewObj.object_type} removed`);
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.find(r => r.id === id));
  }

  static updateStatus(restaurantId, isFavorite) {
    console.log('changing status to: ', isFavorite);

    fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavorite}`, {
        method: 'PUT'
      })
      .then(() => {
        this.dbPromise()
          .then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            store.get(restaurantId)
              .then(restaurant => {
                restaurant.is_favorite = isFavorite;
                store.put(restaurant);
              });
          })
      })
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.filter(r => r.cuisine_type === cuisine));
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.filter(r => r.neighborhood === neighborhood));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        return uniqueNeighborhoods;
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        return uniqueCuisines;
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
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    })
    marker.addTo(newMap);
    return marker;
  }





  /**
   * Fetch all reviews.
   */

  static storeInIndexedDb(table, objects) {
    this.dbPromise.then(function(db) {
      if (!db) return;

      let tx = db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      if (Array.isArray(objects)) {
        objects.forEach(function(object) {
          store.put(object);
        });
      } else {
        store.put(objects);
      }
    });
  }

  static getObjById(table, _id, id) {
    return this.dbPromise()
      .then(db =>{
        if (!db) return;
        const store = db.transaction(table).objectStore(table);
        const indexId = store.index(_id);
        return indexId.getAll(id);
      });
  }

  static fetchReviewsByRestId(id) {
    return fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(reviews => {
        this.dbPromise()
          .then(db => {
            if (!db) return;

            let tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            if (Array.isArray(reviews)) {
              reviews.forEach((review) => {
                store.put(review);
              });
            } else {
              store.put(reviews);
            }
          });
        return Promise.resolve(reviews);
      })
      .catch(error => {
        return DBHelper.getObjById('reviews', 'restaurant', id)
          .then((storedReviews) => {
            console.log('looking for offline stored reviews', error);
            return Promise.resolve(storedReviews);
          })
      });
  }
}