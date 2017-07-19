const scanjsRules = {
  /** no-unsanitized rules **/
  'no-unsanitized/method': 2,
  'no-unsanitized/property': 2,

  /** ScanJS rules **/
  'scanjs-rules/assign_to_hostname': 1,
  'scanjs-rules/assign_to_href': 1,
  'scanjs-rules/assign_to_location': 1,
  'scanjs-rules/assign_to_mozAudioChannel': 1,
  'scanjs-rules/assign_to_mozAudioChannelType': 1,
  'scanjs-rules/assign_to_onmessage': 1,
  'scanjs-rules/assign_to_pathname': 1,
  'scanjs-rules/assign_to_protocol': 1,
  'scanjs-rules/assign_to_search': 1,
  'scanjs-rules/assign_to_src': 1,
  'scanjs-rules/call_Function': 1,
  'scanjs-rules/call_addEventListener': 1,
  'scanjs-rules/call_addEventListener_cellbroadcastmsgchanged': 1,
  'scanjs-rules/call_addEventListener_deviceproximity': 1,
  'scanjs-rules/call_addEventListener_message': 1,
  'scanjs-rules/call_addEventListener_moznetworkdownload': 1,
  'scanjs-rules/call_addEventListener_moznetworkupload': 1,
  'scanjs-rules/call_connect': 1,
  'scanjs-rules/call_eval': 1,
  'scanjs-rules/call_execScript': 1,
  'scanjs-rules/call_generateCRMFRequest': 1,
  'scanjs-rules/call_getDeviceStorage_apps': 1,
  'scanjs-rules/call_getDeviceStorage_crashes': 1,
  'scanjs-rules/call_getDeviceStorage_music': 1,
  'scanjs-rules/call_getDeviceStorage_pictures': 1,
  'scanjs-rules/call_getDeviceStorage_sdcard': 1,
  'scanjs-rules/call_getDeviceStorage_videos': 1,
  'scanjs-rules/call_hide': 1,
  'scanjs-rules/call_mozSetMessageHandler': 1,
  'scanjs-rules/call_mozSetMessageHandler_activity': 1,
  'scanjs-rules/call_mozSetMessageHandler_wappush_received': 1,
  'scanjs-rules/call_open_attention': 1,
  'scanjs-rules/call_open_remote=true': 1,
  'scanjs-rules/call_parseFromString': 1,
  'scanjs-rules/call_setAttribute_mozapp': 1,
  'scanjs-rules/call_setAttribute_mozbrowser': 1,
  'scanjs-rules/call_setImmediate': 1,
  'scanjs-rules/call_setInterval': 1,
  'scanjs-rules/call_setMessageHandler_connect': 1,
  'scanjs-rules/call_setTimeout': 1,
  'scanjs-rules/call_write': 1,
  'scanjs-rules/call_writeln': 1,
  'scanjs-rules/identifier_indexedDB': 1,
  'scanjs-rules/identifier_localStorage': 1,
  'scanjs-rules/identifier_sessionStorage': 1,
  'scanjs-rules/new_Function': 1,
  'scanjs-rules/new_MozActivity': 1,
  'scanjs-rules/new_MozSpeakerManager': 1,
  'scanjs-rules/new_Notification': 1,
  'scanjs-rules/object_mozSystem': 1,
  'scanjs-rules/property_addIdleObserver': 1,
  'scanjs-rules/property_createContextualFragment': 1,
  'scanjs-rules/property_geolocation': 1,
  'scanjs-rules/property_getDataStores': 1,
  'scanjs-rules/property_getDeviceStorage': 1,
  'scanjs-rules/property_getUserMedia': 1,
  'scanjs-rules/property_indexedDB': 1,
  'scanjs-rules/property_lastKnownHomeNetwork': 1,
  'scanjs-rules/property_lastKnownNetwork': 1,
  'scanjs-rules/property_localStorage': 1,
  'scanjs-rules/property_mgmt': 1,
  'scanjs-rules/property_mozAlarms': 1,
  'scanjs-rules/property_mozBluetooth': 1,
  'scanjs-rules/property_mozCameras': 1,
  'scanjs-rules/property_mozCellBroadcast': 1,
  'scanjs-rules/property_mozContacts': 1,
  'scanjs-rules/property_mozDownloadManager': 1,
  'scanjs-rules/property_mozFMRadio': 1,
  'scanjs-rules/property_mozInputMethod': 1,
  'scanjs-rules/property_mozKeyboard': 1,
  'scanjs-rules/property_mozMobileConnection': 1,
  'scanjs-rules/property_mozMobileConnections': 1,
  'scanjs-rules/property_mozMobileMessage': 1,
  'scanjs-rules/property_mozNetworkStats': 1,
  'scanjs-rules/property_mozNfc': 1,
  'scanjs-rules/property_mozNotification': 1,
  'scanjs-rules/property_mozPermissionSettings': 1,
  'scanjs-rules/property_mozPhoneNumberService': 1,
  'scanjs-rules/property_mozPower': 1,
  'scanjs-rules/property_mozSettings': 1,
  'scanjs-rules/property_mozTCPSocket': 1,
  'scanjs-rules/property_mozTelephony': 1,
  'scanjs-rules/property_mozTime': 1,
  'scanjs-rules/property_mozVoicemail': 1,
  'scanjs-rules/property_mozWifiManager': 1,
  'scanjs-rules/property_sessionStorage': 1,
};

const finalRules = {
  /** airbnb config overrides **/
  'react/jsx-filename-extension': [0],
  'import/no-extraneous-dependencies': [0],
  'class-methods-use-this': [0],
  'no-throw-literal': [0],
  'comma-dangle': ['error',
    {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    },
  ],
};

const finalPlugins = [];

let hasScanJs = false;

try {
  require('eslint-plugin-scanjs-rules'); // eslint-disable-line global-require
  hasScanJs = true;
} catch (err) {
  // eslint-disable-next-line no-console
  console.log('eslint-plugin-scanjs-rules not found, will not include scanjs rules');
}

if (hasScanJs) {
  finalPlugins.push('scanjs-rules', 'no-unsanitized');
  Object.assign(finalRules, scanjsRules);
}

module.exports = {
  extends: 'airbnb',
  plugins: finalPlugins,
  rules: finalRules,
};
