const { withAndroidManifest, withGradleProperties } = require('expo/config-plugins');

// 1. gradle.properties 파일을 수정하는 함수
function setGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    // 이미 값이 있어도 덮어쓰도록 설정
    config.modResults = config.modResults.filter(
      (item) =>
        !(
          item.type === 'property' &&
          (item.key === 'android.useAndroidX' ||
            item.key === 'android.enableJetifier')
        )
    );
    
    // AndroidX와 Jetifier를 강제로 활성화합니다.
    config.modResults.push({
      type: 'property',
      key: 'android.useAndroidX',
      value: 'true',
    });
    config.modResults.push({
      type: 'property',
      key: 'android.enableJetifier',
      value: 'true',
    });

    return config;
  });
}

// 2. AndroidManifest.xml 파일을 수정하는 함수 (이전과 동일)
function setAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // <manifest> 태그에 xmlns:tools 속성 추가
    if (!androidManifest.manifest.$) {
      androidManifest.manifest.$ = {};
    }
    androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // <application> 태그에 속성 추가
    if (!application.$) {
      application.$ = {};
    }
    application.$['tools:replace'] = 'android:appComponentFactory';
    application.$['android:appComponentFactory'] =
      'androidx.core.app.CoreComponentFactory';

    return config;
  });
}

// 3. 두 가지 수정을 모두 적용
module.exports = function withAndroidTools(config) {
  config = setAndroidManifest(config);
  config = setGradleProperties(config);
  return config;
};