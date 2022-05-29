## rtirl-total-distance-overlay

Custom overlay for RealtimeIRL total distance, daily distance and speed

## Adding RealtimeIRL as a StreamElements overlay

Add a custom widget, open editor from the widgets settings and add copy [html](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/widgetHtml.html) [js](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/widgetJs.js) [css](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/widgetStyles.css) [fields](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/fields.json)

Replace `pullKey` in the widget js section with your own RealtimeIRL pull key.

Create a Cloud Firestore and replace the `firebaseConfig` in widget js with your own config. Consult a tutorial if you're unfamiliar with firebase e.g. [https://dev.to/napoleon039/how-to-create-a-new-firestore-database-4o25](https://dev.to/napoleon039/how-to-create-a-new-firestore-database-4o25)
