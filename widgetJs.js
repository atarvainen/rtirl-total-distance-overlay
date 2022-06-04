// ! REPLACE WITH YOUR OWN REALTIME IRL PULL KEY
const pullKey = "YOUR_PULL_KEY";
// ! REPLACE WITH YOUR OWN FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "qwerty",
  authDomain: "qwerty",
  projectId: "qwerty",
  storageBucket: "qwerty",
  messagingSenderId: "qwerty",
  appId: "qwerty",
};

// variables from streamelements settings
var dateTimezone = "Asia/Tokyo",
  altitudeMethod = "WGS84";
// streamelements variables end

var totalApp;
var totaldb;
var app;

var total = 0.0;
var today = 0.0;

var speedTimeout;
var speedTimeoutInMilliSeconds = 7000; // timeout to set speed to 0
var rightNow;
var currentDateId;
var sameDayUntilHour = 4;

var gps = {
  old: { latitude: 0.0, longitude: 0.0 },
  new: { latitude: 0.0, longitude: 0.0 },
};

function setTodaysObj(merge) {
  return totaldb
    .collection("distances")
    .doc(pullKey + "_" + currentDateId)
    .set(
      { date: firebase.firestore.Timestamp.fromDate(new Date()) },
      { merge: merge }
    );
}

function setTotalObj(merge) {
  return totaldb
    .collection("distances")
    .doc(pullKey)
    .set(
      { date: firebase.firestore.Timestamp.fromDate(new Date()) },
      { merge: merge }
    );
}

async function resetTotal() {
  await setTotalObj(false);
  total = 0.0;
  document.getElementById("total").innerText = total;
}

async function resetToday() {
  await setTodaysObj(false);
  today = 0.0;
  document.getElementById("today").innerText = today;
}

function updateDb(distance) {
  var batch = totaldb.batch();

  var todayRef = totaldb
    .collection("distances")
    .doc(pullKey + "_" + currentDateId);
  batch.update(todayRef, {
    date: firebase.firestore.Timestamp.fromDate(new Date()),
    distance: firebase.firestore.FieldValue.increment(distance),
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

function handleLocationChange(obj) {
  clearTimeout(speedTimeout);

  if (obj.altitude) {
    document.getElementById("altitude").innerText =
      obj.altitude[altitudeMethod] | 0;
  }

  // RTIRL speed
  // if (obj.speed) {
  //   const speedInKph = (obj.speed * 3.6) | 0;
  //   document.getElementById("speed").innerText =
  //     speedInKph > 0 ? speedInKph : 0;
  // }

  if (obj.location) {
    const { latitude, longitude } = obj.location;
    gps.new.time = obj.reportedAt;
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

      if (delta < 10) {
        // calculate speed
        let _speed =
          ((delta * 1000) / ((gps.new.time - gps.old.time) / 1000)) * 3.6;
        _speed = _speed < 70 ? _speed : 0.0;

        // update variables
        total += delta;
        today += delta;

        // update html
        document.getElementById("speed").innerText = _speed | 0;
        document.getElementById("today").innerText = today.toFixed(1);
        document.getElementById("total").innerText = total.toFixed(1);

        // update db
        updateDb(delta);
      }
    }
    //shifting new points to old for next update
    gps.old.latitude = latitude;
    gps.old.longitude = longitude;
    gps.old.time = gps.new.time;

    speedTimeout = setTimeout(() => {
      document.getElementById("speed").innerText = 0.0;
    }, speedTimeoutInMilliSeconds);
  }
}

function addRTIRLListener(callback) {
  return app
    .database()
    .ref()
    .child("pullables")
    .child(pullKey)
    .on("value", function (snapshot) {
      callback(snapshot.val());
    });
}

async function start(obj) {
  const fieldData = obj.detail.fieldData;
  dateTimezone = fieldData.dateTimezone || dateTimezone;

  rightNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: dateTimezone })
  );
  if (rightNow.getHours() < sameDayUntilHour) {
    rightNow.setDate(rightNow.getDate() - 1);
  }
  currentDateId = `${rightNow.getFullYear()}_${rightNow.getMonth()}_${rightNow.getDate()}`;

  totalApp = firebase.initializeApp(firebaseConfig);
  totaldb = firebase.firestore();

  // create objects if they don't exist
  await setTodaysObj(true);
  await setTotalObj(true);

  // get total
  await totaldb
    .collection("distances")
    .doc(pullKey)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const _distance = doc.data().distance;
        if (_distance) {
          total = _distance;
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
          today = _distance;
          document.getElementById("today").innerText = today.toFixed(1);
        }
      }
    })
    .catch((error) => {});

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

  addRTIRLListener(handleLocationChange);
}

window.addEventListener("onWidgetLoad", start);

window.addEventListener("onEventReceived", function (obj) {
  if (obj.detail.event.listener === "widget-button") {
    if (obj.detail.event.field === "resetTotalButton") {
      resetTotal();
    } else if (obj.detail.event.field === "resetTodayButton") {
      resetToday();
    }
  }
});
