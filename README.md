## rtirl-total-distance-overlay

Custom overlay for RealtimeIRL total distance, daily distance and speed

## Adding RealtimeIRL as a StreamElements overlay

Add a custom widget, open editor from the widgets settings and add copy content from index.html to the html section, styles.css to css section, script.js to js section, and fields.json to fields section.

Replace ```js pullKey``` in the widget js section with your own RealtimeIRL pull key.

Create a Cloud Firestore and add replace the firebaseConfig in widget js with your own config. Consult a tutorial if you're unfamiliar with firebase e.g. [https://dev.to/napoleon039/how-to-create-a-new-firestore-database-4o25](https://dev.to/napoleon039/how-to-create-a-new-firestore-database-4o25)
