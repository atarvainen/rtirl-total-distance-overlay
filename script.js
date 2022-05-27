const pullKey = new URLSearchParams(window.location.search).get("key");
const firebaseConfig = {
  apiKey: "AIzaSyDsylF5lkq6rer_h8h85zKtNe95aogfans",
  authDomain: "rtirl-total-distance-overlay.firebaseapp.com",
  projectId: "rtirl-total-distance-overlay",
  storageBucket: "rtirl-total-distance-overlay.appspot.com",
  messagingSenderId: "380641450848",
  appId: "1:380641450848:web:61ca9f8f8662ee20f45c05",
};

// // ! REPLACE WITH YOUR OWN REALTIME IRL PULL KEY
// const pullKey = "YOUR_PULL_KEY";
// // ! REPLACE WITH YOUR OWN FIREBASE CONFIG
// const firebaseConfig = {
//   apiKey: "qwety",
//   authDomain: "qwerty",
//   projectId: "qwerty",
//   storageBucket: "qwerty",
//   messagingSenderId: "qwerty",
//   appId: "qwerty",
// };

var app;
var db;

var speedTimeout;
var speedTimeoutInMilliSeconds = 5000;
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

function updateDb(db, distance, speed) {
  var batch = db.batch();

  var todayRef = db.collection("distances").doc(pullKey + "_" + currentDateId);
  batch.update(todayRef, {
    date: firebase.firestore.Timestamp.fromDate(new Date()),
    distance: firebase.firestore.FieldValue.increment(distance),
    speed: speed,
  });

  var totalRef = db.collection("distances").doc(pullKey);
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

function handleLocationChange(db, location) {
  clearTimeout(speedTimeout);
  console.log(
    "handleLocationChange1",
    pullKey,
    new Date().toString(),
    location
  );
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

      const _speed = (delta * 1000) / ((gps.new.time - gps.old.time) / 1000);
      console.log(
        "handleLocationChange2",
        new Date().toString(),
        delta,
        _speed
      );
      updateDb(db, delta, _speed < 70 ? _speed : 0.0);
      speedTimeout = setTimeout(
        () => updateDb(db, 0, 0.0),
        speedTimeoutInMilliSeconds
      );
    }
    //shifting new points to old for next update
    gps.old.latitude = latitude;
    gps.old.longitude = longitude;
    gps.old.time = gps.new.time;
    // Note that because of GPS drift, different gps points will keep comming even if
    // the subject is stationary. Each new gps point will be considered as subject is moving
    // and it will get added to the total distance. Each addition will be tiny but it will
    // addup over time and can become visible. So, at the end the shown distance might look
    // sligtly more than expected.
    // }
  }
}

function createTodaysObj(db) {
  db.collection("distances")
    .doc(pullKey + "_" + currentDateId)
    .set(
      { date: firebase.firestore.Timestamp.fromDate(new Date()) },
      { merge: true }
    )
    .then(() => addTodayListener(db));
}

function addTodayListener(db) {
  var unsubscribeToday = db
    .collection("distances")
    .doc(pullKey + "_" + currentDateId)
    .onSnapshot(
      (doc) => {
        const data = doc.data();
        if (!data) {
          unsubscribeToday();
          createTodaysObj(db);
          return;
        }
        if (data.speed !== undefined && data.speed !== null) {
          document.getElementById("speed").innerText = data.speed.toFixed(1);
        }
        if (data.distance !== undefined && data.distance !== null) {
          document.getElementById("today").innerText = data.distance.toFixed(1);
        }
      },
      (error) => {
        unsubscribeToday();
        createTodaysObj();
      }
    );
}

function createTotalObj(db) {
  db.collection("distances")
    .doc(pullKey)
    .set(
      { date: firebase.firestore.Timestamp.fromDate(new Date()) },
      { merge: true }
    )
    .then(() => addTotalListener(db));
}

function addTotalListener(db) {
  var unsubscribeTotal = db
    .collection("distances")
    .doc(pullKey)
    .onSnapshot(
      (doc) => {
        const data = doc.data();
        if (!data) {
          unsubscribeTotal();
          createTotalObj(db);
          return;
        }
        if (data.distance !== undefined && data.distance !== null) {
          document.getElementById("total").innerText = data.distance.toFixed(1);
        }
      },
      (error) => {
        unsubscribeTotal();
        createTotalObj(db);
      }
    );
}

window.addEventListener("onWidgetLoad", function (obj) {
  app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  addTodayListener(db);
  addTotalListener(db);

  RealtimeIRL.forPullKey(pullKey).addLocationListener((obj) =>
    handleLocationChange(db, obj)
  );
});

window.dispatchEvent(new Event("onWidgetLoad"));
