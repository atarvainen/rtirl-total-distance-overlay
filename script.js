const pullKey = new URLSearchParams(window.location.search).get("key");
const firebaseConfig = {
  apiKey: "AIzaSyDsylF5lkq6rer_h8h85zKtNe95aogfans",
  authDomain: "rtirl-total-distance-overlay.firebaseapp.com",
  projectId: "rtirl-total-distance-overlay",
  storageBucket: "rtirl-total-distance-overlay.appspot.com",
  messagingSenderId: "380641450848",
  appId: "1:380641450848:web:61ca9f8f8662ee20f45c05",
};

var totalApp;
var totaldb;
var app;

var total = 0.0;
var today = 0.0;

var speedTimeout;
var speedTimeoutInMilliSeconds = 7000; // timeout to set speed to 0
var rightNow = new Date();
var currentDateId;
var sameDayUntilHour = 4; // Change if you want to use the same day until for example 4am
if (rightNow.getHours() < sameDayUntilHour) {
  rightNow.setDate(rightNow.getDate() - 1);
}
currentDateId = `${rightNow.getFullYear()}_${rightNow.getMonth()}_${rightNow.getDate()}`;

var gps = {
  old: { time: rightNow.getTime(), latitude: 0.0, longitude: 0.0 },
  new: { latitude: 0.0, longitude: 0.0 },
};

function createTodaysObj() {
  return totaldb
    .collection("distances")
    .doc(pullKey + "_" + currentDateId)
    .set(
      { date: firebase.firestore.Timestamp.fromDate(new Date()) },
      { merge: true }
    );
}

function createTotalObj() {
  return totaldb
    .collection("distances")
    .doc(pullKey)
    .set(
      { date: firebase.firestore.Timestamp.fromDate(new Date()) },
      { merge: true }
    );
}

function updateDb(distance, speed) {
  var batch = totaldb.batch();

  var todayRef = totaldb
    .collection("distances")
    .doc(pullKey + "_" + currentDateId);
  batch.update(todayRef, {
    date: firebase.firestore.Timestamp.fromDate(new Date()),
    distance: firebase.firestore.FieldValue.increment(distance),
    speed: speed,
  });

  var totalRef = totaldb.collection("distances").doc(pullKey);
  batch.update(totalRef, {
    distance: firebase.firestore.FieldValue.increment(distance),
  });

  // Commit the batch
  batch
    .commit()
    .then(() => null)
    .catch(() => null);
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2 - lat1);
  var dLon = degreesToRadians(lon2 - lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function handleLocationChange(location) {
  clearTimeout(speedTimeout);
  if (location) {
    const { latitude, longitude } = location;
    gps.new.time = new Date().getTime();
    gps.new.latitude = latitude;
    gps.new.longitude = longitude;

    if (
      gps.new.latitude &&
      gps.new.longitude &&
      gps.old.latitude &&
      gps.old.longitude
    ) {
      // We have new gps points. Let's calculate the delta distance using previously saved gps points.
      const delta = distanceInKmBetweenEarthCoordinates(
        gps.new.latitude,
        gps.new.longitude,
        gps.old.latitude,
        gps.old.longitude
      );

      // update variables
      let _speed = (delta * 1000) / ((gps.new.time - gps.old.time) / 1000);
      _speed = _speed < 70 ? _speed : 0.0;
      total += delta;
      today += delta;

      // update html
      document.getElementById("speed").innerText = _speed.toFixed(1);
      document.getElementById("today").innerText = today.toFixed(1);
      document.getElementById("total").innerText = total.toFixed(1);

      // update db
      updateDb(delta < 10 ? delta : 0, _speed);

      // update db
      updateDb(delta < 10 ? delta : 0, _speed < 70 ? _speed : 0.0);

      // after timeout if locations stop coming, set speed to 0
      speedTimeout = setTimeout(() => {
        updateDb(0, 0.0);
        document.getElementById("speed").innerText = 0.0;
      }, speedTimeoutInMilliSeconds);
    }
    //shifting new points to old for next update
    gps.old.latitude = latitude;
    gps.old.longitude = longitude;
    gps.old.time = gps.new.time;
  }
}

function addLocationListener(callback) {
  return addListener("location", callback);
}

function addListener(type, callback) {
  return app
    .database()
    .ref()
    .child("pullables")
    .child(pullKey)
    .child(type)
    .on("value", function (snapshot) {
      callback(snapshot.val());
    });
}

async function start() {
  totalApp = firebase.initializeApp(firebaseConfig);
  totaldb = firebase.firestore();

  // create objects if they don't exist
  await createTodaysObj();
  await createTotalObj();

  // get total
  await totaldb
    .collection("distances")
    .doc(pullKey)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const _distance = doc.data().distance;
        if (_distance) {
          total = doc.data().distance;
          document.getElementById("total").innerText = total.toFixed(1);
        }
      }
    })
    .catch((error) => {});

  // get daily
  await totaldb
    .collection("distances")
    .doc(pullKey + "_" + currentDateId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const _distance = doc.data().distance;
        if (_distance) {
          today = doc.data().distance;
          document.getElementById("today").innerText = today.toFixed(1);
        }
      }
    })
    .catch((error) => {});

  // init rtirl firebase
  firebase.database.INTERNAL.forceWebSockets();
  app = firebase.initializeApp(
    {
      apiKey: "AIzaSyC4L8ICZbJDufxe8bimRdB5cAulPCaYVQQ",
      databaseURL: "https://rtirl-a1d7f-default-rtdb.firebaseio.com",
      projectId: "rtirl-a1d7f",
      appId: "1:684852107701:web:d77a8ed0ee5095279a61fc",
    },
    "rtirl-api"
  );

  addLocationListener(handleLocationChange);
}

start();
