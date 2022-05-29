## rtirl-total-distance-overlay

Custom overlay for RealtimeIRL total distance, daily distance and speed.

## Adding RealtimeIRL as a StreamElements overlay

### 1. Add a Custom widget
![image](https://user-images.githubusercontent.com/33045386/170847810-955cc295-b973-4cbf-a2b3-e746b55a7c12.png)

### 2. Open editor
![image](https://user-images.githubusercontent.com/33045386/170847822-740dc34a-3c5d-44d0-a761-61de5124b5cc.png)

### 3. Copy content to correct sections
![image](https://user-images.githubusercontent.com/33045386/170847832-70ea6475-f83e-4b89-8287-59493656e2ca.png)

[html](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/widgetHtml.html), [css](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/widgetStyles.css), [js](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/widgetJs.js) and [fields](https://github.com/atarvainen/rtirl-total-distance-overlay/blob/main/fields.json).

### 4. Add your pull key
Replace `pullKey` in the widget js section with your own RealtimeIRL pull key.

### 5. Create a Cloud Firestore
Create a Cloud Firestore and replace the `firebaseConfig` in widget js with your own config. Consult a tutorial if you're unfamiliar with firebase. E.g. [https://dev.to/napoleon039/how-to-create-a-new-firestore-database-4o25](https://dev.to/napoleon039/how-to-create-a-new-firestore-database-4o25)

## Customization

Use the provided customization options in the Streamelements settings panel. For more advanced customization edit the css section.

